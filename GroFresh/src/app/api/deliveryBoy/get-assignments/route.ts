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
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = session.user.id;

    const broadcasted = await deliveryAssignmentModel
      .find({
        broadCastedTo: userId,
        status: "broadcasted",
        selectedDeliveryPerson: null,
      })
      .populate({
        path: "orderId",
        select:
          "userId items totalAmount paymentMethod isPaid deliveryAddress status createdAt updatedAt",
        populate: { path: "userId", select: "name email mobile" },
      })
      .sort({ createdAt: -1 });

    const active = await deliveryAssignmentModel
      .find({
        selectedDeliveryPerson: userId,
        status: {
          $in: [
            "assigned",
            "pickup_inprogress",
            "picked_up",
            "delivery_inprogress",
          ],
        },
      })
      .populate({
        path: "orderId",
        select:
          "userId items totalAmount paymentMethod isPaid deliveryAddress status createdAt updatedAt",
        populate: { path: "userId", select: "name email mobile" },
      })
      .sort({ updatedAt: -1 });

    const completed = await deliveryAssignmentModel
      .find({
        status: "delivered",
        $or: [
          { selectedDeliveryPerson: userId },
          {
            selectedDeliveryPerson: null,
            broadCastedTo: userId,
          },
        ],
      })
      .populate({
        path: "orderId",
        select:
          "userId items totalAmount paymentMethod isPaid deliveryAddress status createdAt updatedAt deliveredAt",
        populate: { path: "userId", select: "name email mobile" },
      })
      .sort({ deliveredAt: -1, updatedAt: -1 })
      .limit(30);

    console.log(`[get-assignments] userId=${userId} completed count=${completed.length}`);

    return NextResponse.json(
      {
        broadcasted,
        active,
        completed,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (
      error?.digest === "HANGING_PROMISE_REJECTION" ||
      error?.digest?.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("Failed to get assignments:", error);
    return NextResponse.json(
      { message: "Failed to get assignments" },
      { status: 500 }
    );
  }
}
