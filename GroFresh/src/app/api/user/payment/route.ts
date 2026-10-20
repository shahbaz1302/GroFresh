import connectDB from "@/lib/db";
import orderModel from "@/models/order.model";
import userModel from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { userId, items, totalAmount, paymentMethod, deliveryAddress } =
      await request.json();
    if (
      !userId ||
      !Array.isArray(items) ||
      items.length === 0 ||
      typeof totalAmount !== "number" ||
      !Number.isFinite(totalAmount) ||
      !paymentMethod ||
      !deliveryAddress
    ) {
      return NextResponse.json(
        { message: "All Fields are Required" },
        { status: 400 },
      );
    }
    const user = await userModel.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User Not Found" }, { status: 400 });
    }
    const order = await orderModel.create({
      userId,
      items,
      totalAmount,
      paymentMethod,
      deliveryAddress,
    });

    const session = await stripe.checkout.sessions.create({
      line_items: items.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: { name: item.name, images: [item.image] },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      metadata: { orderId: order._id.toString() },
      mode: "payment",
      success_url: `${process.env.NEXT_BASE_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_BASE_URL}/order-cancel`,
    });
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create payment session" },
      { status: 500 },
    );
  }
}
