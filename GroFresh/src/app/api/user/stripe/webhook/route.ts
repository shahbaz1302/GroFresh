import connectDB from "@/lib/db";
import orderModel from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.log("Signature verification failed", error);
  }
  if (event?.type === "checkout.session.completed") {
    const session = event.data.object;
    await connectDB();
    await orderModel.findOneAndUpdate(
      { _id: session?.metadata?.orderId },
      { isPaid: true },
      { new: true },
    );
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
