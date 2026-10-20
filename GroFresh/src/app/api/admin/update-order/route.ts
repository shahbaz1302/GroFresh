import connectDB from "@/lib/db";
import { emitEventHandler } from "@/lib/emitEventHandler";
import deliveryAssignmentModel from "@/models/deliveryAssignment.model";
import orderModel from "@/models/order.model";
import userModel from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { orderId, status, isPaid } = await request.json();
    const validStatuses = [
      "pending",
      "outForDelivery",
      "delivered",
      "cancelled",
    ] as const;

    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID is required" },
        { status: 400 },
      );
    }

    if (
      (status !== undefined &&
        !validStatuses.includes(status as (typeof validStatuses)[number])) ||
      (isPaid !== undefined && typeof isPaid !== "boolean") ||
      (status === undefined && isPaid === undefined)
    ) {
      return NextResponse.json(
        { message: "A valid status or payment status is required" },
        { status: 400 },
      );
    }

    const order = await orderModel.findById(orderId).populate("userId");

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    let deliveryBoysPayload: {
      id: string;
      name: string;
      phone: string;
      latitude: number;
      longitude: number;
    }[] = [];

    if (status === "outForDelivery") {
      if (order.assignment) {
        const existingAssignment = await deliveryAssignmentModel
          .findById(order.assignment)
          .select("broadCastedTo");
        const assignedCandidates = await userModel.find(
          {
            _id: { $in: existingAssignment?.broadCastedTo ?? [] },
            role: "deliveryBoy",
          },
          "name mobile location",
        );
        deliveryBoysPayload = assignedCandidates.map((deliveryBoy) => ({
          id: deliveryBoy._id.toString(),
          name: deliveryBoy.name,
          phone: deliveryBoy.mobile ?? "",
          latitude: deliveryBoy.location.coordinates[1],
          longitude: deliveryBoy.location.coordinates[0],
        }));
      } else {
        const { latitude, longitude } = order.deliveryAddress;
        const nearbyDeliveryBoys = await userModel.find({
          role: "deliveryBoy",
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: [longitude, latitude] },
              $maxDistance: 10000,
            },
          },
        });
        const ids = nearbyDeliveryBoys.map((deliveryBoy) => deliveryBoy._id);
        const busyDeliveryBoys = await deliveryAssignmentModel
          .find({
            selectedDeliveryPerson: { $in: ids },
            status: {
              $in: [
                "assigned",
                "pickup_inprogress",
                "picked_up",
                "delivery_inprogress",
              ],
            },
          })
          .distinct("selectedDeliveryPerson");
        const busyIds = new Set(busyDeliveryBoys.map((id) => id.toString()));
        const availableDeliveryBoys = nearbyDeliveryBoys.filter(
          (deliveryBoy) => !busyIds.has(deliveryBoy._id.toString()),
        );
        const candidates = availableDeliveryBoys.map((b) => b._id.toString());
        if (candidates.length === 0) {
          await emitEventHandler("order-status-update", {
            orderId: order._id.toString(),
            status: order.status,
          });
          return NextResponse.json(
            { message: "No available delivery boys found" },
            { status: 409 },
          );
        }
        const deliveryAssignment = await deliveryAssignmentModel.create({
          orderId: order._id,
          broadCastedTo: candidates,
          status: "broadcasted",
        });

        await deliveryAssignment.populate("orderId");
        for (const boyId of candidates) {
          const boy = await userModel.findById(boyId).select("socketId");
          if (boy?.socketId) {
            await emitEventHandler(
              "new-order-available",
              deliveryAssignment,
              boy.socketId,
            );
          }
        }

        order.assignment = deliveryAssignment._id;
        deliveryBoysPayload = availableDeliveryBoys.map((deliveryBoy) => ({
          id: deliveryBoy._id.toString(),
          name: deliveryBoy.name,
          phone: deliveryBoy.mobile ?? "",
          latitude: deliveryBoy.location.coordinates[1],
          longitude: deliveryBoy.location.coordinates[0],
        }));
      }
    }

    if (status !== undefined) {
      order.status = status;
    }
    if (isPaid !== undefined) {
      order.isPaid = isPaid;
    }

    await order.save();

    await emitEventHandler("order-status-update", {
      orderId: order._id.toString(),
      status: order.status,
    });

    return NextResponse.json(
      {
        orderId: order._id.toString(),
        status: order.status,
        isPaid: order.isPaid,
        assignment: order.assignment?.toString() ?? null,
        availableBoys: deliveryBoysPayload,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { message: "Failed to update status", error },
      { status: 500 },
    );
  }
}
