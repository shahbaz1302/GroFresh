import { emitEventHandler } from "@/lib/emitEventHandler";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import deliveryAssignmentModel from "@/models/deliveryAssignment.model";
import orderModel from "@/models/order.model";
import "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const { assignmentId } = await req.json();

    if (!assignmentId) {
      return NextResponse.json(
        { message: "Assignment ID is required" },
        { status: 400 },
      );
    }

    const assignment = await deliveryAssignmentModel.findById(assignmentId);

    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 },
      );
    }

    // Check if another driver already claimed it
    if (
      assignment.selectedDeliveryPerson &&
      assignment.selectedDeliveryPerson.toString() !== session.user.id
    ) {
      return NextResponse.json(
        {
          message:
            "Order has already been accepted by another delivery partner.",
        },
        { status: 409 },
      );
    }

    if (assignment.status === "cancelled") {
      return NextResponse.json(
        { message: "This order assignment has been cancelled." },
        { status: 400 },
      );
    }

    if (assignment.status !== "broadcasted") {
      return NextResponse.json(
        { message: "This order assignment is no longer available." },
        { status: 400 },
      );
    }

    const alreadyAssigned = await deliveryAssignmentModel.findOne({
      selectedDeliveryPerson: session.user.id,
      status: {
        $in: [
          "assigned",
          "pickup_inprogress",
          "picked_up",
          "delivery_inprogress",
        ],
      },
    });

    if (alreadyAssigned) {
      return NextResponse.json(
        { message: "You have already accepted an order" },
        { status: 409 },
      );
    }

    // Assign to current delivery boy
    assignment.selectedDeliveryPerson = session.user.id as any;
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();

    // Update corresponding order
    await orderModel.findByIdAndUpdate(assignment.orderId, {
      assignedDeliveryBoy: session.user.id,
      status: "outForDelivery",
    });

    await deliveryAssignmentModel.updateMany(
      {
        _id: { $ne: assignmentId },
        broadCastedTo: session.user.id,
        status: "broadcasted",
      },
      { $pull: { broadCastedTo: session.user.id as any } },
    );

    await emitEventHandler("order-status-update", {
      orderId: assignment.orderId.toString(),
      status: "outForDelivery",
    });

    const updated = await deliveryAssignmentModel
      .findById(assignmentId)
      .populate({
        path: "orderId",
        populate: { path: "userId", select: "name email mobile" },
      });

    return NextResponse.json(
      {
        message: "Order accepted successfully! Safe travels.",
        assignment: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Accept assignment error:", error);
    return NextResponse.json(
      { message: "Failed to accept assignment. Please try again." },
      { status: 500 },
    );
  }
}
