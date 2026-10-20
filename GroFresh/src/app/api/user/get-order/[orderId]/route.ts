import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import orderModel from "@/models/order.model";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  await connectDB();
  try {
    const { orderId } = await params;

    const order = await orderModel.findById(orderId).populate("assignedDeliveryBoy");

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.log("Order not fetched", error);
    return NextResponse.json(
      { message: "Failed to fetch order" },
      { status: 500 },
    );
  }
}
