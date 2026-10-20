import connectDB from "@/lib/db";
import userModel from "@/models/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const adminExists = await userModel.exists({ role: "admin" });
    return NextResponse.json({ adminExist: Boolean(adminExists) }, { status: 200 });
  } catch (error) {
    console.error("Failed to check for an existing admin:", error);
    return NextResponse.json(
      { message: "Failed to check for an existing admin" },
      { status: 500 },
    );
  }
}
