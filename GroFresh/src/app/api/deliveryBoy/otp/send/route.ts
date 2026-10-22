import connectDB from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { generateOtpEmailHtml } from "@/lib/otpEmail";
import orderModel from "@/models/order.model";
import userModel from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID is required" },
        { status: 400 },
      );
    }

    const order = await orderModel.findById(orderId).populate("userId");
    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 },
      );
    }

    // Resolve recipient customer email
    let recipientEmail = "";
    if (order.userId && typeof order.userId === "object" && "email" in order.userId) {
      recipientEmail = (order.userId as any).email;
    }

    if (!recipientEmail && order.userId) {
      const user = await userModel.findById(order.userId);
      if (user?.email) {
        recipientEmail = user.email;
      }
    }

    console.log(
      `[deliveryBoy/otp/send] Order: ${orderId}, Resolved Customer Email: "${recipientEmail}"`,
    );

    if (!recipientEmail) {
      return NextResponse.json(
        { message: "Customer email not found for this order" },
        { status: 400 },
      );
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    order.deliveryOtp = otp;
    await order.save();

    await sendMail(
      recipientEmail,
      "GroFresh — Your Delivery OTP",
      generateOtpEmailHtml(otp, orderId),
    );

    return NextResponse.json(
      { message: `OTP sent successfully to ${recipientEmail}` },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[deliveryBoy/otp/send] Error sending OTP:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to send OTP" },
      { status: 500 },
    );
  }
}
