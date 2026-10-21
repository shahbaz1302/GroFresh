import connectDB from "@/lib/db";
import orderModel from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    // Return 400 so Stripe knows delivery failed and will retry
    return NextResponse.json(
      { message: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session?.metadata?.orderId;

    if (!orderId) {
      console.error("Webhook: missing orderId in session metadata");
      return NextResponse.json({ message: "Missing orderId" }, { status: 400 });
    }

    try {
      await connectDB();
      const updated = await orderModel.findOneAndUpdate(
        { _id: orderId },
        { isPaid: true },
        { new: true },
      );
      if (!updated) {
        console.error("Webhook: order not found for id:", orderId);
      } else {
        console.log("Webhook: order marked as paid:", orderId);
      }
    } catch (dbError) {
      console.error("Webhook: DB update failed:", dbError);
      // Return 500 so Stripe retries
      return NextResponse.json(
        { message: "Database update failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
