import { emitEventHandler } from "@/lib/emitEventHandler";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import deliveryAssignmentModel from "@/models/deliveryAssignment.model";
import orderModel from "@/models/order.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const { orderId, otp } = await request.json();

    if (!orderId || !otp) {
      return NextResponse.json(
        { message: "OrderId and OTP are required." },
        { status: 400 },
      );
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 },
      );
    }

    if (order.deliveryOtp !== otp) {
      return NextResponse.json(
        { message: "Invalid OTP. Please try again." },
        { status: 400 },
      );
    }

    order.status = "delivered";
    order.deliveryOtpVerification = true;
    order.deliveredAt = new Date();
    order.deliveryOtp = null;
    if (order.paymentMethod === "cash") {
      order.isPaid = true;
    }
    await order.save();

    const orderObjectId = new mongoose.Types.ObjectId(orderId);
    const updateResult = await deliveryAssignmentModel.findOneAndUpdate(
      { orderId: orderObjectId },
      { $set: { status: "delivered", deliveredAt: new Date() } },
      { new: true },
    );

    console.log(
      "[OTP Verify] Assignment update result:",
      JSON.stringify(updateResult),
    );

    if (!updateResult) {
      console.error("[OTP Verify] No assignment found for orderId:", orderId);
    }

    await emitEventHandler("order-status-update", {
      orderId: orderId.toString(),
      status: "delivered",
    });

    return NextResponse.json(
      { message: "Delivery successfully completed!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { message: "Failed to verify OTP. Please try again." },
      { status: 500 },
    );
  }
}
