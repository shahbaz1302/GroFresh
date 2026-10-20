"use client";

import { getSocket } from "@/lib/socket";
import axios from "axios";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Flame,
  IndianRupee,
  Layers,
  MapPin,
  Package,
  Phone,
  PlusCircle,
  Radio,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

interface StatSummary {
  totalRevenue: number;
  paidRevenue: number;
  cashRevenue: number;
  onlineRevenue: number;
  deliveredRevenue: number;
  totalOrders: number;
  nonCancelledOrdersCount: number;
  averageOrderValue: number;
  statusCounts: {
    pending: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
  };
  today: { revenue: number; orders: number; delivered: number };
  week: { revenue: number; orders: number };
  month: { revenue: number; orders: number };
  fleet: { totalDeliveryBoys: number; onlineDeliveryBoys: number };
  catalog: { totalGroceries: number; totalCategories: number };
  totalCustomers: number;
}

interface TrendDataPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  delivered: number;
}

interface HourlyDataPoint {
  hour: number;
  label: string;
  revenue: number;
  orders: number;
}

interface TopItem {
  name: string;
  image: string;
  unit: string;
  quantity: number;
  revenue: number;
}

interface DeliveryBoy {
  _id: string;
  name: string;
  mobile?: string;
  email: string;
  image?: string;
  isOnline: boolean;
}

interface RecentOrder {
  _id: string;
  totalAmount: number;
  status: "pending" | "outForDelivery" | "delivered" | "cancelled";
  paymentMethod: "online" | "cash";
  isPaid: boolean;
  createdAt: string;
  itemsCount: number;
  customerName: string;
  customerPhone?: string;
  deliveryBoyName?: string | null;
  deliveryCity?: string;
  isNew?: boolean;
}

interface LiveEvent {
  id: string;
  type: "new_order" | "status_update" | "fleet_update";
  title: string;
  description: string;
  time: string;
  amount?: number;
  status?: string;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatINR = (val: number) => currency.format(val || 0);

type TimeFilter = "today" | "week" | "month" | "all";

const AdminDashboard = () => {
  const [summary, setSummary] = useState<StatSummary | null>(null);
  const [dailyTrend, setDailyTrend] = useState<TrendDataPoint[]>([]);
  const [todayHourly, setTodayHourly] = useState<HourlyDataPoint[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<TopItem[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [chartMode, setChartMode] = useState<"revenue" | "orders">("revenue");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchOrderQuery, setSearchOrderQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(
    null,
  );
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Web Audio Chime synthesizer for new orders
  const playSoundChime = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio playback might be restricted before first gesture
    }
  }, [soundEnabled]);

  // Fetch stats from backend API
  const fetchDashboardStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const { data } = await axios.get("/api/admin/dashboard-stats");
      setSummary(data.summary);
      setDailyTrend(data.dailyTrend || []);
      setTodayHourly(data.todayHourly || []);
      setTopSellingItems(data.topSellingItems || []);
      setDeliveryBoys(data.deliveryBoysList || []);
      setRecentOrders(data.recentOrders || []);
      setLastRefreshedAt(new Date());

      if (isManualRefresh) {
        toast.success("Dashboard metrics synced with database!");
      }
    } catch (err: unknown) {
      console.error("Failed to load admin stats:", err);
      toast.error("Failed to sync dashboard statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Real-time Socket.io integration
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setSocketConnected(true);
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    if (socket.connected) {
      setSocketConnected(true);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Event 1: New order placed by customer
    const handleNewOrder = (newOrderData: any) => {
      playSoundChime();
      const orderAmount = Number(newOrderData.totalAmount) || 0;
      const orderId = newOrderData._id || `ORD-${Date.now()}`;
      const customerName =
        newOrderData.deliveryAddress?.fullName ||
        newOrderData.userId?.name ||
        "Customer";

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } flex items-center gap-3 bg-[#183b2b] text-white p-3.5 rounded-2xl shadow-xl border border-[#76a85b]/40`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5d8d4c] text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-[#eaf5dc]">New Order Received!</p>
              <p className="text-xs text-white/80">
                {customerName} • {formatINR(orderAmount)}
              </p>
            </div>
          </div>
        ),
        { duration: 4000 },
      );

      // Prepend to live activity events
      const newLiveEvent: LiveEvent = {
        id: `event-${Date.now()}-${Math.random()}`,
        type: "new_order",
        title: `New Order Placed (${formatINR(orderAmount)})`,
        description: `${customerName} ordered ${newOrderData.items?.length || 1} items`,
        time: "Just now",
        amount: orderAmount,
        status: "pending",
      };
      setLiveEvents((prev) => [newLiveEvent, ...prev.slice(0, 19)]);

      // Dynamically update recent orders
      const formattedRecentOrder: RecentOrder = {
        _id: orderId,
        totalAmount: orderAmount,
        status: (newOrderData.status as any) || "pending",
        paymentMethod: newOrderData.paymentMethod || "online",
        isPaid: Boolean(newOrderData.isPaid),
        createdAt: newOrderData.createdAt || new Date().toISOString(),
        itemsCount: newOrderData.items?.length || 1,
        customerName,
        customerPhone: newOrderData.deliveryAddress?.phone,
        deliveryCity: newOrderData.deliveryAddress?.city || "",
        isNew: true,
      };

      setRecentOrders((prev) => [formattedRecentOrder, ...prev.slice(0, 14)]);

      // Dynamically increment summary
      setSummary((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalRevenue: prev.totalRevenue + orderAmount,
          totalOrders: prev.totalOrders + 1,
          nonCancelledOrdersCount: prev.nonCancelledOrdersCount + 1,
          paidRevenue: newOrderData.isPaid
            ? prev.paidRevenue + orderAmount
            : prev.paidRevenue,
          cashRevenue:
            newOrderData.paymentMethod === "cash"
              ? prev.cashRevenue + orderAmount
              : prev.cashRevenue,
          onlineRevenue:
            newOrderData.paymentMethod === "online"
              ? prev.onlineRevenue + orderAmount
              : prev.onlineRevenue,
          statusCounts: {
            ...prev.statusCounts,
            pending: prev.statusCounts.pending + 1,
          },
          today: {
            ...prev.today,
            revenue: prev.today.revenue + orderAmount,
            orders: prev.today.orders + 1,
          },
          week: {
            ...prev.week,
            revenue: prev.week.revenue + orderAmount,
            orders: prev.week.orders + 1,
          },
          month: {
            ...prev.month,
            revenue: prev.month.revenue + orderAmount,
            orders: prev.month.orders + 1,
          },
          averageOrderValue: Math.round(
            (prev.totalRevenue + orderAmount) /
              (prev.nonCancelledOrdersCount + 1 || 1),
          ),
        };
      });
    };

    // Event 2: Order status update (broadcasted across socket server)
    const handleStatusUpdate = (payload: any) => {
      const orderId = payload.orderId || payload.order?._id;
      const newStatus = payload.status || payload.order?.status;
      if (!orderId || !newStatus) return;

      // Update in recent orders list
      setRecentOrders((prev) =>
        prev.map((ord) => {
          if (ord._id === orderId) {
            return {
              ...ord,
              status: newStatus,
              isPaid:
                payload.isPaid !== undefined
                  ? Boolean(payload.isPaid)
                  : ord.isPaid,
            };
          }
          return ord;
        }),
      );

      // Add to live events ticker
      const statusTitle =
        newStatus === "outForDelivery"
          ? "🚚 Order Dispatched"
          : newStatus === "delivered"
            ? "✅ Order Delivered"
            : newStatus === "cancelled"
              ? "❌ Order Cancelled"
              : "Order Status Updated";

      setLiveEvents((prev) => [
        {
          id: `status-${Date.now()}-${Math.random()}`,
          type: "status_update",
          title: statusTitle,
          description: `Order #${String(orderId).slice(-6)} is now marked as ${newStatus}`,
          time: "Just now",
          status: newStatus,
        },
        ...prev.slice(0, 19),
      ]);

      // Re-fetch to guarantee full aggregates stay aligned
      void fetchDashboardStats(false);
    };

    // Event 3: Delivery partner online/location updates
    const handleFleetLocation = (payload: any) => {
      if (payload?.userId) {
        setDeliveryBoys((prev) =>
          prev.map((b) =>
            b._id === payload.userId ? { ...b, isOnline: true } : b,
          ),
        );
      }
    };

    socket.on("new-order", handleNewOrder);
    socket.on("order-created", handleNewOrder);
    socket.on("order-status-update", handleStatusUpdate);
    socket.on("order-status-updated", handleStatusUpdate);
    socket.on("update-deliveryBoy-location", handleFleetLocation);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new-order", handleNewOrder);
      socket.off("order-created", handleNewOrder);
      socket.off("order-status-update", handleStatusUpdate);
      socket.off("order-status-updated", handleStatusUpdate);
      socket.off("update-deliveryBoy-location", handleFleetLocation);
    };
  }, [fetchDashboardStats, playSoundChime]);

  // Compute active metrics based on timeFilter
  const activeMetrics = useMemo(() => {
    if (!summary) {
      return { revenue: 0, orders: 0, delivered: 0, aov: 0, label: "All Time" };
    }

    switch (timeFilter) {
      case "today":
        return {
          revenue: summary.today.revenue,
          orders: summary.today.orders,
          delivered: summary.today.delivered,
          aov:
            summary.today.orders > 0
              ? Math.round(summary.today.revenue / summary.today.orders)
              : 0,
          label: "Today's",
        };
      case "week":
        return {
          revenue: summary.week.revenue,
          orders: summary.week.orders,
          delivered: Math.round(summary.week.orders * 0.8),
          aov:
            summary.week.orders > 0
              ? Math.round(summary.week.revenue / summary.week.orders)
              : 0,
          label: "Past 7 Days",
        };
      case "month":
        return {
          revenue: summary.month.revenue,
          orders: summary.month.orders,
          delivered: Math.round(summary.month.orders * 0.85),
          aov:
            summary.month.orders > 0
              ? Math.round(summary.month.revenue / summary.month.orders)
              : 0,
          label: "This Month's",
        };
      default:
        return {
          revenue: summary.totalRevenue,
          orders: summary.totalOrders,
          delivered: summary.statusCounts.delivered,
          aov: summary.averageOrderValue,
          label: "All-Time",
        };
    }
  }, [summary, timeFilter]);

  // Filter recent orders for display
  const filteredOrders = useMemo(() => {
    return recentOrders.filter((order) => {
      const matchQuery =
        !searchOrderQuery ||
        order._id.toLowerCase().includes(searchOrderQuery.toLowerCase()) ||
        order.customerName
          .toLowerCase()
          .includes(searchOrderQuery.toLowerCase()) ||
        (order.deliveryCity &&
          order.deliveryCity
            .toLowerCase()
            .includes(searchOrderQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [recentOrders, searchOrderQuery, statusFilter]);

  // CSV Report Exporter
  const exportToCSV = () => {
    if (!recentOrders.length) {
      toast.error("No order data available to export");
      return;
    }

    const headers = [
      "Order ID",
      "Customer",
      "City",
      "Total Amount (INR)",
      "Status",
      "Payment Method",
      "Paid",
      "Date",
    ];

    const rows = recentOrders.map((o) => [
      o._id,
      `"${o.customerName}"`,
      `"${o.deliveryCity || "N/A"}"`,
      o.totalAmount,
      o.status,
      o.paymentMethod,
      o.isPaid ? "Yes" : "No",
      new Date(o.createdAt).toLocaleString("en-IN"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `GroFresh_Admin_Report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders report exported as CSV!");
  };

  // SVG Chart Calculations for 7-day trend
  const chartData = useMemo(() => {
    if (timeFilter === "today") {
      // Use hourly data points
      const points = todayHourly.map((h) => ({
        label: h.label,
        value: chartMode === "revenue" ? h.revenue : h.orders,
        revenue: h.revenue,
        orders: h.orders,
      }));
      return points;
    } else {
      // Use daily trend data points
      const points = dailyTrend.map((d) => ({
        label: d.label,
        value: chartMode === "revenue" ? d.revenue : d.orders,
        revenue: d.revenue,
        orders: d.orders,
      }));
      return points;
    }
  }, [dailyTrend, todayHourly, timeFilter, chartMode]);

  const maxChartVal = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.value), 0);
    return max === 0 ? 100 : max * 1.15;
  }, [chartData]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f8f0] px-4 py-16 text-[#183b2b]">
        <div className="mx-auto max-w-7xl">
          {/* Skeleton Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 animate-pulse rounded-2xl bg-[#e3eed9]" />
              <div className="h-4 w-96 animate-pulse rounded-xl bg-[#e3eed9]/70" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-28 animate-pulse rounded-full bg-[#e3eed9]" />
              <div className="h-10 w-32 animate-pulse rounded-full bg-[#e3eed9]" />
            </div>
          </div>

          {/* Skeleton Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-3xl border border-[#e8eee3] bg-white p-6 shadow-sm"
              />
            ))}
          </div>

          {/* Skeleton Chart */}
          <div className="mt-8 h-96 animate-pulse rounded-3xl border border-[#e8eee3] bg-white p-6 shadow-sm" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f8f0] font-sans text-[#183b2b] pb-20">
      {/* Top Banner / Navigation breadcrumb */}
      <div className="border-b border-[#e5ecdf] bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#718575]">
              <span>Administration</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#a3b3a6]" />
              <span className="text-[#3f6d3b]">Real-Time Analytics</span>
            </div>
            <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[#183b2b] sm:text-3xl">
              Admin Command Center
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dcebd0] bg-[#eaf5dc] px-3 py-1 text-xs font-bold text-[#386434]">
                <Sparkles className="h-3.5 w-3.5 text-[#5d8d4c]" />
                Live Hub
              </span>
            </h1>
          </div>

          {/* Real-time Status Badge & Controls */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Live Socket Status */}
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                socketConnected
                  ? "border-[#cce5be] bg-[#f0f8ec] text-[#2c6527]"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
              title={
                socketConnected
                  ? "Connected to real-time events stream"
                  : "Connecting to real-time socket server..."
              }>
              <span className="relative flex h-2.5 w-2.5">
                {socketConnected && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5d8d4c] opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    socketConnected ? "bg-[#468233]" : "bg-amber-500"
                  }`}
                />
              </span>
              <span>
                {socketConnected ? "Live Connected" : "Connecting..."}
              </span>
            </div>

            {/* Audio Alert Toggle */}
            <button
              type="button"
              onClick={() => {
                setSoundEnabled((v) => !v);
                toast(
                  soundEnabled ? "Audio alerts muted" : "Audio alerts enabled!",
                  { icon: soundEnabled ? "🔇" : "🔔" },
                );
              }}
              aria-label={
                soundEnabled
                  ? "Mute order sound alerts"
                  : "Unmute order sound alerts"
              }
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                soundEnabled
                  ? "border-[#dcebd0] bg-white text-[#426e3f] hover:bg-[#f5f9f1]"
                  : "border-[#e0e4dd] bg-[#f2f4f0] text-[#838d82] hover:bg-white"
              }`}>
              {soundEnabled ? (
                <Volume2 className="h-4.5 w-4.5" />
              ) : (
                <VolumeX className="h-4.5 w-4.5" />
              )}
            </button>

            {/* Sync Refresh Button */}
            <button
              type="button"
              disabled={refreshing}
              onClick={() => void fetchDashboardStats(true)}
              className="flex items-center gap-2 rounded-full border border-[#dcebd0] bg-white px-3.5 py-2 text-xs font-bold text-[#426e3f] shadow-sm transition hover:border-[#b8d4a5] hover:bg-[#f5f9f1] active:scale-95 disabled:opacity-60">
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#426e3f]" : ""}`}
              />
              <span className="hidden sm:inline">
                {refreshing ? "Syncing..." : "Sync Data"}
              </span>
            </button>

            {/* Export CSV Report */}
            <button
              type="button"
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-full border border-[#dcebd0] bg-white px-3.5 py-2 text-xs font-bold text-[#426e3f] shadow-sm transition hover:border-[#b8d4a5] hover:bg-[#f5f9f1] active:scale-95">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Quick Link to Manage Orders */}
            <Link
              href="/manage-orders"
              className="flex items-center gap-2 rounded-full bg-[#183b2b] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#25523d] active:scale-95">
              <Package className="h-3.5 w-3.5 text-[#a8d591]" />
              <span>Orders Console</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Time Window Switcher Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#e8eee3] bg-white/95 p-3 shadow-[0_6px_24px_-16px_rgba(24,59,43,0.1)] backdrop-blur-sm sm:p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#718575]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#718575]">
              Filter Timeline:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-[#f4f7f1] p-1.5 border border-[#e5ebdf]">
            {[
              { id: "today", label: "Today" },
              { id: "week", label: "Last 7 Days" },
              { id: "month", label: "This Month" },
              { id: "all", label: "All Time" },
            ].map((tab) => {
              const active = timeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeFilter(tab.id as TimeFilter)}
                  className={`cursor-pointer rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                    active
                      ? "bg-[#183b2b] text-white shadow-sm"
                      : "text-[#5e7262] hover:bg-white hover:text-[#183b2b]"
                  }`}>
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="hidden text-right text-xs text-[#718575] md:block">
            Auto-syncs via Socket • Last updated{" "}
            <span className="font-semibold text-[#183b2b]">
              {lastRefreshedAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* TOP KPI METRICS GRID */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Revenue Generated */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="group relative overflow-hidden rounded-3xl border border-[#e3ebdc] bg-linear-to-br from-white via-white to-[#f5fbf2] p-5 shadow-[0_10px_30px_-15px_rgba(24,59,43,0.08)] transition hover:shadow-[0_16px_36px_-12px_rgba(24,59,43,0.14)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold tracking-wide uppercase text-[#6d8171]">
                  {activeMetrics.label} Revenue
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-[#183b2b]">
                    {formatINR(activeMetrics.revenue)}
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf5dc] text-[#3f7533] shadow-inner transition group-hover:scale-105">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>

            {/* Split breakdown info */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-[#edf2e8] text-xs">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#eaf5dc] px-2 py-0.5 font-bold text-[#35632b]">
                <TrendingUp className="h-3 w-3" />
                Paid: {formatINR(summary?.paidRevenue || 0)}
              </span>
              <span className="text-[#849487]">
                COD: {formatINR(summary?.cashRevenue || 0)}
              </span>
            </div>

            {/* Micro progress indicator */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] font-medium text-[#7a8a7d]">
                <span>Delivered Revenue Ratio</span>
                <span className="font-bold text-[#183b2b]">
                  {summary?.totalRevenue
                    ? `${Math.round(
                        ((summary.deliveredRevenue || 0) /
                          (summary.totalRevenue || 1)) *
                          100,
                      )}%`
                    : "0%"}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#e8eee3]">
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#76a85b] to-[#426e3f] transition-all duration-700"
                  style={{
                    width: `${
                      summary?.totalRevenue
                        ? Math.min(
                            100,
                            Math.round(
                              ((summary.deliveredRevenue || 0) /
                                (summary.totalRevenue || 1)) *
                                100,
                            ),
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Total Orders */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="group relative overflow-hidden rounded-3xl border border-[#e3ebdc] bg-linear-to-br from-white via-white to-[#fbf8f0] p-5 shadow-[0_10px_30px_-15px_rgba(24,59,43,0.08)] transition hover:shadow-[0_16px_36px_-12px_rgba(24,59,43,0.14)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold tracking-wide uppercase text-[#6d8171]">
                  {activeMetrics.label} Orders
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-[#183b2b]">
                    {activeMetrics.orders}
                  </span>
                  <span className="text-xs font-semibold text-[#667a6a]">
                    placed
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2db] text-[#b87414] shadow-inner transition group-hover:scale-105">
                <ShoppingBag className="h-6 w-6" />
              </div>
            </div>

            {/* Order status badges */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#edf2e8] text-[11px] font-bold">
              <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200">
                {summary?.statusCounts.delivered || 0} Delivered
              </span>
              <span className="rounded-lg bg-sky-50 px-2 py-0.5 text-sky-700 border border-sky-200">
                {summary?.statusCounts.outForDelivery || 0} In-Transit
              </span>
              <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-amber-700 border border-amber-200">
                {summary?.statusCounts.pending || 0} Pending
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-[#7a8a7d]">
              <span>Active pipeline</span>
              <span className="font-bold text-[#183b2b]">
                {(summary?.statusCounts.pending || 0) +
                  (summary?.statusCounts.outForDelivery || 0)}{" "}
                orders in action
              </span>
            </div>
          </motion.div>

          {/* Card 3: Delivery Fleet & Operations */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="group relative overflow-hidden rounded-3xl border border-[#e3ebdc] bg-linear-to-br from-white via-white to-[#f0f7fb] p-5 shadow-[0_10px_30px_-15px_rgba(24,59,43,0.08)] transition hover:shadow-[0_16px_36px_-12px_rgba(24,59,43,0.14)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold tracking-wide uppercase text-[#6d8171]">
                  Delivery Fleet
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-[#183b2b]">
                    {summary?.fleet.onlineDeliveryBoys || 0}
                    <span className="text-xl font-medium text-[#7d8f80]">
                      {" "}
                      / {summary?.fleet.totalDeliveryBoys || 0}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-[#183b2b]">
                    online
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e3f2fd] text-[#1976d2] shadow-inner transition group-hover:scale-105">
                <Truck className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#edf2e8] text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-[#1976d2]">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                Live GPS Active
              </span>
              <span className="font-semibold text-[#6d8171]">
                {summary?.fleet.totalDeliveryBoys
                  ? `${Math.round(
                      ((summary.fleet.onlineDeliveryBoys || 0) /
                        summary.fleet.totalDeliveryBoys) *
                        100,
                    )}% active`
                  : "No drivers registered"}
              </span>
            </div>

            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8eee3]">
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#42a5f5] to-[#1976d2] transition-all duration-700"
                  style={{
                    width: `${
                      summary?.fleet.totalDeliveryBoys
                        ? Math.min(
                            100,
                            Math.round(
                              ((summary.fleet.onlineDeliveryBoys || 0) /
                                summary.fleet.totalDeliveryBoys) *
                                100,
                            ),
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Card 4: Average Order Value & Customers */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="group relative overflow-hidden rounded-3xl border border-[#e3ebdc] bg-linear-to-br from-white via-white to-[#fdfbf6] p-5 shadow-[0_10px_30px_-15px_rgba(24,59,43,0.08)] transition hover:shadow-[0_16px_36px_-12px_rgba(24,59,43,0.14)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold tracking-wide uppercase text-[#6d8171]">
                  Average Order Value
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-[#183b2b]">
                    {formatINR(activeMetrics.aov)}
                  </span>
                  <span className="text-xs font-medium text-[#7d8f80]">
                    per basket
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f4ec] text-[#4a7c3e] shadow-inner transition group-hover:scale-105">
                <Wallet className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#edf2e8] text-xs">
              <span className="font-semibold text-[#667a6a]">
                👥 {summary?.totalCustomers || 0} Registered Shoppers
              </span>
              <span className="font-bold text-[#426e3f]">
                📦 {summary?.catalog.totalGroceries || 0} Products
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-[#7a8a7d]">
              <span>Payment mix</span>
              <span className="font-bold text-[#183b2b]">
                {summary?.onlineRevenue && summary?.totalRevenue
                  ? `${Math.round(
                      (summary.onlineRevenue / summary.totalRevenue) * 100,
                    )}% Digital`
                  : "100% Cash / New"}
              </span>
            </div>
          </motion.div>
        </div>

        {/* MIDDLE SECTION: INTERACTIVE CHART & REVENUE DISTRIBUTION */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Visual Trend Chart (7 cols on lg) */}
          <div className="rounded-3xl border border-[#e8eee3] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f4ec] pb-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#183b2b]">
                  <Activity className="h-5 w-5 text-[#5d8d4c]" />
                  {timeFilter === "today"
                    ? "Today's Hourly Revenue & Order Flow"
                    : "Revenue & Orders Performance Trend"}
                </h2>
                <p className="text-xs text-[#718575]">
                  Visualizing{" "}
                  {chartMode === "revenue"
                    ? "sales revenue (₹)"
                    : "order counts"}{" "}
                  across{" "}
                  {timeFilter === "today"
                    ? "24 hours today"
                    : "the last 7 days"}
                </p>
              </div>

              {/* Toggle Chart Mode: Revenue vs Orders */}
              <div className="flex items-center rounded-2xl bg-[#f4f7f1] p-1 border border-[#e5ebdf]">
                <button
                  type="button"
                  onClick={() => setChartMode("revenue")}
                  className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-bold transition ${
                    chartMode === "revenue"
                      ? "bg-[#183b2b] text-white shadow-sm"
                      : "text-[#627766] hover:text-[#183b2b]"
                  }`}>
                  Revenue (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("orders")}
                  className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-bold transition ${
                    chartMode === "orders"
                      ? "bg-[#183b2b] text-white shadow-sm"
                      : "text-[#627766] hover:text-[#183b2b]"
                  }`}>
                  Orders Count
                </button>
              </div>
            </div>

            {/* Custom Interactive SVG Chart */}
            <div className="relative mt-6 h-72 w-full">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-[#809183]">
                  No sales data recorded in this timeframe.
                </div>
              ) : (
                <div className="relative flex h-full flex-col justify-between">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 inset-y-6 flex flex-col justify-between pointer-events-none opacity-30">
                    <div className="border-b border-dashed border-[#ccd9c5]" />
                    <div className="border-b border-dashed border-[#ccd9c5]" />
                    <div className="border-b border-dashed border-[#ccd9c5]" />
                    <div className="border-b border-dashed border-[#ccd9c5]" />
                  </div>

                  {/* Bars & Interactive Area */}
                  <div className="relative z-10 flex h-52 items-end justify-between gap-1.5 px-3 pt-4 sm:gap-3">
                    {chartData.map((d, index) => {
                      const heightPercent =
                        maxChartVal > 0 ? (d.value / maxChartVal) * 100 : 0;
                      const isHovered = hoveredPointIndex === index;

                      return (
                        <div
                          key={d.label + index}
                          onMouseEnter={() => setHoveredPointIndex(index)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                          className="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end">
                          {/* Tooltip */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                className="pointer-events-none absolute -top-16 z-30 whitespace-nowrap rounded-2xl bg-[#183b2b] px-3 py-2 text-center text-xs text-white shadow-2xl border border-[#76a85b]/40">
                                <p className="font-bold text-[#eaf5dc]">
                                  {d.label}
                                </p>
                                <p className="text-[11px] text-white/90">
                                  {formatINR(d.revenue)} • {d.orders} orders
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Bar Element with Animated Gradient */}
                          <div
                            className={`w-full max-w-10.5 rounded-t-2xl transition-all duration-300 ${
                              isHovered
                                ? "bg-linear-to-t from-[#365924] to-[#76a85b] shadow-lg"
                                : "bg-linear-to-t from-[#3f6d3b] to-[#a4cf8a]"
                            }`}
                            style={{
                              height: `${Math.max(heightPercent, 6)}%`,
                            }}>
                            {/* Inner highlight pulse */}
                            <div className="h-1.5 w-full rounded-t-2xl bg-white/40" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* X Axis Labels */}
                  <div className="flex items-center justify-between border-t border-[#e8eee3] px-2 pt-2 text-[10px] font-bold text-[#718575] sm:text-xs">
                    {chartData.map((d, i) => {
                      // On mobile show every other label if hourly
                      const isHourly = timeFilter === "today";
                      if (isHourly && i % 3 !== 0) return <span key={i} />;
                      return (
                        <span key={i} className="truncate">
                          {d.label.split(",")[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Insights Footer */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#f0f4ec] pt-4 text-xs sm:grid-cols-4">
              <div className="rounded-2xl bg-[#f9fbf7] p-2.5">
                <span className="block text-[10px] uppercase font-bold text-[#718575]">
                  Peak Day Revenue
                </span>
                <span className="font-extrabold text-[#183b2b]">
                  {formatINR(Math.max(...dailyTrend.map((d) => d.revenue), 0))}
                </span>
              </div>
              <div className="rounded-2xl bg-[#f9fbf7] p-2.5">
                <span className="block text-[10px] uppercase font-bold text-[#718575]">
                  Total Fulfillments
                </span>
                <span className="font-extrabold text-[#285e23]">
                  {summary?.statusCounts.delivered || 0} completed
                </span>
              </div>
              <div className="rounded-2xl bg-[#f9fbf7] p-2.5">
                <span className="block text-[10px] uppercase font-bold text-[#718575]">
                  Fulfillment Rate
                </span>
                <span className="font-extrabold text-[#183b2b]">
                  {summary?.nonCancelledOrdersCount
                    ? `${Math.round(
                        ((summary.statusCounts.delivered || 0) /
                          summary.nonCancelledOrdersCount) *
                          100,
                      )}%`
                    : "100%"}
                </span>
              </div>
              <div className="rounded-2xl bg-[#f9fbf7] p-2.5">
                <span className="block text-[10px] uppercase font-bold text-[#718575]">
                  Cancellation Loss
                </span>
                <span className="font-extrabold text-rose-700">
                  {summary?.statusCounts.cancelled || 0} cancelled
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols on lg): Live Activity Stream & Order Status Breakdown */}
          <div className="space-y-6 lg:col-span-4">
            {/* Status Breakdown Card */}
            <div className="rounded-3xl border border-[#e8eee3] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[#183b2b]">
                <Layers className="h-4 w-4 text-[#5d8d4c]" />
                Order Pipeline Status
              </h3>

              <div className="mt-4 space-y-3">
                {[
                  {
                    label: "Delivered",
                    count: summary?.statusCounts.delivered || 0,
                    color: "bg-emerald-500",
                    badgeColor:
                      "bg-emerald-50 text-emerald-700 border-emerald-200",
                    icon: CheckCircle2,
                  },
                  {
                    label: "Out For Delivery",
                    count: summary?.statusCounts.outForDelivery || 0,
                    color: "bg-sky-500",
                    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
                    icon: Truck,
                  },
                  {
                    label: "Pending Preparation",
                    count: summary?.statusCounts.pending || 0,
                    color: "bg-amber-500",
                    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
                    icon: Clock,
                  },
                  {
                    label: "Cancelled",
                    count: summary?.statusCounts.cancelled || 0,
                    color: "bg-rose-500",
                    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
                    icon: XCircle,
                  },
                ].map((item) => {
                  const total = summary?.totalOrders || 1;
                  const percent = Math.round((item.count / total) * 100);
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="group">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-bold text-[#2d4734]">
                          <Icon className="h-3.5 w-3.5 text-[#5e7764]" />
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#183b2b]">
                            {item.count}
                          </span>
                          <span
                            className={`rounded-md border px-1.5 py-0.2 text-[10px] font-bold ${item.badgeColor}`}>
                            {percent}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#edf2e8]">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Methods Breakdown */}
              <div className="mt-5 border-t border-[#f0f4ec] pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#718575]">
                  Payment Channels Split
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-[#e5ebdf] bg-[#f9fbf7] p-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#183b2b]">
                      <CreditCard className="h-3.5 w-3.5 text-[#5d8d4c]" />
                      Online Prepaid
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-[#285e23]">
                      {formatINR(summary?.onlineRevenue || 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#e5ebdf] bg-[#f9fbf7] p-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#183b2b]">
                      <IndianRupee className="h-3.5 w-3.5 text-[#b87414]" />
                      Cash on Delivery
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-[#8c5912]">
                      {formatINR(summary?.cashRevenue || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Live Event Ticker */}
            <div className="rounded-3xl border border-[#e8eee3] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-[#f0f4ec] pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#183b2b]">
                    Live Operations Stream
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#718575]">
                  Real-Time
                </span>
              </div>

              <div className="mt-3 max-h-56 overflow-y-auto space-y-2.5 pr-1">
                {liveEvents.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#82967b]">
                    <Radio className="mx-auto h-6 w-6 text-[#9ab392] mb-1 animate-pulse" />
                    Listening for incoming orders & delivery updates...
                  </div>
                ) : (
                  liveEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-2.5 rounded-2xl border border-[#e8eee3] bg-[#f9fbf7] p-2.5 text-xs transition hover:border-[#b8d4a5]">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-[#eaf5dc] text-[#386434]">
                        {evt.type === "new_order" ? (
                          <ShoppingBag className="h-3 w-3" />
                        ) : (
                          <Truck className="h-3 w-3" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#183b2b] truncate">
                          {evt.title}
                        </p>
                        <p className="text-[11px] text-[#6b7d6f] truncate">
                          {evt.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold text-[#8b9d8e]">
                        {evt.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: TOP SELLING GROCERIES & ACTIVE DELIVERY PARTNERS */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Top Selling Groceries (6 cols) */}
          <div className="rounded-3xl border border-[#e8eee3] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-6">
            <div className="flex items-center justify-between border-b border-[#f0f4ec] pb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-[#183b2b]">
                  Top Revenue Grocery Items
                </h3>
              </div>
              <Link
                href="/groceries"
                className="flex items-center gap-1 text-xs font-bold text-[#426e3f] hover:underline">
                View catalog <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {topSellingItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#809183]">
                  No sales recorded yet. Once customers order items, top
                  products will appear here.
                </div>
              ) : (
                topSellingItems.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.name + idx}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0f4ec] p-2.5 transition hover:border-[#dcebd0] hover:bg-[#fbfdf9]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#eaf5dc] text-xs font-black text-[#2e5725]">
                        #{idx + 1}
                      </span>
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#f2f6ee] border border-[#e8eee3]">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <Boxes className="h-5 w-5 m-auto text-[#718575]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#183b2b]">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[#718575]">
                          {item.quantity} {item.unit} sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-xs font-extrabold text-[#285e23]">
                        {formatINR(item.revenue)}
                      </span>
                      <span className="text-[10px] text-[#718575]">
                        Revenue
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Delivery Partners Radar (6 cols) */}
          <div className="rounded-3xl border border-[#e8eee3] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-6">
            <div className="flex items-center justify-between border-b border-[#f0f4ec] pb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#1976d2]" />
                <h3 className="text-base font-extrabold text-[#183b2b]">
                  Delivery Fleet Status
                </h3>
              </div>
              <span className="rounded-full bg-[#e3f2fd] px-2.5 py-0.5 text-xs font-bold text-[#1976d2]">
                {summary?.fleet.onlineDeliveryBoys || 0} Online Now
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {deliveryBoys.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#809183]">
                  No delivery boys registered in the system yet.
                </div>
              ) : (
                deliveryBoys.slice(0, 5).map((boy) => (
                  <div
                    key={boy._id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0f4ec] p-2.5 transition hover:border-[#dcebd0] hover:bg-[#fbfdf9]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3e3] text-[#426e3f] overflow-hidden">
                        {boy.image ? (
                          <Image
                            src={boy.image}
                            alt={boy.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <Truck className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#183b2b]">
                          {boy.name}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-[#718575]">
                          <Phone className="h-3 w-3" />
                          {boy.mobile || "No phone listed"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          boy.isOnline
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            boy.isOnline
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-gray-400"
                          }`}
                        />
                        {boy.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RECENT ORDERS REAL-TIME TABLE */}
        <div className="mt-8 rounded-3xl border border-[#e8eee3] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 border-b border-[#f0f4ec] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#183b2b]">
                <ShoppingBag className="h-5 w-5 text-[#5d8d4c]" />
                Real-Time Orders Stream
              </h3>
              <p className="text-xs text-[#718575]">
                Live updates automatically stream in when orders are placed or
                updated.
              </p>
            </div>

            {/* Search & Filter within Table */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#869989]" />
                <input
                  type="text"
                  placeholder="Search order or customer..."
                  value={searchOrderQuery}
                  onChange={(e) => setSearchOrderQuery(e.target.value)}
                  className="rounded-full border border-[#e5ecdf] bg-[#f9fbf7] pl-8 pr-3 py-1.5 text-xs text-[#183b2b] placeholder-[#8ca08f] outline-none focus:border-[#76a85b] focus:bg-white"
                />
              </div>

              <select
                aria-label="Filter orders by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-full border border-[#e5ecdf] bg-[#f9fbf7] px-3 py-1.5 text-xs font-semibold text-[#385342] outline-none focus:border-[#76a85b]">
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="outForDelivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <Link
                href="/manage-orders"
                className="flex items-center gap-1.5 rounded-full bg-[#eaf5dc] px-3 py-1.5 text-xs font-bold text-[#35632b] hover:bg-[#dcebd0] transition">
                <span>Console</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Table Container */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#edf2e8] text-[11px] font-bold uppercase tracking-wider text-[#718575]">
                  <th className="pb-3 pl-2">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Placed At</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f6ee]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#859888]">
                      No orders matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isNew = order.isNew;
                    return (
                      <tr
                        key={order._id}
                        className={`transition hover:bg-[#fbfdf9] ${
                          isNew ? "bg-[#f5fbf2] font-semibold" : ""
                        }`}>
                        {/* Order ID */}
                        <td className="py-3.5 pl-2 font-mono font-bold text-[#183b2b]">
                          <div className="flex items-center gap-1.5">
                            {isNew && (
                              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                            )}
                            <span>#{order._id.slice(-6)}</span>
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(order._id);
                                toast.success("Order ID copied!");
                              }}
                              className="text-[#9ab39e] hover:text-[#183b2b]">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5">
                          <p className="font-bold text-[#183b2b]">
                            {order.customerName}
                          </p>
                          {order.deliveryCity && (
                            <p className="flex items-center gap-1 text-[11px] text-[#718575]">
                              <MapPin className="h-3 w-3 text-[#94a896]" />
                              {order.deliveryCity}
                            </p>
                          )}
                        </td>

                        {/* Items */}
                        <td className="py-3.5 text-[#5e7462]">
                          <span className="rounded-lg bg-[#f0f4ec] px-2 py-0.5 font-bold">
                            {order.itemsCount}{" "}
                            {order.itemsCount === 1 ? "item" : "items"}
                          </span>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 font-extrabold text-[#183b2b]">
                          {formatINR(order.totalAmount)}
                        </td>

                        {/* Payment */}
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              order.isPaid
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}>
                            {order.isPaid ? "Paid" : "Pending"} (
                            {order.paymentMethod === "online"
                              ? "Online"
                              : "COD"}
                            )
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              order.status === "delivered"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : order.status === "outForDelivery"
                                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                                  : order.status === "cancelled"
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}>
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                order.status === "delivered"
                                  ? "bg-emerald-500"
                                  : order.status === "outForDelivery"
                                    ? "bg-sky-500 animate-pulse"
                                    : order.status === "cancelled"
                                      ? "bg-rose-500"
                                      : "bg-amber-500"
                              }`}
                            />
                            {order.status === "outForDelivery"
                              ? "Out for Delivery"
                              : order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                          </span>
                        </td>

                        {/* Placed At */}
                        <td className="py-3.5 text-[#718575] text-[11px]">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          ,{" "}
                          {new Date(order.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 pr-2 text-right">
                          <Link
                            href="/manage-orders"
                            className="inline-flex items-center gap-1 rounded-xl bg-[#183b2b] px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-[#25523d]">
                            Manage
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Admin Actions Footer Bar */}
        <div className="mt-8 rounded-3xl border border-[#e8eee3] bg-linear-to-r from-[#183b2b] to-[#285e23] p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-white">
                Quick Operations Shortcuts
              </h3>
              <p className="text-xs text-white/80">
                Instantly jump to grocery catalog management or order
                fulfillment consoles.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/add-grocery"
                className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-[#183b2b] shadow transition hover:bg-[#f0f6eb] active:scale-95">
                <PlusCircle className="h-4 w-4 text-[#426e3f]" />
                Add New Grocery
              </Link>
              <Link
                href="/groceries"
                className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20 active:scale-95">
                <Boxes className="h-4 w-4 text-[#a8d591]" />
                View Inventory Stock
              </Link>
              <Link
                href="/manage-orders"
                className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20 active:scale-95">
                <ShoppingBag className="h-4 w-4 text-[#a8d591]" />
                Manage Live Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
