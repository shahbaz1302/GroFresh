import mongoose from "mongoose";

export interface IDeliveryAssignment {
  orderId: mongoose.Types.ObjectId;
  broadCastedTo: Array<mongoose.Types.ObjectId>;
  selectedDeliveryPerson: mongoose.Types.ObjectId | null;
  status:
    | "broadcasted"
    | "assigned"
    | "pickup_inprogress"
    | "picked_up"
    | "delivery_inprogress"
    | "delivered"
    | "cancelled";
  acceptedAt: Date;
  outForDeliveryAt: Date;
  deliveredAt: Date;
}

const deliveryAssignmentSchema = new mongoose.Schema<IDeliveryAssignment>(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    broadCastedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    selectedDeliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: [
        "broadcasted",
        "assigned",
        "pickup_inprogress",
        "picked_up",
        "delivery_inprogress",
        "delivered",
        "cancelled",
      ],
      default: "broadcasted",
    },
    acceptedAt: { type: Date },
    outForDeliveryAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

const deliveryAssignmentModel =
  mongoose.models.DeliveryAssignment ||
  mongoose.model("DeliveryAssignment", deliveryAssignmentSchema);

export default deliveryAssignmentModel;
