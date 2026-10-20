import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import OrdersClient, { SerializedOrder } from "@/components/OrdersClient";
import EditRoleMobile from "@/components/EditRoleMobile";
import connectDB from "@/lib/db";
import orderModel from "@/models/order.model";
import userModel from "@/models/user.model";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "My Orders | GroFresh",
  description: "Track and review all your grocery delivery orders with real-time status updates.",
};

async function OrdersContent() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  await connectDB();

  const isAdmin =
    session.user?.id === "admin" && session.user?.role === "admin";

  let navbarUser;
  let userId = session.user.id;

  if (isAdmin) {
    navbarUser = {
      name: session.user.name ?? "Admin",
      email: session.user.email ?? "",
      role: "admin" as const,
    };
  } else {
    const user = await userModel.findOne({ email: session.user.email }).lean();

    if (!user) {
      redirect("/login");
    }

    const inComplete =
      !user.mobile || !user.role || (!user.mobile && user.role === "user");

    if (inComplete) {
      return <EditRoleMobile />;
    }

    userId = user._id.toString();
    navbarUser = {
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      image: user.image,
    };
  }

  const rawOrders = await orderModel
    .find({ userId })
    .populate("assignedDeliveryBoy", "name mobile")
    .sort({ createdAt: -1 })
    .lean();

  const serializedOrders: SerializedOrder[] = rawOrders.map((order: any) => ({
    _id: order._id.toString(),
    userId: order.userId.toString(),
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          groceryId: item.groceryId?.toString() || "",
          name: item.name || "Item",
          image: item.image || "",
          price: Number(item.price) || 0,
          unit: item.unit || "unit",
          quantity: Number(item.quantity) || 1,
        }))
      : [],
    totalAmount: Number(order.totalAmount) || 0,
    paymentMethod: order.paymentMethod === "online" ? "online" : "cash",
    isPaid: Boolean(order.isPaid),
    deliveryAddress: {
      fullName: order.deliveryAddress?.fullName || "",
      phone: order.deliveryAddress?.phone || "",
      street: order.deliveryAddress?.street || "",
      city: order.deliveryAddress?.city || "",
      state: order.deliveryAddress?.state || "",
      pincode: order.deliveryAddress?.pincode || "",
      latitude: order.deliveryAddress?.latitude,
      longitude: order.deliveryAddress?.longitude,
    },
    status: (["pending", "outForDelivery", "delivered", "cancelled"].includes(
      order.status,
    )
      ? order.status
      : "pending") as SerializedOrder["status"],
    assignedDeliveryBoy: order.assignedDeliveryBoy
      ? {
          name: order.assignedDeliveryBoy.name || "",
          mobile: order.assignedDeliveryBoy.mobile || "",
        }
      : null,
    createdAt: order.createdAt
      ? new Date(order.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: order.updatedAt
      ? new Date(order.updatedAt).toISOString()
      : new Date().toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#f7f8f4] flex flex-col">
      <Navbar user={navbarUser} />
      <main className="flex-1">
        <OrdersClient initialOrders={serializedOrders} />
      </main>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div
          aria-live="polite"
          className="min-h-screen bg-[#f7f8f4] flex flex-col items-center justify-center p-6 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e2ebd9] border-t-[#4f7d43]" />
          <p className="mt-4 text-sm font-semibold text-[#546b57]">
            Loading your orders...
          </p>
        </div>
      }>
      <OrdersContent />
    </Suspense>
  );
}
