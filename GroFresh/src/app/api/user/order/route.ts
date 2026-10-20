import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { emitEventHandler } from "@/lib/emitEventHandler";
import orderModel from "@/models/order.model";
import userModel from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await userModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const orders = await orderModel
      .find({ userId: user._id })
      .populate("assignedDeliveryBoy", "name mobile")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching orders", error },
      { status: 500 },
    );
  }
}

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
    await order.save();
    await emitEventHandler("new-order",order)
    return NextResponse.json(
      { message: "Order Placed Successfully", order },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ message: "Error", error }, { status: 500 });
  }
}
