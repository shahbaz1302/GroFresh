"use client";

import { getSocket } from "@/lib/socket";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Filter,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  Truck,
  User,
  WalletCards,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface PopulatedUser {
  _id: string;
  name?: string;
  email?: string;
  mobile?: string;
  image?: string;
  role?: string;
}

interface OrderItem {
  groceryId: string;
  name: string;
  image: string;
  price: number;
  unit: string;
  quantity: number;
}

interface AdminOrder {
  _id: string;
  userId?: PopulatedUser | string | null;
  assignedDeliveryBoy?: PopulatedUser | string | null;
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

interface UpdateOrderResponse {
  orderId: string;
  status: AdminOrder["status"];
  isPaid: boolean;
  assignment: string | null;
  availableBoys: {
    id: string;
    name: string;
    phone: string;
    latitude: number;
    longitude: number;
  }[];
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

const statusConfig: Record<
  AdminOrder["status"],
  {
    label: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    stripe: string;
    icon: typeof Clock;
  }
> = {
  pending: {
    label: "Pending",
    description: "Order placed · Needs packing",
    badgeBg: "bg-[#fff7ed]",
    badgeText: "text-[#c2410c]",
    badgeBorder: "border-[#fed7aa]",
    stripe: "bg-[linear-gradient(90deg,#fbbf24,#f59e0b)]",
    icon: Clock,
  },
  outForDelivery: {
    label: "Out for Delivery",
    description: "With delivery partner",
    badgeBg: "bg-[#eff6ff]",
    badgeText: "text-[#1d4ed8]",
    badgeBorder: "border-[#bfdbfe]",
    stripe: "bg-[linear-gradient(90deg,#60a5fa,#2563eb)]",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    description: "Handed over to customer",
    badgeBg: "bg-[#edf7ed]",
    badgeText: "text-[#2e7d32]",
    badgeBorder: "border-[#c8e6c9]",
    stripe: "bg-[linear-gradient(90deg,#9ccf73,#55883d)]",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    description: "Order was voided",
    badgeBg: "bg-[#fef2f2]",
    badgeText: "text-[#dc2626]",
    badgeBorder: "border-[#fecaca]",
    stripe: "bg-[#f87171]",
    icon: XCircle,
  },
};

export default function ManageOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(
    {},
  );

  const fetchOrders = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const response = await axios.get("/api/admin/get-orders");
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      }
      if (isManualRefresh) {
        toast.success("Orders refreshed");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const handleStatusChange = async (
    orderId: string,
    newStatus: AdminOrder["status"],
  ) => {
    setUpdatingId(orderId);
    try {
      const response = await axios.post<UpdateOrderResponse>(
        "/api/admin/update-order",
        { orderId, status: newStatus },
      );
      console.log(response.data);

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, status: response.data.status }
            : order,
        ),
      );
      toast.success(
        `Status updated to ${statusConfig[response.data.status].label}`,
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message ?? "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentToggle = async (orderId: string, currentPaid: boolean) => {
    setUpdatingId(orderId);
    try {
      const response = await axios.post<UpdateOrderResponse>(
        "/api/admin/update-order",
        { orderId, isPaid: !currentPaid },
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, isPaid: response.data.isPaid }
            : order,
        ),
      );
      toast.success(
        response.data.isPaid ? "Marked as Paid" : "Marked as Due / Unpaid",
      );
    } catch (error) {
      console.error("Failed to update payment status:", error);
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message ?? "Failed to update payment status");
    } finally {
      setUpdatingId(null);
    }
  };

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Order ID copied");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Metrics
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const outForDelivery = orders.filter(
      (o) => o.status === "outForDelivery",
    ).length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const totalRevenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      total,
      pending,
      outForDelivery,
      delivered,
      cancelled,
      totalRevenue,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // Payment filter
      if (paymentFilter !== "all") {
        if (paymentFilter === "paid" && !order.isPaid) return false;
        if (paymentFilter === "unpaid" && order.isPaid) return false;
        if (paymentFilter === "cash" && order.paymentMethod !== "cash")
          return false;
        if (paymentFilter === "online" && order.paymentMethod !== "online")
          return false;
      }

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const shortId = order._id.slice(-8).toLowerCase();
        const matchesId =
          order._id.toLowerCase().includes(query) || shortId.includes(query);

        const customer =
          typeof order.userId === "object" && order.userId
            ? order.userId
            : null;
        const matchesCustomer =
          customer?.name?.toLowerCase().includes(query) ||
          customer?.email?.toLowerCase().includes(query) ||
          customer?.mobile?.toLowerCase().includes(query);

        const matchesAddress =
          order.deliveryAddress?.fullName?.toLowerCase().includes(query) ||
          order.deliveryAddress?.phone?.toLowerCase().includes(query) ||
          order.deliveryAddress?.city?.toLowerCase().includes(query) ||
          order.deliveryAddress?.street?.toLowerCase().includes(query);

        const matchesItem = order.items?.some((item) =>
          item.name.toLowerCase().includes(query),
        );

        if (!matchesId && !matchesCustomer && !matchesAddress && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, paymentFilter, search]);

  useEffect((): any => {
    const socket = getSocket();

    const handleNewOrder = (order: any) => {
      setOrders((prev) => [order, ...prev]);
    };

    const handleStatusUpdate = (data: { orderId: string; status: any }) => {
      if (!data?.orderId) return;
      setOrders((prev) =>
        prev.map((order) =>
          order._id === data.orderId
            ? { ...order, status: data.status }
            : order,
        ),
      );
      void fetchOrders();
    };

    socket.on("new-order", handleNewOrder);
    socket.on("order-status-update", handleStatusUpdate);
    socket.on("order-status-updated", handleStatusUpdate);

    return () => {
      socket.off("new-order", handleNewOrder);
      socket.off("order-status-update", handleStatusUpdate);
      socket.off("order-status-updated", handleStatusUpdate);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#f4f8f0] px-4 py-8 font-sans text-[#183b2b] sm:px-6 sm:py-10 lg:px-8">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-16 h-80 w-80 rounded-full bg-[#dfeec8]/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-40 h-96 w-96 rounded-full bg-[#f6e7c7]/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Navigation & Header */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#dce8d4] bg-white px-4 py-2.5 text-sm font-semibold text-[#547d46] shadow-sm transition hover:border-[#b6cda8] hover:bg-[#f8fbf5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]/60">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#dce8d4] bg-white px-4 py-2.5 text-xs font-bold text-[#446b38] shadow-sm transition hover:border-[#b6cda8] hover:bg-[#f8fbf5] disabled:opacity-50">
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#547d46] ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              {refreshing ? "Refreshing..." : "Refresh Feed"}
            </button>
            <Link
              href="/groceries"
              className="inline-flex items-center gap-2 rounded-full border border-[#dce8d4] bg-white px-4 py-2.5 text-xs font-bold text-[#446b38] shadow-sm transition hover:border-[#b6cda8] hover:bg-[#f8fbf5]">
              <Package className="h-3.5 w-3.5 text-[#547d46]" />
              View Inventory
            </Link>
          </div>
        </div>

        {/* Page Title & Hero */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#eaf3e3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#547d46]">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Admin Operations
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Manage <span className="text-[#76a85b]">Orders</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#718575] sm:text-base">
              Track customer orders, assign fulfillment stages, and monitor live
              grocery deliveries.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-[#e5ecdf] bg-white px-5 py-3 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef5e8] text-[#547d46]">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#78887b]">
                Total Orders
              </span>
              <p className="text-xl font-black text-[#183b2b]">
                {loading ? "..." : stats.total}
              </p>
            </div>
          </div>
        </header>

        {/* Operational Metrics Cards */}
        <section
          aria-label="Order statistics"
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          <div className="rounded-2xl border border-[#e5ecdf] bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8a7d]">
              Total Orders
            </p>
            <p className="mt-1 text-2xl font-black text-[#183b2b]">
              {loading ? "—" : stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5ecdf] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8a7d]">
                Pending
              </p>
              {stats.pending > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-amber-500 ring-4 ring-amber-100" />
              )}
            </div>
            <p className="mt-1 text-2xl font-black text-[#c2410c]">
              {loading ? "—" : stats.pending}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5ecdf] bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8a7d]">
              Out for Delivery
            </p>
            <p className="mt-1 text-2xl font-black text-[#1d4ed8]">
              {loading ? "—" : stats.outForDelivery}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5ecdf] bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8a7d]">
              Delivered
            </p>
            <p className="mt-1 text-2xl font-black text-[#2e7d32]">
              {loading ? "—" : stats.delivered}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-[#e5ecdf] bg-white p-4 shadow-sm sm:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8a7d]">
              Gross Revenue
            </p>
            <p className="mt-1 text-2xl font-black text-[#264b32]">
              {loading ? "—" : currency.format(stats.totalRevenue)}
            </p>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section
          aria-label="Filters and search"
          className="mb-7 flex flex-col gap-4 rounded-3xl border border-[#e5ecdf] bg-white p-4 shadow-sm sm:p-5">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All Orders", count: stats.total },
                { id: "pending", label: "Pending", count: stats.pending },
                {
                  id: "outForDelivery",
                  label: "Out for Delivery",
                  count: stats.outForDelivery,
                },
                { id: "delivered", label: "Delivered", count: stats.delivered },
                { id: "cancelled", label: "Cancelled", count: stats.cancelled },
              ].map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#638a50] ${
                      active
                        ? "bg-[#284936] text-white shadow-sm"
                        : "bg-[#f4f7f2] text-[#556957] hover:bg-[#eaf1e6] hover:text-[#284936]"
                    }`}>
                    {tab.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-white text-[#5d7360]"
                      }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Payment Filter dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#718575]">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                aria-label="Filter by payment method"
                className="cursor-pointer rounded-xl border border-[#dce8d4] bg-[#f8fbf5] px-3 py-1.5 text-xs font-semibold text-[#284936] outline-none transition focus:border-[#76a85b] focus:ring-2 focus:ring-[#eaf3e3]">
                <option value="all">All Payment Methods</option>
                <option value="paid">Paid Only</option>
                <option value="unpaid">Unpaid / COD Due</option>
                <option value="online">Online Payment</option>
                <option value="cash">Cash on Delivery</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b988c]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, customer name, email, phone, city, or item name..."
              className="w-full rounded-2xl border border-[#dce8d4] bg-[#fbfdfa] py-2.5 pl-10 pr-10 text-xs font-medium text-[#183b2b] placeholder:text-[#9ea99f] transition focus:border-[#76a85b] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#eaf3e3]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#869688] hover:text-[#294b35]">
                Clear
              </button>
            )}
          </div>
        </section>

        {/* Orders Listing */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[#e5ecdf] bg-white py-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#547d46]" />
            <p className="mt-4 text-sm font-bold text-[#284936]">
              Loading orders...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[#e5ecdf] bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f2f6ee] text-[#547d46] ring-8 ring-[#f7faf4]">
              <ShoppingBag className="h-9 w-9" />
            </div>
            <h3 className="mt-5 text-xl font-bold tracking-tight text-[#183b2b]">
              No orders found
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#718575]">
              {search || statusFilter !== "all" || paymentFilter !== "all"
                ? "No orders match the selected filters. Try resetting the search or filter options."
                : "No customer orders have been placed yet."}
            </p>
            {(search || statusFilter !== "all" || paymentFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPaymentFilter("all");
                }}
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#dce8d4] bg-white px-5 py-2.5 text-xs font-bold text-[#446b38] hover:bg-[#f8fbf5]">
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => {
              const cfg = statusConfig[order.status] ?? statusConfig.pending;
              const StatusIcon = cfg.icon;
              const isExpanded = expandedOrders[order._id] ?? false;
              const shortId = order._id.slice(-8).toUpperCase();
              const isUpdating = updatingId === order._id;

              const customer =
                typeof order.userId === "object" && order.userId
                  ? order.userId
                  : null;

              return (
                <article
                  key={order._id}
                  className="overflow-hidden rounded-3xl border border-[#e5ecdf] bg-white shadow-[0_10px_30px_-25px_rgba(24,59,43,0.3)] transition hover:border-[#ccdcc4]">
                  {/* Status Indicator Stripe */}
                  <div className={`h-1.5 w-full ${cfg.stripe}`} />

                  {/* Card Header */}
                  <div className="border-b border-[#f0f3ed] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left: ID & Metadata */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#869788]">
                            Order
                          </span>
                          <span className="font-mono text-base font-black text-[#183b2b]">
                            #{shortId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyOrderId(order._id)}
                            title="Copy full MongoDB Order ID"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#e4ebe0] bg-[#f9fbf8] px-2 py-0.5 text-[11px] font-semibold text-[#547d46] hover:bg-[#edf4e8]">
                            {copiedId === order._id ? (
                              <>
                                <Check className="h-3 w-3 text-green-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy ID</span>
                              </>
                            )}
                          </button>

                          <span className="text-xs text-[#c5cfc3]">•</span>

                          <span className="inline-flex items-center gap-1.5 text-xs text-[#718575]">
                            <Calendar className="h-3.5 w-3.5 text-[#88988a]" />
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        {/* Customer Info row */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#526557]">
                          <span className="inline-flex items-center gap-1.5 font-bold text-[#284936]">
                            <User className="h-3.5 w-3.5 text-[#547d46]" />
                            {customer?.name ||
                              order.deliveryAddress?.fullName ||
                              "Customer"}
                          </span>
                          {customer?.email && (
                            <span className="text-[#78887b]">
                              ({customer.email})
                            </span>
                          )}
                          {(customer?.mobile ||
                            order.deliveryAddress?.phone) && (
                            <span className="inline-flex items-center gap-1 font-semibold text-[#446b38]">
                              <Phone className="h-3 w-3" />
                              {customer?.mobile || order.deliveryAddress?.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Payment badge & Status modifier */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Payment Pill & Toggle */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                              order.isPaid
                                ? "border-[#cce5cc] bg-[#f2faf2] text-[#2c7a36]"
                                : "border-[#fed7aa] bg-[#fffaf0] text-[#b45309]"
                            }`}>
                            <WalletCards className="h-3.5 w-3.5" />
                            {order.paymentMethod === "online"
                              ? "Online"
                              : "Cash"}{" "}
                            · {order.isPaid ? "Paid" : "Unpaid"}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handlePaymentToggle(order._id, order.isPaid)
                            }
                            disabled={isUpdating}
                            title="Toggle payment paid/unpaid status"
                            className="inline-flex cursor-pointer items-center rounded-full border border-[#dce8d4] bg-white px-2 py-1 text-[10px] font-bold text-[#547d46] transition hover:bg-[#f8fbf5] disabled:opacity-50">
                            {order.isPaid ? "Mark Unpaid" : "Mark Paid"}
                          </button>
                        </div>

                        {/* Current Status Badge */}
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{cfg.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Action Controls: Change Status */}
                    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#e8ece4] bg-[#f8fbf5] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#637966]">
                          Update Status:
                        </span>
                        {isUpdating && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#547d46]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Saving...
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { id: "pending", label: "Pending (Packing)" },
                          { id: "outForDelivery", label: "Out for Delivery" },
                          { id: "delivered", label: "Delivered" },
                          { id: "cancelled", label: "Cancelled" },
                        ].map((s) => {
                          const isCurrent = order.status === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  order._id,
                                  s.id as AdminOrder["status"],
                                )
                              }
                              disabled={isCurrent || isUpdating}
                              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#547d46] ${
                                isCurrent
                                  ? "bg-[#284936] text-white shadow-sm"
                                  : "border border-[#dce8d4] bg-white text-[#526557] hover:border-[#b6cda8] hover:bg-[#f4f7f1]"
                              } disabled:cursor-not-allowed disabled:opacity-60`}>
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Order Details */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-b border-[#f0f3ed] bg-[#fafcf8] p-5 sm:p-6">
                        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                          {/* Items List */}
                          <div>
                            <div className="mb-3 flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b8a7d]">
                                Ordered Items ({order.items.length})
                              </h4>
                              <span className="text-xs font-bold text-[#547d46]">
                                Total Amount:{" "}
                                {currency.format(order.totalAmount)}
                              </span>
                            </div>

                            <div className="divide-y divide-[#edf1ea] rounded-2xl border border-[#e5ecdf] bg-white">
                              {order.items.map((item, itemIdx) => (
                                <div
                                  key={`${order._id}-item-${itemIdx}`}
                                  className="flex items-center gap-3.5 p-3 sm:p-4">
                                  <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-xl border border-[#e8eee4] bg-[#f8faf6]">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[#8da08e]">
                                        <Package className="h-5 w-5" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <h5 className="truncate text-sm font-bold text-[#183b2b]">
                                      {item.name}
                                    </h5>
                                    <p className="mt-0.5 text-xs text-[#718575]">
                                      {item.unit} ·{" "}
                                      {currency.format(item.price)} each
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <span className="inline-block rounded-lg bg-[#eef5e8] px-2 py-0.5 text-xs font-bold text-[#547d46]">
                                      {item.quantity}×
                                    </span>
                                    <p className="mt-1 text-sm font-extrabold text-[#183b2b]">
                                      {currency.format(
                                        item.price * item.quantity,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delivery Address & Customer Details */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#7b8a7d]">
                                Delivery Address & Coordinates
                              </h4>
                              <div className="rounded-2xl border border-[#e5ecdf] bg-white p-4">
                                <div className="flex items-start gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef5e8] text-[#547d46]">
                                    <MapPin className="h-4.5 w-4.5" />
                                  </span>
                                  <div className="min-w-0 text-xs text-[#526557]">
                                    <p className="font-extrabold text-[#183b2b]">
                                      {order.deliveryAddress?.fullName ||
                                        customer?.name ||
                                        "Recipient"}
                                    </p>
                                    <p className="mt-1 text-[#627364]">
                                      {order.deliveryAddress?.street}
                                    </p>
                                    <p className="text-[#627364]">
                                      {order.deliveryAddress?.city}
                                      {order.deliveryAddress?.state
                                        ? `, ${order.deliveryAddress.state}`
                                        : ""}
                                      {order.deliveryAddress?.pincode
                                        ? ` - ${order.deliveryAddress.pincode}`
                                        : ""}
                                    </p>
                                    {order.deliveryAddress?.phone && (
                                      <p className="mt-2 inline-flex items-center gap-1.5 font-bold text-[#446b38]">
                                        <Phone className="h-3 w-3" />
                                        {order.deliveryAddress.phone}
                                      </p>
                                    )}

                                    {order.deliveryAddress?.latitude &&
                                      order.deliveryAddress?.longitude && (
                                        <div className="mt-3 pt-2 border-t border-[#edf1ea]">
                                          <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#547d46] hover:underline">
                                            <ExternalLink className="h-3 w-3" />
                                            View location on Google Maps
                                          </a>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {order.assignedDeliveryBoy &&
                              typeof order.assignedDeliveryBoy === "object" && (
                                <div className="rounded-2xl border border-[#dce8d4] bg-[#f5faf1] p-4">
                                  <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#66805f]">
                                    Assigned Delivery Partner
                                  </h4>
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f1dd] text-[#547d46]">
                                      <Truck className="h-4.5 w-4.5" />
                                    </span>
                                    <div className="min-w-0 text-xs text-[#526557]">
                                      <p className="font-extrabold text-[#183b2b]">
                                        {order.assignedDeliveryBoy.name ||
                                          "Delivery partner"}
                                      </p>
                                      {order.assignedDeliveryBoy.mobile && (
                                        <a
                                          href={`tel:${order.assignedDeliveryBoy.mobile}`}
                                          className="mt-1 inline-flex items-center gap-1.5 font-bold text-[#446b38] hover:underline">
                                          <Phone className="h-3 w-3" />
                                          {order.assignedDeliveryBoy.mobile}
                                        </a>
                                      )}
                                      {order.assignedDeliveryBoy.email && (
                                        <p className="mt-1">
                                          {order.assignedDeliveryBoy.email}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                            {/* Summary Box */}
                            <div className="rounded-2xl border border-[#e5ecdf] bg-white p-4 text-xs">
                              <h4 className="mb-2 font-bold text-[#183b2b]">
                                Financial Summary
                              </h4>
                              <div className="space-y-1.5 text-[#6c7d6e]">
                                <div className="flex justify-between">
                                  <span>Payment Gateway:</span>
                                  <span className="font-bold text-[#183b2b] capitalize">
                                    {order.paymentMethod === "online"
                                      ? "Stripe / Online"
                                      : "Cash On Delivery"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Settlement Status:</span>
                                  <span
                                    className={`font-bold ${
                                      order.isPaid
                                        ? "text-green-700"
                                        : "text-amber-700"
                                    }`}>
                                    {order.isPaid
                                      ? "Settled / Paid"
                                      : "Collection Pending"}
                                  </span>
                                </div>
                                <div className="flex justify-between border-t border-dashed border-[#e4eae0] pt-1.5 text-sm font-extrabold text-[#183b2b]">
                                  <span>Order Total:</span>
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

                  {/* Card Bottom Bar */}
                  <div className="flex items-center justify-between bg-white px-5 py-3 sm:px-6">
                    <button
                      type="button"
                      onClick={() => toggleExpand(order._id)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold text-[#627464] transition hover:bg-[#f2f6ee] hover:text-[#284936]">
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          View Items & Delivery Address ({order.items.length})
                        </>
                      )}
                    </button>

                    <div className="text-right">
                      <span className="text-xs text-[#718575]">Total: </span>
                      <strong className="text-sm font-black text-[#183b2b]">
                        {currency.format(order.totalAmount)}
                      </strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
