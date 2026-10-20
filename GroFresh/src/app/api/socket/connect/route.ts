import connectDB from "@/lib/db";
import userModel from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { userId, socketId } = await request.json();
    const user = await userModel.findByIdAndUpdate(
      userId,
      { socketId, isOnline: true },
      { new: true },
    );
    if (!user) {
      return NextResponse.json(
        { message: "Failed to register" },
        { status: 404 },
      );
    }
    return NextResponse.json({ message: "registered" }, { status: 200 });
  } catch (error) {
    console.error("Failed to register socket connection:", error);
    return NextResponse.json(
      { message: "Failed to register" },
      { status: 500 },
    );
  }
}
