import connectDB from "@/lib/db";
import orderModel from "@/models/order.model";
import userModel from "@/models/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    // Ensure User model is loaded for Mongoose populate
    const _ = userModel;
    const orders = await orderModel
      .find()
      .populate("userId", "name email mobile image role")
      .populate("assignedDeliveryBoy", "name email mobile image role")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Error in get-orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
