import { emitEventHandler } from "@/lib/emitEventHandler";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import deliveryAssignmentModel from "@/models/deliveryAssignment.model";
import orderModel from "@/models/order.model";
import "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

const VALID_STATUSES = [
  "assigned",
  "pickup_inprogress",
  "picked_up",
  "delivery_inprogress",
  "delivered",
  "cancelled",
] as const;

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { assignmentId, status } = await req.json();

    if (
      !assignmentId ||
      !status ||
      !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
    ) {
      return NextResponse.json(
        { message: "Valid assignment ID and status are required." },
        { status: 400 }
      );
    }

    const assignment = await deliveryAssignmentModel.findById(assignmentId);

    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found." },
        { status: 404 }
      );
    }

    if (
      !assignment.selectedDeliveryPerson ||
      assignment.selectedDeliveryPerson.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { message: "You are not authorized to update this delivery." },
        { status: 403 }
      );
    }

    assignment.status = status;

    if (status === "delivery_inprogress" && !assignment.outForDeliveryAt) {
      assignment.outForDeliveryAt = new Date();
    }

    if (status === "delivered") {
      assignment.deliveredAt = new Date();

      // Update Order model
      await orderModel.findByIdAndUpdate(assignment.orderId, {
        status: "delivered",
        isPaid: true, // Mark paid when delivered
      });

      await emitEventHandler("order-status-update", {
        orderId: assignment.orderId.toString(),
        status: "delivered",
      });
    }

    if (status === "cancelled") {
      await orderModel.findByIdAndUpdate(assignment.orderId, {
        status: "cancelled",
      });

      await emitEventHandler("order-status-update", {
        orderId: assignment.orderId.toString(),
        status: "cancelled",
      });
    }

    await assignment.save();

    const updated = await deliveryAssignmentModel
      .findById(assignmentId)
      .populate({
        path: "orderId",
        populate: { path: "userId", select: "name email mobile" },
      });

    return NextResponse.json(
      {
        message: `Order status updated to ${status.replace(/_/g, " ")}.`,
        assignment: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { message: "Failed to update status. Please try again." },
      { status: 500 }
    );
  }
}
