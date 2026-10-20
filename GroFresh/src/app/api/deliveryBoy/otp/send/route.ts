import connectDB from "@/lib/db";
import { sendMail } from "@/lib/mail";
import orderModel from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { orderId } = await request.json();
    const order = await orderModel.findById(orderId).populate("userId");
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    order.deliveryOtp = otp;
    await order.save();
    await sendMail(
      order.userId.email,
      "Delivery OTP",
      `<h2>Your delivery otp is <strong>${otp}</strong></h2>`,
    );
    return NextResponse.json(
      { message: "OTP send successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to send OTP" },
      { status: 500 },
    );
  }
}
