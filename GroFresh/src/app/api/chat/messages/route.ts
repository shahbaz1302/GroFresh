import connectDB from "@/lib/db";
import messageModel from "@/models/message.model";
import orderModel from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { roomId } = await request.json();
    const room = await orderModel.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { message: `Chat room not found` },
        { status: 404 },
      );
    }
    const messages = await messageModel.find({ roomId: room._id });
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `Failed to get messages ${error}` },
      { status: 500 },
    );
  }
}
