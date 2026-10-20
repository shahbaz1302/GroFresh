import { auth } from "@/auth";
import connectDB from "@/lib/db";
import userModel from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const { role, mobile } = await request.json();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" });
    }
    const user = await userModel.findOneAndUpdate(
      { email: session?.user?.email },
      { role, mobile },
      { new: true },
    );
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `Error while updating role ${error}` },
      { status: 500 },
    );
  }
}
