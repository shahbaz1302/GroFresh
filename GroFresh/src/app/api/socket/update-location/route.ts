import connectDB from "@/lib/db";
import userModel from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { userId, location } = await request.json();
    if (!userId || !location) {
      return NextResponse.json(
        { message: "Missing User Id or Location" },
        { status: 404 },
      );
    }
    const user = await userModel.findByIdAndUpdate(
      userId,
      { location },
      { new: true },
    );
    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "location updated", user },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { message: "failed to update profile" },
      { status: 500 },
    );
  }
}
