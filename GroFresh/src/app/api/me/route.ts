import { auth } from "@/auth";
import userModel from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session?.user) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }
    const user = await userModel
      .findOne({ email: session.user.email })
      .select("-password");
    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `Get user failed: ${error}` },
      { status: 500 },
    );
  }
}
