import { auth } from "@/auth";
import connectDB from "@/lib/db";
import deliveryAssignmentModel from "@/models/deliveryAssignment.model";
import "@/models/order.model";
import "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const userId = session.user.id;

    // Raw: all assignments where this user appears in any field
    const all = await deliveryAssignmentModel
      .find({
        $or: [
          { selectedDeliveryPerson: userId },
          { broadCastedTo: userId },
        ],
      })
      .lean();

    return NextResponse.json({ userId, total: all.length, assignments: all });
  } catch (error) {
    return NextResponse.json({ message: String(error) }, { status: 500 });
  }
}
