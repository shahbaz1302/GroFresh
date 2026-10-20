import mongoose from "mongoose";

export interface IOrder {
  id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: [
    {
      groceryId: mongoose.Types.ObjectId;
      name: string;
      image: string;
      price: number;
      unit: string;
      quantity: number;
    },
  ];
  totalAmount: number;
  paymentMethod: "online" | "cash";
  isPaid: boolean;
  deliveryAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
  assignment?: mongoose.Types.ObjectId | null;
  assignedDeliveryBoy?: mongoose.Types.ObjectId | null;
  status: "pending" | "outForDelivery" | "delivered" | "cancelled";
  deliveryOtp: string | null;
  deliveryOtpVerification: boolean;
  deliveredAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderSchema = new mongoose.Schema<IOrder>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        groceryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Grocery",
          required: true,
        },
        name: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        unit: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["online", "cash"], required: true },
    isPaid: { type: Boolean, default: false },
    deliveryAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "outForDelivery", "delivered", "cancelled"],
      default: "pending",
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAssignment",
      default: null,
    },
    assignedDeliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deliveryOtp: { type: String, default: null },
    deliveryOtpVerification: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

const orderModel =
  mongoose.models.Order || mongoose.model("Order", orderSchema);

export default orderModel;
