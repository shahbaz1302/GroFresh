"use client";

import { getSocket } from "@/lib/socket";
import { setCartData } from "@/redux/cartSlice";
import axios from "axios";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

export interface OrderItem {
  groceryId: string;
  name: string;
  image: string;
  price: number;
  unit: string;
  quantity: number;
}

export interface SerializedOrder {
  _id: string;
  userId: string;
  assignedDeliveryBoy?: { name?: string; mobile?: string } | null;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: "online" | "cash";
  isPaid: boolean;
  deliveryAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state?: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  };
  status: "pending" | "outForDelivery" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const getStatusBadge = (status: SerializedOrder["status"]) => {
  switch (status) {
    case "pending":
      return {
        label: "Order Placed",
        sublabel: "Packing groceries",
        bg: "bg-[#fff7ed]",
        text: "text-[#c2410c]",
        border: "border-[#fed7aa]",
        icon: Clock,
      };
    case "outForDelivery":
      return {
        label: "Out for Delivery",
        sublabel: "On the way to your door",
        bg: "bg-[#eff6ff]",
        text: "text-[#1d4ed8]",
        border: "border-[#bfdbfe]",
        icon: Truck,
      };
    case "delivered":
      return {
        label: "Delivered",
        sublabel: "Handed over safely",
        bg: "bg-[#edf7ed]",
        text: "text-[#2e7d32]",
        border: "border-[#c8e6c9]",
        icon: CheckCircle2,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        sublabel: "Order voided",
        bg: "bg-[#fef2f2]",
        text: "text-[#dc2626]",
        border: "border-[#fecaca]",
        icon: XCircle,
      };
    default:
      return {
        label: status,
        sublabel: "",
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-200",
        icon: Package,
      };
  }
};

const getProgressStep = (status: SerializedOrder["status"]) => {
  switch (status) {
    case "pending":
      return 1;
    case "outForDelivery":
      return 2;
    case "delivered":
      return 3;
    case "cancelled":
      return -1;
    default:
      return 1;
  }
};

export default function OrdersClient({
  initialOrders,
}: {
  initialOrders: SerializedOrder[];
}) {
  const [orders, setOrders] = useState<SerializedOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "delivered" | "cancelled"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(
    {},
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const dispatch = useDispatch();
  const router = useRouter();

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    void refreshOrders(false);
  }, []);

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Order ID copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleReorder = (items: OrderItem[]) => {
    items.forEach((item) => {
      dispatch(
        setCartData({
          _id: item.groceryId,
          name: item.name,
          category: "grocery",
          image: item.image,
          price: item.price,
          unit: item.unit,
          quantity: item.quantity,
        }),
      );
    });
    toast.success(
      `Added ${items.length} ${items.length === 1 ? "item" : "items"} to your basket!`,
    );
  };

  const refreshOrders = async (showToast = true) => {
    setIsRefreshing(true);
    try {
      const response = await axios.get("/api/user/order");
      if (response.data?.orders) {
        const serialized: SerializedOrder[] = response.data.orders.map(
          (order: any) => ({
            _id: order._id?.toString() || order._id,
            userId: order.userId?.toString() || order.userId,
            items: Array.isArray(order.items)
              ? order.items.map((item: any) => ({
                  groceryId: item.groceryId?.toString() || item.groceryId || "",
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
            status: ([
              "pending",
              "outForDelivery",
              "delivered",
              "cancelled",
            ].includes(order.status)
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
          }),
        );
        setOrders(serialized);
        if (showToast) {
          toast.success("Orders updated");
        }
      }
    } catch {
      toast.error("Failed to refresh orders");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === "active") {
        if (order.status !== "pending" && order.status !== "outForDelivery") {
          return false;
        }
      } else if (activeTab === "delivered") {
        if (order.status !== "delivered") return false;
      } else if (activeTab === "cancelled") {
        if (order.status !== "cancelled") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = order._id.toLowerCase().includes(query);
        const matchesItem = order.items.some((item) =>
          item.name.toLowerCase().includes(query),
        );
        const matchesAddress =
          order.deliveryAddress?.city?.toLowerCase().includes(query) ||
          order.deliveryAddress?.street?.toLowerCase().includes(query);
        if (!matchesId && !matchesItem && !matchesAddress) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter(
      (o) => o.status === "pending" || o.status === "outForDelivery",
    ).length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const totalSpend = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return { total, active, delivered, cancelled, totalSpend };
  }, [orders]);

  // Real-time: order STATUS updates (delivery boy progressing through stages)
  useEffect(() => {
    const socket = getSocket();

    const handleStatusUpdate = (data: { orderId: string; status: any }) => {
      if (!data?.orderId) return;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === data.orderId
            ? { ...order, status: data.status }
            : order,
        ),
      );
      void refreshOrders(false);
      toast.success("Order status updated!");
    };

    socket.on("order-status-update", handleStatusUpdate);
    socket.on("order-status-updated", handleStatusUpdate);

    return () => {
      socket.off("order-status-update", handleStatusUpdate);
      socket.off("order-status-updated", handleStatusUpdate);
    };
  }, []);

  // Real-time: NEW order placed — immediately show it without page refresh
  useEffect(() => {
    const socket = getSocket();

    const handleNewOrder = (newOrder: any) => {
      if (!newOrder?._id) {
        // If payload is incomplete, just do a full refresh
        void refreshOrders(false);
        return;
      }

      // Serialize the incoming order to match SerializedOrder shape
      const serialized: SerializedOrder = {
        _id: newOrder._id?.toString() || newOrder._id,
        userId: newOrder.userId?.toString() || newOrder.userId || "",
        items: Array.isArray(newOrder.items)
          ? newOrder.items.map((item: any) => ({
              groceryId: item.groceryId?.toString() || item.groceryId || "",
              name: item.name || "Item",
              image: item.image || "",
              price: Number(item.price) || 0,
              unit: item.unit || "unit",
              quantity: Number(item.quantity) || 1,
            }))
          : [],
        totalAmount: Number(newOrder.totalAmount) || 0,
        paymentMethod: newOrder.paymentMethod === "online" ? "online" : "cash",
        isPaid: Boolean(newOrder.isPaid),
        deliveryAddress: {
          fullName: newOrder.deliveryAddress?.fullName || "",
          phone: newOrder.deliveryAddress?.phone || "",
          street: newOrder.deliveryAddress?.street || "",
          city: newOrder.deliveryAddress?.city || "",
          state: newOrder.deliveryAddress?.state || "",
          pincode: newOrder.deliveryAddress?.pincode || "",
          latitude: newOrder.deliveryAddress?.latitude,
          longitude: newOrder.deliveryAddress?.longitude,
        },
        status: "pending",
        assignedDeliveryBoy: null,
        createdAt: newOrder.createdAt
          ? new Date(newOrder.createdAt).toISOString()
          : new Date().toISOString(),
        updatedAt: newOrder.updatedAt
          ? new Date(newOrder.updatedAt).toISOString()
          : new Date().toISOString(),
      };

      // Prepend to list (newest first) — avoid duplicates
      setOrders((prev) => {
        if (prev.some((o) => o._id === serialized._id)) return prev;
        return [serialized, ...prev];
      });

      toast.success("New order placed! 🛒", { id: "new-order" });
    };

    socket.on("new-order", handleNewOrder);
    socket.on("order-created", handleNewOrder);

    return () => {
      socket.off("new-order", handleNewOrder);
      socket.off("order-created", handleNewOrder);
    };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#f7f8f4] px-4 pb-16 pt-6 text-[#263a2d] sm:px-6 sm:pt-8 lg:px-8">
      {/* Background ambient accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-[#dfeec8]/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-60 h-96 w-96 rounded-full bg-[#f6e7c7]/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Top Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col justify-between gap-4 border-b border-[#e5ecdf] pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f1e1] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#4f7d43]">
                <PackageCheck className="h-3.5 w-3.5" />
                Customer Account
              </span>
              <span className="text-xs font-semibold text-[#8b988c]">
                · {orders.length} Total{" "}
                {orders.length === 1 ? "Order" : "Orders"}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#263a2d] sm:text-4xl">
              My Orders
            </h1>
            <p className="mt-1.5 text-sm text-[#738374]">
              Track live deliveries, view receipts, and reorder your grocery
              favorites.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void refreshOrders()}
              disabled={isRefreshing}
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#e4ebe0] bg-white px-4 py-2.5 text-xs font-bold text-[#4d6652] shadow-sm transition hover:border-[#c1d5b3] hover:bg-[#f7faf4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#eaf3e3] disabled:opacity-50">
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#5e8b4d] ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#4f7d43] px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(53,99,53,0.8)] transition hover:bg-[#3f6b37] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]">
              <ShoppingBag className="h-3.5 w-3.5" />
              Shop More
            </Link>
          </div>
        </motion.div>

        {/* Quick Statistics Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-[#e8ece4] bg-white p-4 shadow-[0_6px_20px_-18px_rgba(39,67,47,0.25)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#869688]">
              Total Orders
            </p>
            <p className="mt-1 text-2xl font-black text-[#263a2d]">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e8ece4] bg-white p-4 shadow-[0_6px_20px_-18px_rgba(39,67,47,0.25)]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#869688]">
                In Progress
              </p>
              {stats.active > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-[#16a34a] ring-4 ring-[#bbf7d0]" />
              )}
            </div>
            <p className="mt-1 text-2xl font-black text-[#1d4ed8]">
              {stats.active}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e8ece4] bg-white p-4 shadow-[0_6px_20px_-18px_rgba(39,67,47,0.25)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#869688]">
              Delivered
            </p>
            <p className="mt-1 text-2xl font-black text-[#2e7d32]">
              {stats.delivered}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e8ece4] bg-white p-4 shadow-[0_6px_20px_-18px_rgba(39,67,47,0.25)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#869688]">
              Total Spent
            </p>
            <p className="mt-1 text-2xl font-black text-[#294b35]">
              {currency.format(stats.totalSpend)}
            </p>
          </div>
        </motion.div>

        {/* Filters and Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mb-6 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
          {/* Status Tabs */}
          <div className="flex overflow-x-auto rounded-2xl border border-[#e2e8dc] bg-[#edebe4]/40 p-1.5 scrollbar-none">
            {[
              { id: "all", label: "All Orders", count: stats.total },
              { id: "active", label: "Active", count: stats.active },
              { id: "delivered", label: "Delivered", count: stats.delivered },
              { id: "cancelled", label: "Cancelled", count: stats.cancelled },
            ].map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.id as "all" | "active" | "delivered" | "cancelled",
                    )
                  }
                  className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#638a50] ${
                    selected
                      ? "bg-white text-[#294b35] shadow-[0_3px_10px_-4px_rgba(41,75,53,0.25)]"
                      : "text-[#6c7d6e] hover:text-[#284936]"
                  }`}>
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                      selected
                        ? "bg-[#e8f1e1] text-[#4f7d43]"
                        : "bg-[#e4eae0] text-[#788779]"
                    }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-65 md:w-72">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b988c]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID or item..."
              aria-label="Search orders"
              className="w-full rounded-2xl border border-[#e2e8dc] bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#263a2d] placeholder:text-[#9ea99f] transition focus:border-[#638a50] focus:outline-none focus:ring-4 focus:ring-[#eaf3e3]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#869688] hover:text-[#294b35]">
                Clear
              </button>
            )}
          </div>
        </motion.div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-[#e8ece4] bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f2f6ee] text-[#5e8b4d] ring-8 ring-[#f7faf4]">
              <ShoppingBag className="h-9 w-9" />
            </div>
            <h3 className="mt-5 text-xl font-bold tracking-tight text-[#263a2d]">
              {searchQuery ? "No matching orders found" : "No orders here yet"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#738374]">
              {searchQuery
                ? `We couldn't find any orders matching "${searchQuery}". Try a different keyword.`
                : "Looks like you haven't placed an order in this category yet. Explore our fresh grocery selection!"}
            </p>
            <div className="mt-6 flex gap-3">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded-2xl border border-[#e2e8dc] bg-white px-5 py-2.5 text-xs font-bold text-[#445b48] hover:bg-[#f6f9f3]">
                  Reset Search
                </button>
              ) : (
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#4f7d43] px-6 py-3 text-sm font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(53,99,53,0.8)] transition hover:bg-[#3f6b37]">
                  Start Shopping
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => {
              const badge = getStatusBadge(order.status);
              const StatusIcon = badge.icon;
              const step = getProgressStep(order.status);
              const isExpanded = expandedOrders[order._id] ?? false; // Default expanded for easy viewing
              const shortId = order._id.slice(-8).toUpperCase();

              return (
                <motion.article
                  key={order._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="overflow-hidden rounded-3xl border border-[#e8ece4] bg-white shadow-[0_12px_35px_-28px_rgba(39,67,47,0.35)] transition hover:border-[#d7e2d1]">
                  {/* Top Bar with Accent Line */}
                  <div
                    className={`h-1.5 w-full ${
                      order.status === "delivered"
                        ? "bg-[linear-gradient(90deg,#9ccf73,#6ca24e)]"
                        : order.status === "outForDelivery"
                          ? "bg-[linear-gradient(90deg,#60a5fa,#2563eb)]"
                          : order.status === "cancelled"
                            ? "bg-red-400"
                            : "bg-[linear-gradient(90deg,#fbbf24,#f59e0b)]"
                    }`}
                  />

                  {/* Order Card Header */}
                  <div className="border-b border-[#f0f3ed] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a978b]">
                            Order ID
                          </span>
                          <span className="font-mono text-sm font-black text-[#263a2d]">
                            #{shortId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyOrderId(order._id)}
                            title="Copy full order ID"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#e4ebe0] bg-[#f9fbf8] px-2 py-0.5 text-[11px] font-semibold text-[#5e7462] hover:bg-[#edf4e8] hover:text-[#284936]">
                            {copiedId === order._id ? (
                              <>
                                <Check className="h-3 w-3 text-green-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <span className="hidden text-xs text-[#c5cfc3] sm:inline">
                            •
                          </span>

                          <span className="inline-flex items-center gap-1.5 text-xs text-[#768577]">
                            <Calendar className="h-3.5 w-3.5 text-[#95a396]" />
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[#89978b]">
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "items"} · Total:{" "}
                          <strong className="font-bold text-[#294b35]">
                            {currency.format(order.totalAmount)}
                          </strong>
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Payment Pill */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                            order.paymentMethod === "online" || order.isPaid
                              ? "border-[#cce5cc] bg-[#f2faf2] text-[#2c7a36]"
                              : "border-[#fed7aa] bg-[#fffaf0] text-[#b45309]"
                          }`}>
                          <WalletCards className="h-3.5 w-3.5" />
                          {order.paymentMethod === "online"
                            ? "Paid Online"
                            : "Cash on Delivery"}
                        </span>

                        {/* Order Status Badge */}
                        <div
                          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold ${badge.bg} ${badge.text} ${badge.border}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{badge.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stepped Progress Tracker (For non-cancelled orders) */}
                    {order.status !== "cancelled" && (
                      <div className="mt-6 border-t border-dashed border-[#edf2ea] pt-5">
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            {
                              label: "Order Placed",
                              desc: "Order confirmed",
                              completed: step >= 1,
                              current: step === 1,
                            },
                            {
                              label: "Out for Delivery",
                              desc: "On the way",
                              completed: step >= 2,
                              current: step === 2,
                            },
                            {
                              label: "Delivered",
                              desc: "Delivered to door",
                              completed: step >= 3,
                              current: step === 3,
                            },
                          ].map((s, sIdx) => (
                            <div key={s.label} className="relative">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                    s.completed
                                      ? "bg-[#4f7d43] text-white ring-4 ring-[#eaf3e3]"
                                      : "border border-[#d7e0d3] bg-[#f4f7f2] text-[#93a093]"
                                  }`}>
                                  {s.completed ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    sIdx + 1
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <p
                                    className={`truncate text-xs font-bold ${
                                      s.completed
                                        ? "text-[#284936]"
                                        : "text-[#93a093]"
                                    }`}>
                                    {s.label}
                                  </p>
                                  <p className="hidden truncate text-[10px] text-[#869688] sm:block">
                                    {s.desc}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.status === "cancelled" && (
                      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                        <span>
                          This order was cancelled. If you were charged online,
                          your refund will reflect in 3-5 business days.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Toggle Content (Items + Delivery Address) */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-b border-[#f0f3ed] bg-[#fafcf8] p-5 sm:p-6">
                        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                          {/* Order Items */}
                          <div>
                            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#869688]">
                              Items in this order
                            </h4>
                            <div className="divide-y divide-[#edf1ea] rounded-2xl border border-[#e8ece4] bg-white">
                              {order.items.map((item, i) => (
                                <div
                                  key={`${order._id}-item-${i}`}
                                  className="flex items-center gap-3.5 p-3 sm:p-4">
                                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#e9eee5] bg-[#f8faf6]">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[#8da08e]">
                                        <Package className="h-6 w-6" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h5 className="truncate text-sm font-bold text-[#263a2d]">
                                      {item.name}
                                    </h5>
                                    <p className="mt-0.5 text-xs text-[#829283]">
                                      {item.unit} ·{" "}
                                      {currency.format(item.price)} each
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="inline-block rounded-lg bg-[#edf4e8] px-2 py-0.5 text-xs font-bold text-[#4f7d43]">
                                      {item.quantity}×
                                    </span>
                                    <p className="mt-1 text-sm font-extrabold text-[#294b35]">
                                      {currency.format(
                                        item.price * item.quantity,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delivery Address & Summary */}
                          <div className="space-y-4">
                            {order.assignedDeliveryBoy && (
                              <>
                                <div className="rounded-2xl border border-[#dce8d4] bg-[#f5faf1] p-4">
                                  <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#66805f]">
                                    Delivery Partner
                                  </h4>
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f1dd] text-[#558249]">
                                      <Truck className="h-4.5 w-4.5" />
                                    </span>
                                    <div className="min-w-0 text-xs">
                                      <p className="font-extrabold text-[#263a2d]">
                                        {order.assignedDeliveryBoy.name ||
                                          "Delivery partner"}
                                      </p>
                                      {order.assignedDeliveryBoy.mobile && (
                                        <a
                                          href={`tel:${order.assignedDeliveryBoy.mobile}`}
                                          className="mt-1 inline-flex items-center gap-1.5 font-semibold text-[#486b40] hover:underline">
                                          <Phone className="h-3 w-3" />
                                          {order.assignedDeliveryBoy.mobile}
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    router.push(`/track-order/${order._id}`)
                                  }
                                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#4f7d43] py-2.5 text-xs font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(53,99,53,0.8)] transition hover:bg-[#3f6b37] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]">
                                  <Truck className="h-4 w-4" />
                                  Track Order
                                </button>
                              </>
                            )}

                            {/* Price Breakdown */}
                            <div className="rounded-2xl border border-[#e8ece4] bg-white p-4 text-xs">
                              <h4 className="mb-2 font-bold text-[#445b48]">
                                Payment Details
                              </h4>
                              <div className="space-y-1.5 text-[#6c7d6e]">
                                <div className="flex justify-between">
                                  <span>Payment Mode:</span>
                                  <span className="font-semibold text-[#294b35] capitalize">
                                    {order.paymentMethod}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Payment Status:</span>
                                  <span
                                    className={`font-semibold ${
                                      order.isPaid
                                        ? "text-green-700"
                                        : "text-amber-700"
                                    }`}>
                                    {order.isPaid ? "Paid" : "Due on Delivery"}
                                  </span>
                                </div>
                                <div className="border-t border-dashed border-[#e4eae0] pt-1.5 flex justify-between font-extrabold text-[#263a2d] text-sm">
                                  <span>Total Paid</span>
                                  <span>
                                    {currency.format(order.totalAmount)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Card Bottom Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:px-6">
                    <button
                      type="button"
                      onClick={() => toggleExpand(order._id)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#627464] transition hover:bg-[#f2f6ee] hover:text-[#284936]">
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          View Items ({order.items.length})
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReorder(order.items)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#f2f6ee] px-4 py-2 text-xs font-extrabold text-[#3a6731] transition hover:bg-[#e4eedd] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#eaf3e3]">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Order Again
                      </button>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-[#e2e8dc] bg-white px-3.5 py-2 text-xs font-bold text-[#556957] transition hover:bg-[#f7faf4] hover:text-[#294b35]">
                        <Sparkles className="h-3 w-3 text-[#7ea85d]" />
                        Explore Store
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
