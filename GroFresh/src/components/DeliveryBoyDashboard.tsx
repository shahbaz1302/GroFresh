"use client";

import { getSocket } from "@/lib/socket";
import { RootState } from "@/redux/store";
import axios from "axios";
import {
  AlertCircle,
  ArrowRight,
  Bike,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import DeliveryBoyChat from "./DeliveryBoyChat";
import dynamic from "next/dynamic";

export interface OrderItem {
  groceryId: string | { _id: string };
  name: string;
  image: string;
  price: number;
  unit: string;
  quantity: number;
}

export interface OrderData {
  _id: string;
  userId?: { _id?: string; name?: string; email?: string; mobile?: string };
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

export interface DeliveryAssignmentData {
  _id: string;
  orderId: OrderData;
  broadCastedTo: string[];
  selectedDeliveryPerson: string | null;
  status:
    | "broadcasted"
    | "assigned"
    | "pickup_inprogress"
    | "picked_up"
    | "delivery_inprogress"
    | "delivered"
    | "cancelled";
  acceptedAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryBoyDashboardProps {
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    mobile?: string;
    role?: string;
    isOnline?: boolean;
    location?: { coordinates: [number, number] };
  };
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatTime = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const DELIVERY_STEPS = [
  {
    key: "assigned",
    label: "Accepted",
    description: "Order locked to you",
    icon: CheckCircle2,
  },
  {
    key: "pickup_inprogress",
    label: "Heading to Store",
    description: "En route to grocery hub",
    icon: Store,
  },
  {
    key: "picked_up",
    label: "Groceries Picked Up",
    description: "Bag inspected & ready",
    icon: PackageCheck,
  },
  {
    key: "delivery_inprogress",
    label: "Out for Delivery",
    description: "En route to customer",
    icon: Bike,
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Safely handed over",
    icon: Sparkles,
  },
] as const;

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 sm:h-80 w-full items-center justify-center rounded-2xl border border-[#dce8d4] bg-[#f9fbf8] text-sm font-medium text-[#718575]">
      <RefreshCw className="mr-2 h-4 w-4 animate-spin text-[#2e7d32]" />
      Loading live navigation map...
    </div>
  ),
});

const EARNING_PER_DELIVERY = 60; // ₹60 base payout per order

const getDeliveryLocation = (assignment?: DeliveryAssignmentData | null) => {
  const address = assignment?.orderId?.deliveryAddress;
  if (!address) return null;

  const lat =
    typeof address.latitude === "number"
      ? address.latitude
      : parseFloat(String(address.latitude || ""));
  const lng =
    typeof address.longitude === "number"
      ? address.longitude
      : parseFloat(String(address.longitude || ""));

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }

  return { latitude: lat, longitude: lng };
};

const DeliveryBoyDashboard = ({ user }: DeliveryBoyDashboardProps) => {
  const [broadcasted, setBroadcasted] = useState<DeliveryAssignmentData[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<
    DeliveryAssignmentData[]
  >([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [completedDeliveries, setCompletedDeliveries] = useState<
    DeliveryAssignmentData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "broadcasts" | "active" | "history"
  >("broadcasts");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const { userData } = useSelector((state: RootState) => state.user);
  const userId = userData?._id;

  // OTP dialog state
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const fetchAssignments = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setRefreshing(true);
      try {
        const res = await axios.get("/api/deliveryBoy/get-assignments");
        const data = res.data;

        if (Array.isArray(data)) {
          // Fallback if returned as raw array
          const rawBroadcasted = data.filter(
            (item) => item.status === "broadcasted",
          );
          const rawActive = data.filter((item) =>
            [
              "assigned",
              "pickup_inprogress",
              "picked_up",
              "delivery_inprogress",
            ].includes(item.status),
          );
          setBroadcasted(rawBroadcasted);
          setActiveDeliveries(rawActive);
          setCompletedDeliveries(
            data.filter((item) => item.status === "delivered"),
          );
          setUserLocation(
            getDeliveryLocation(rawActive[0] ?? rawBroadcasted[0]),
          );
        } else {
          const rawBroadcasted = data.broadcasted || [];
          const rawActive = data.active || [];
          const rawCompleted = data.completed || [];

          setBroadcasted(rawBroadcasted);
          setActiveDeliveries(rawActive);
          setCompletedDeliveries(rawCompleted);
          setUserLocation(
            getDeliveryLocation(rawActive[0] ?? rawBroadcasted[0]),
          );

          // Auto-switch to active tab if there's an ongoing delivery
          if (
            rawActive.length > 0 &&
            activeTab === "broadcasts" &&
            rawBroadcasted.length === 0
          ) {
            setActiveTab("active");
          }
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        if (!isSilent) {
          toast.error("Could not sync delivery assignments.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab],
  );

  useEffect(() => {
    fetchAssignments();
    // Live polling every 12 seconds for real-time dispatch updates
    const interval = setInterval(() => {
      fetchAssignments(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchAssignments]);

  const handleAcceptAssignment = async (assignmentId: string) => {
    try {
      setAcceptingId(assignmentId);
      const res = await axios.post("/api/deliveryBoy/accept-assignment", {
        assignmentId,
      });
      toast.success(res.data.message || "Order accepted! Ride safely.");
      await fetchAssignments(true);
      setActiveTab("active");
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to accept order. Try again.";
      toast.error(msg);
      await fetchAssignments(true);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleUpdateStatus = async (
    assignmentId: string,
    nextStatus: DeliveryAssignmentData["status"],
  ) => {
    try {
      setUpdatingId(assignmentId);
      const res = await axios.post("/api/deliveryBoy/update-status", {
        assignmentId,
        status: nextStatus,
      });
      toast.success(res.data.message || "Delivery status updated!");
      await fetchAssignments(true);

      if (nextStatus === "delivered") {
        setActiveTab("history");
        setCheckedItems({});
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to update status.";
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Order ID copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleItemCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentActive = activeDeliveries[0] || null;

  const totalEarningsToday = useMemo(() => {
    return completedDeliveries.length * EARNING_PER_DELIVERY;
  }, [completedDeliveries]);

  const getNextAction = (status: DeliveryAssignmentData["status"]) => {
    switch (status) {
      case "assigned":
        return {
          target: "pickup_inprogress" as const,
          label: "Head to Grocery Store",
          icon: Store,
          tip: "Navigate to the store to collect packed groceries",
          btnClass:
            "bg-[#183b2b] hover:bg-[#23533d] text-white shadow-md shadow-[#183b2b]/20",
        };
      case "pickup_inprogress":
        return {
          target: "picked_up" as const,
          label: "Confirm Groceries Picked Up",
          icon: PackageCheck,
          tip: "Verify all items before leaving the grocery hub",
          btnClass:
            "bg-[#2e7d32] hover:bg-[#256629] text-white shadow-md shadow-[#2e7d32]/20",
        };
      case "picked_up":
        return {
          target: "delivery_inprogress" as const,
          label: "Start Journey to Customer",
          icon: Bike,
          tip: "Begin GPS transit towards the delivery address",
          btnClass:
            "bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-md shadow-[#0284c7]/20",
        };
      case "delivery_inprogress":
        return {
          target: "delivered" as const,
          label: "Confirm Handover & Delivered",
          icon: Sparkles,
          tip: "Hand groceries to customer and collect payment if Cash",
          btnClass:
            "bg-[#15803d] hover:bg-[#166534] text-white shadow-md shadow-[#15803d]/25",
        };
      default:
        return null;
    }
  };

  useEffect(() => {
    const socket = getSocket();

    const handleNewOrder = (deliveryAssignment: any) => {
      setBroadcasted((prev) => {
        if (prev.some((item) => item._id === deliveryAssignment._id)) {
          return prev;
        }
        return [deliveryAssignment, ...prev];
      });
      setActiveTab("broadcasts");
      toast.success("New delivery request available nearby!");
    };

    socket.on("new-order-available", handleNewOrder);
    return () => {
      socket.off("new-order-available", handleNewOrder);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!userId) return;
    if (!navigator.geolocation) return;
    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDeliveryBoyLocation({ latitude, longitude });
        socket.emit("update_location", { userId, latitude, longitude });
      },
      (error) => {
        console.log("Error getting location:", error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [userId]);

  const sendOtp = async () => {
    if (!currentActive) return;
    try {
      setOtpSending(true);
      setOtpError(null);
      setOtpValue("");
      const res = await axios.post("/api/deliveryBoy/otp/send", {
        orderId: currentActive.orderId?._id,
      });
      setOtpDialogOpen(true);
      toast.success(res.data?.message || "OTP sent to customer's email!");
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to send OTP. Try again.";
      toast.error(msg);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!currentActive || !otpValue.trim()) {
      setOtpError("Please enter the OTP.");
      return;
    }
    try {
      setOtpVerifying(true);
      setOtpError(null);
      const res = await axios.post("/api/deliveryBoy/otp/verify", {
        orderId: currentActive.orderId?._id,
        otp: otpValue.trim(),
      });
      toast.success(res.data.message || "Delivery verified successfully!");
      setOtpDialogOpen(false);
      setOtpValue("");
      await fetchAssignments(true);
      setActiveTab("history");
      setCheckedItems({});
    } catch (error: any) {
      const msg = error.response?.data?.message || "OTP verification failed.";
      setOtpError(msg);
    } finally {
      setOtpVerifying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f8f0] px-3 py-6 font-sans text-[#183b2b] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* TOP FLEET HERO BAR */}
        <section
          aria-label="Delivery Partner Overview"
          className="relative overflow-hidden rounded-3xl border border-[#dce8d4] bg-white p-5 shadow-[0_12px_40px_-20px_rgba(24,59,43,0.12)] sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4 sm:items-center">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3e3] text-[#2e7d32] shadow-inner sm:h-16 sm:w-16">
                <Bike className="h-7 w-7 sm:h-8 sm:w-8" />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500"></span>
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-[#183b2b] sm:text-2xl">
                    {user?.name
                      ? `Hello, ${user.name}`
                      : "GroFresh Partner Hub"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5d9] px-2.5 py-0.5 text-xs font-bold text-[#2e7d32]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Fleet Verified
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#718575] sm:text-sm">
                  Ready for neighborhood grocery deliveries & live dispatch.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-[#e5ecdf] bg-[#f8fbf5] px-3.5 py-2 text-xs font-semibold text-[#547d46]">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>GPS Beacon Active</span>
              </div>

              <button
                type="button"
                onClick={() => fetchAssignments()}
                disabled={refreshing}
                aria-label="Refresh orders"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8d4] bg-white px-4 py-2 text-xs font-bold text-[#183b2b] shadow-sm transition hover:border-[#b6cda8] hover:bg-[#f8fbf5] active:scale-95 disabled:opacity-50">
                <RefreshCw
                  className={`h-3.5 w-3.5 text-[#547d46] ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                <span>{refreshing ? "Syncing..." : "Sync Orders"}</span>
              </button>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-2xl border border-[#e8f1e3] bg-[#f9fcf7] p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-[#718575]">
                <span className="text-xs font-semibold">Available</span>
                <Clock className="h-4 w-4 text-[#7a9a67]" />
              </div>
              <p className="mt-2 text-2xl font-black text-[#183b2b]">
                {broadcasted.length}
              </p>
              <p className="text-[11px] text-[#718575]">Ready to accept</p>
            </div>

            <div className="rounded-2xl border border-[#d6e7f8] bg-[#f0f7ff] p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-[#0284c7]">
                <span className="text-xs font-semibold">Active Run</span>
                <Bike className="h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-black text-[#0369a1]">
                {activeDeliveries.length}
              </p>
              <p className="text-[11px] text-[#0284c7]/80">In transit</p>
            </div>

            <div className="rounded-2xl border border-[#d4edd8] bg-[#edf8ef] p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-[#2e7d32]">
                <span className="text-xs font-semibold">Delivered</span>
                <PackageCheck className="h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-black text-[#1e5824]">
                {completedDeliveries.length}
              </p>
              <p className="text-[11px] text-[#2e7d32]/80">Completed runs</p>
            </div>

            <div className="rounded-2xl border border-[#fed7aa] bg-[#fffbf5] p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-[#ea580c]">
                <span className="text-xs font-semibold">Estimated Payout</span>
                <Wallet className="h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-black text-[#c2410c]">
                {currency.format(totalEarningsToday)}
              </p>
              <p className="text-[11px] text-[#ea580c]/80">
                ₹{EARNING_PER_DELIVERY}/delivery
              </p>
            </div>
          </div>
        </section>

        {/* NAVIGATION TABS */}
        <nav
          aria-label="Delivery sections"
          className="flex rounded-2xl border border-[#dce8d4] bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("broadcasts")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
              activeTab === "broadcasts"
                ? "bg-[#183b2b] text-white shadow-sm"
                : "text-[#547d46] hover:bg-[#f4f8f0]"
            }`}>
            <Clock className="h-4 w-4" />
            <span>New Requests</span>
            {broadcasted.length > 0 && (
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-black ${
                  activeTab === "broadcasts"
                    ? "bg-[#eaf3e3] text-[#183b2b]"
                    : "bg-[#eaf3e3] text-[#2e7d32]"
                }`}>
                {broadcasted.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
              activeTab === "active"
                ? "bg-[#183b2b] text-white shadow-sm"
                : "text-[#547d46] hover:bg-[#f4f8f0]"
            }`}>
            <Truck className="h-4 w-4" />
            <span>Active Delivery</span>
            {activeDeliveries.length > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
              activeTab === "history"
                ? "bg-[#183b2b] text-white shadow-sm"
                : "text-[#547d46] hover:bg-[#f4f8f0]"
            }`}>
            <PackageCheck className="h-4 w-4" />
            <span>Completed</span>
            {completedDeliveries.length > 0 && (
              <span className="ml-1 text-[11px] opacity-80">
                ({completedDeliveries.length})
              </span>
            )}
          </button>
        </nav>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[#dce8d4] bg-white py-16 text-center shadow-sm">
            <RefreshCw className="h-8 w-8 animate-spin text-[#547d46]" />
            <p className="mt-3 text-sm font-semibold text-[#183b2b]">
              Loading dispatch orders...
            </p>
            <p className="text-xs text-[#718575]">
              Connecting to GroFresh live delivery grid
            </p>
          </div>
        )}

        {/* CONTENT TABS */}
        {!loading && (
          <AnimatePresence mode="wait">
            {/* 1. BROADCASTED / NEW REQUESTS */}
            {activeTab === "broadcasts" && (
              <motion.div
                key="broadcasts"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4">
                {broadcasted.length === 0 ? (
                  <div className="rounded-3xl border border-[#dce8d4] bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf3e3] text-[#547d46]">
                      <Compass className="h-8 w-8 animate-pulse" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-[#183b2b]">
                      No New Orders Nearby Right Now
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-xs text-[#718575] sm:text-sm">
                      Your GPS beacon is active! When an admin flags an order as
                      ready for dispatch, it will appear here instantly.
                    </p>
                    <button
                      type="button"
                      onClick={() => fetchAssignments()}
                      className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#dce8d4] bg-[#f8fbf5] px-5 py-2.5 text-xs font-bold text-[#183b2b] transition hover:bg-[#eaf3e3]">
                      <RefreshCw className="h-3.5 w-3.5 text-[#547d46]" /> Check
                      Again
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {broadcasted.map((assignment) => {
                      const order = assignment.orderId;
                      if (!order) return null;
                      const orderIdStr = order._id.toString();
                      const isAccepting = acceptingId === assignment._id;

                      return (
                        <div
                          key={assignment._id}
                          className="flex flex-col justify-between overflow-hidden rounded-3xl border border-[#dce8d4] bg-white p-5 shadow-[0_8px_30px_-15px_rgba(24,59,43,0.08)] transition hover:border-[#b6cda8] sm:p-6">
                          <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-xs font-bold text-[#b45309]">
                                  <Clock className="h-3 w-3" /> Broadcasted
                                  Order
                                </span>
                                <h3 className="mt-2 text-base font-black text-[#183b2b] sm:text-lg">
                                  {order.deliveryAddress?.fullName ||
                                    "Customer Delivery"}
                                </h3>
                              </div>

                              <span className="rounded-2xl border border-[#dce8d4] bg-[#f9fcf7] px-3 py-1.5 text-right font-black text-[#183b2b]">
                                {currency.format(order.totalAmount)}
                              </span>
                            </div>

                            {/* Order ID & Mode */}
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => handleCopyOrderId(orderIdStr)}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#f4f8f0] px-2 py-1 font-mono text-[#547d46] hover:bg-[#eaf3e3]">
                                <span>#{orderIdStr.slice(-6)}</span>
                                {copiedId === orderIdStr ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>

                              <span
                                className={`rounded-lg px-2 py-1 font-bold ${
                                  order.paymentMethod === "cash"
                                    ? "bg-[#fff7ed] text-[#c2410c]"
                                    : "bg-[#eff6ff] text-[#1d4ed8]"
                                }`}>
                                {order.paymentMethod === "cash"
                                  ? "Cash on Delivery"
                                  : "Paid Online ✓"}
                              </span>

                              <span className="rounded-lg bg-[#eaf3e3] px-2 py-1 font-semibold text-[#2e7d32]">
                                +₹{EARNING_PER_DELIVERY} Payout
                              </span>
                            </div>

                            {/* Address details */}
                            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#eef4ea] bg-[#f9fbf8] p-3 text-xs text-[#526a57]">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2e7d32]" />
                              <div className="flex-1">
                                <p className="font-semibold text-[#183b2b]">
                                  Drop Location:
                                </p>
                                <p>
                                  {order.deliveryAddress?.street},{" "}
                                  {order.deliveryAddress?.city} -{" "}
                                  {order.deliveryAddress?.pincode}
                                </p>
                              </div>
                              {order.deliveryAddress && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    `${order.deliveryAddress.street || ""}, ${order.deliveryAddress.city || ""} ${order.deliveryAddress.pincode || ""}`,
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 rounded-lg border border-[#dce8d4] bg-white px-2 py-1 text-[11px] font-bold text-[#2e7d32] hover:bg-[#eaf3e3]"
                                  title="View in Google Maps">
                                  Maps ↗
                                </a>
                              )}
                            </div>

                            {/* Item preview */}
                            <div className="mt-4">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#7a9a67]">
                                Items ({order.items?.length || 0})
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {order.items?.slice(0, 4).map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1.5 rounded-xl border border-[#e5ecdf] bg-white px-2 py-1 text-xs">
                                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md bg-[#f4f8f0]">
                                      {item.image ? (
                                        <Image
                                          src={item.image}
                                          alt={item.name}
                                          fill
                                          sizes="24px"
                                          className="object-cover"
                                        />
                                      ) : (
                                        <Package className="h-4 w-4 text-[#718575]" />
                                      )}
                                    </div>
                                    <span className="max-w-25 truncate font-medium text-[#183b2b]">
                                      {item.name}
                                    </span>
                                    <span className="font-bold text-[#547d46]">
                                      x{item.quantity}
                                    </span>
                                  </div>
                                ))}
                                {(order.items?.length || 0) > 4 && (
                                  <span className="flex items-center rounded-xl bg-[#f4f8f0] px-2 text-xs font-semibold text-[#718575]">
                                    +{(order.items?.length || 0) - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* CTA button */}
                          <div className="mt-6 pt-4 border-t border-[#f0f5ed]">
                            <button
                              type="button"
                              onClick={() =>
                                handleAcceptAssignment(assignment._id)
                              }
                              disabled={isAccepting}
                              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#183b2b] py-3 text-sm font-bold text-white shadow-md shadow-[#183b2b]/15 transition hover:bg-[#23533d] active:scale-[0.98] disabled:opacity-50">
                              {isAccepting ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span>Locking Delivery...</span>
                                </>
                              ) : (
                                <>
                                  <Bike className="h-4 w-4" />
                                  <span>Accept & Start Delivery</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. ACTIVE DELIVERY RUN */}
            {activeTab === "active" && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6">
                {!currentActive ? (
                  <div className="rounded-3xl border border-[#dce8d4] bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f7ff] text-[#0284c7]">
                      <Bike className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-[#183b2b]">
                      No Active Delivery In Progress
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-xs text-[#718575] sm:text-sm">
                      You don’t have an ongoing delivery right now. Check the
                      New Requests tab to pick up newly dispatched orders!
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("broadcasts")}
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#183b2b] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#23533d]">
                      <span>View New Requests</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  (() => {
                    const order = currentActive.orderId;
                    const orderIdStr = order?._id?.toString() || "";
                    const nextAction = getNextAction(currentActive.status);
                    const isUpdating = updatingId === currentActive._id;
                    const currentStepIndex = DELIVERY_STEPS.findIndex(
                      (s) => s.key === currentActive.status,
                    );

                    const customerPhone =
                      order?.deliveryAddress?.phone ||
                      order?.userId?.mobile ||
                      "";

                    const activeOrderLocation =
                      getDeliveryLocation(currentActive) ||
                      (order?.deliveryAddress &&
                      Number.isFinite(Number(order.deliveryAddress.latitude)) &&
                      Number.isFinite(
                        Number(order.deliveryAddress.longitude),
                      ) &&
                      Number(order.deliveryAddress.latitude) !== 0
                        ? {
                            latitude: Number(order.deliveryAddress.latitude),
                            longitude: Number(order.deliveryAddress.longitude),
                          }
                        : null) ||
                      userLocation;

                    return (
                      <div className="space-y-6">
                        {/* Status Stepper Card */}
                        <div className="rounded-3xl border border-[#dce8d4] bg-white p-5 shadow-[0_12px_40px_-20px_rgba(24,59,43,0.12)] sm:p-7">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#f0f5ed] pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7]">
                                  Active Delivery
                                </span>
                              </div>
                              <h2 className="mt-1 text-xl font-black text-[#183b2b] sm:text-2xl">
                                Order #{orderIdStr.slice(-6)}
                              </h2>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="rounded-2xl border border-[#dce8d4] bg-[#f9fcf7] px-3.5 py-1.5 text-sm font-black text-[#183b2b]">
                                {currency.format(order?.totalAmount || 0)}
                              </span>
                              <span
                                className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                                  order?.paymentMethod === "cash"
                                    ? "bg-[#fff7ed] text-[#c2410c]"
                                    : "bg-[#eff6ff] text-[#1d4ed8]"
                                }`}>
                                {order?.paymentMethod === "cash"
                                  ? "Cash on Delivery"
                                  : "Paid Online ✓"}
                              </span>
                            </div>
                          </div>

                          {/* Stepper tracker */}
                          <div className="mt-6">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#7a9a67]">
                              Delivery Progress
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
                              {DELIVERY_STEPS.map((step, idx) => {
                                const isDone =
                                  currentStepIndex >= 0 &&
                                  idx <= currentStepIndex;
                                const isCurrent = idx === currentStepIndex;
                                const StepIcon = step.icon;

                                return (
                                  <div
                                    key={step.key}
                                    className={`relative rounded-2xl border p-3 transition ${
                                      isCurrent
                                        ? "border-[#183b2b] bg-[#eaf3e3] shadow-sm"
                                        : isDone
                                          ? "border-[#dce8d4] bg-[#f9fbf8]"
                                          : "border-[#e5ecdf] bg-white opacity-50"
                                    }`}>
                                    <div className="flex items-center justify-between">
                                      <div
                                        className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold ${
                                          isCurrent
                                            ? "bg-[#183b2b] text-white"
                                            : isDone
                                              ? "bg-[#2e7d32] text-white"
                                              : "bg-[#f4f8f0] text-[#718575]"
                                        }`}>
                                        <StepIcon className="h-4 w-4" />
                                      </div>
                                      <span className="text-[10px] font-mono text-[#718575]">
                                        0{idx + 1}
                                      </span>
                                    </div>
                                    <p
                                      className={`mt-2 text-xs font-bold ${
                                        isCurrent
                                          ? "text-[#183b2b]"
                                          : isDone
                                            ? "text-[#2e7d32]"
                                            : "text-[#718575]"
                                      }`}>
                                      {step.label}
                                    </p>
                                    <p className="text-[10px] text-[#718575]">
                                      {step.description}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Dynamic Action Banner */}
                          {nextAction && (
                            <div className="mt-6 rounded-2xl border border-[#dce8d4] bg-[#f8fbf5] p-4 sm:p-5">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-[#547d46]">
                                    Next Phase
                                  </p>
                                  <p className="text-sm font-semibold text-[#183b2b]">
                                    {nextAction.tip}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (nextAction.target === "delivered") {
                                      sendOtp();
                                    } else {
                                      handleUpdateStatus(
                                        currentActive._id,
                                        nextAction.target,
                                      );
                                    }
                                  }}
                                  disabled={isUpdating || otpSending}
                                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition active:scale-[0.98] disabled:opacity-50 ${nextAction.btnClass}`}>
                                  {isUpdating || otpSending ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                      <span>
                                        {otpSending
                                          ? "Sending OTP..."
                                          : "Updating..."}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <nextAction.icon className="h-4 w-4" />
                                      <span>{nextAction.label}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Cash on delivery warning alert */}
                          {order?.paymentMethod === "cash" &&
                            !order?.isPaid && (
                              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#fed7aa] bg-[#fffaf5] p-4 text-xs text-[#9a3412]">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ea580c]" />
                                <div>
                                  <p className="font-bold">
                                    Cash on Delivery Required:
                                  </p>
                                  <p>
                                    Please collect{" "}
                                    <span className="font-bold text-[#c2410c]">
                                      {currency.format(order.totalAmount)}
                                    </span>{" "}
                                    in exact cash from the customer before
                                    handing over the grocery package.
                                  </p>
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Customer & Route info Grid */}
                        <div className="grid gap-6 md:grid-cols-2">
                          {/* Destination Card */}
                          <div className="rounded-3xl border border-[#dce8d4] bg-white p-5 shadow-sm sm:p-6">
                            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#183b2b]">
                              <Navigation className="h-4 w-4 text-[#2e7d32]" />
                              <span>Customer & Drop Destination</span>
                            </h3>

                            <div className="mt-4 space-y-3">
                              <div className="rounded-2xl border border-[#e5ecdf] bg-[#f9fbf8] p-3.5">
                                <p className="text-xs text-[#718575]">
                                  Recipient
                                </p>
                                <p className="text-base font-bold text-[#183b2b]">
                                  {order?.deliveryAddress?.fullName ||
                                    order?.userId?.name ||
                                    "Customer"}
                                </p>
                              </div>

                              <div className="rounded-2xl border border-[#e5ecdf] bg-[#f9fbf8] p-3.5">
                                <p className="text-xs text-[#718575]">
                                  Full Address
                                </p>
                                <p className="mt-0.5 text-xs font-medium text-[#183b2b] sm:text-sm">
                                  {order?.deliveryAddress?.street}
                                </p>
                                <p className="text-xs text-[#718575]">
                                  {order?.deliveryAddress?.city},{" "}
                                  {order?.deliveryAddress?.state || ""} -{" "}
                                  {order?.deliveryAddress?.pincode}
                                </p>
                              </div>

                              <div className="space-y-4 pt-4">
                                {activeOrderLocation ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-semibold text-[#183b2b]">
                                        Live Navigation Route
                                      </span>
                                      {deliveryBoyLocation ? (
                                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                                          <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                          </span>
                                          GPS Tracking Live
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-amber-600">
                                          Acquiring delivery partner GPS...
                                        </span>
                                      )}
                                    </div>
                                    <LiveMap
                                      userLocation={activeOrderLocation}
                                      deliveryBoyLocation={deliveryBoyLocation}
                                      className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden border border-[#dce8d4] shadow-inner"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dce8d4] bg-[#f9fbf8] p-5 text-center">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf3e3] text-[#2e7d32]">
                                      <MapPin className="h-5 w-5" />
                                    </div>
                                    <p className="mt-2 text-xs font-bold text-[#183b2b]">
                                      Coordinates Not Pinned
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#718575]">
                                      Exact map coordinates were not provided
                                      for this order address. You can still
                                      navigate via Google Maps below.
                                    </p>
                                    {order?.deliveryAddress && (
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                          `${order.deliveryAddress.street || ""}, ${order.deliveryAddress.city || ""}, ${order.deliveryAddress.state || ""} ${order.deliveryAddress.pincode || ""}`,
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#dce8d4] bg-white px-3.5 py-2 text-xs font-bold text-[#2e7d32] shadow-xs transition hover:bg-[#eaf3e3]">
                                        <Navigation className="h-3.5 w-3.5" />
                                        <span>Open Address in Google Maps</span>
                                      </a>
                                    )}
                                  </div>
                                )}

                                <DeliveryBoyChat
                                  orderId={order._id}
                                  deliveryBoyId={userId!}
                                />

                                <div className="flex flex-wrap gap-2">
                                  {customerPhone && (
                                    <a
                                      href={`tel:${customerPhone}`}
                                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dce8d4] bg-white py-3 text-xs font-bold text-[#2e7d32] shadow-sm transition hover:bg-[#eaf3e3]">
                                      <Phone className="h-4 w-4" />
                                      <span>Call Customer</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Packing / Items Checklist */}
                          <div className="rounded-3xl border border-[#dce8d4] bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex items-center justify-between">
                              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#183b2b]">
                                <ShoppingBag className="h-4 w-4 text-[#2e7d32]" />
                                <span>Bag Verification Checklist</span>
                              </h3>
                              <span className="text-xs font-semibold text-[#718575]">
                                {order?.items?.length || 0} items
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-[#718575]">
                              Check off items as you verify them from the store
                              bag.
                            </p>

                            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                              {order?.items?.map((item, idx) => {
                                const checkKey = `${currentActive._id}-${idx}`;
                                const isChecked = !!checkedItems[checkKey];

                                return (
                                  <div
                                    key={idx}
                                    onClick={() => toggleItemCheck(checkKey)}
                                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                                      isChecked
                                        ? "border-[#c8e6c9] bg-[#edf7ed]"
                                        : "border-[#e5ecdf] bg-white hover:border-[#b6cda8]"
                                    }`}>
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                                          isChecked
                                            ? "border-[#2e7d32] bg-[#2e7d32] text-white"
                                            : "border-[#718575] bg-white"
                                        }`}>
                                        {isChecked && (
                                          <Check className="h-3.5 w-3.5" />
                                        )}
                                      </div>

                                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#f4f8f0]">
                                        {item.image ? (
                                          <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            sizes="40px"
                                            className="object-cover"
                                          />
                                        ) : (
                                          <Package className="h-5 w-5 text-[#718575]" />
                                        )}
                                      </div>

                                      <div>
                                        <p
                                          className={`text-xs font-bold ${
                                            isChecked
                                              ? "text-[#1e5824] line-through opacity-80"
                                              : "text-[#183b2b]"
                                          }`}>
                                          {item.name}
                                        </p>
                                        <p className="text-[11px] text-[#718575]">
                                          Qty: {item.quantity} · {item.unit}
                                        </p>
                                      </div>
                                    </div>

                                    <span className="text-xs font-bold text-[#183b2b]">
                                      {currency.format(
                                        item.price * item.quantity,
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </motion.div>
            )}

            {/* 3. COMPLETED DELIVERIES HISTORY */}
            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4">
                {completedDeliveries.length === 0 ? (
                  <div className="rounded-3xl border border-[#dce8d4] bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf8ef] text-[#2e7d32]">
                      <PackageCheck className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-[#183b2b]">
                      No Completed Deliveries Yet
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-xs text-[#718575] sm:text-sm">
                      Deliveries you fulfill will be archived here along with
                      your earnings breakdown.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[#dce8d4] bg-white p-4 flex items-center justify-between text-xs text-[#547d46]">
                      <span className="font-bold">
                        Total {completedDeliveries.length} Successful Deliveries
                      </span>
                      <span className="font-bold text-[#183b2b]">
                        Earned: {currency.format(totalEarningsToday)}
                      </span>
                    </div>

                    {completedDeliveries.map((assignment) => {
                      const order = assignment.orderId;
                      if (!order) return null;
                      const orderIdStr = order._id.toString();

                      return (
                        <div
                          key={assignment._id}
                          className="flex flex-col gap-4 rounded-3xl border border-[#dce8d4] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf8ef] text-[#2e7d32]">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#183b2b]">
                                  #{orderIdStr.slice(-6)}
                                </span>
                                <span className="rounded-full bg-[#edf8ef] px-2 py-0.5 text-[11px] font-bold text-[#2e7d32]">
                                  Delivered
                                </span>
                              </div>

                              <p className="mt-1 text-sm font-bold text-[#183b2b]">
                                {order.deliveryAddress?.fullName || "Customer"}
                              </p>
                              <p className="text-xs text-[#718575]">
                                {order.deliveryAddress?.street},{" "}
                                {order.deliveryAddress?.city}
                              </p>
                              <p className="mt-1 text-[11px] text-[#7a9a67]">
                                Delivered at:{" "}
                                {formatDate(
                                  assignment.deliveredAt ||
                                    assignment.updatedAt,
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-[#f0f5ed] pt-3 sm:border-t-0 sm:pt-0 sm:flex-col sm:items-end sm:gap-1">
                            <span className="text-base font-black text-[#183b2b]">
                              {currency.format(order.totalAmount)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf3e3] px-2.5 py-1 text-xs font-bold text-[#2e7d32]">
                              +₹{EARNING_PER_DELIVERY} Credited
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* OTP Verification Dialog */}
      <AnimatePresence>
        {otpDialogOpen && (
          <motion.div
            key="otp-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backdropFilter: "blur(8px)",
              background: "rgba(24,59,43,0.45)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setOtpDialogOpen(false);
                setOtpError(null);
                setOtpValue("");
              }
            }}>
            <motion.div
              key="otp-modal"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#dce8d4] bg-white shadow-[0_32px_80px_-20px_rgba(24,59,43,0.28)]">
              {/* Gradient header */}
              <div className="bg-linear-to-br from-[#183b2b] to-[#2e7d32] px-6 py-7 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-2 ring-white/30">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-black text-white">
                  Delivery OTP Verification
                </h2>
                <p className="mt-1 text-xs font-medium text-white/75">
                  An OTP has been sent to the customer&apos;s registered email. Ask them
                  for the code to confirm handover.
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                <label
                  htmlFor="otp-input"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#547d46]">
                  Enter Customer OTP
                </label>

                <input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={otpValue}
                  onChange={(e) => {
                    setOtpError(null);
                    setOtpValue(e.target.value.replace(/\D/g, ""));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerifyOtp();
                  }}
                  placeholder="e.g. 123456"
                  className="w-full rounded-2xl border-2 border-[#dce8d4] bg-[#f8fbf5] px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-[#183b2b] outline-none transition placeholder:text-[#b6cda8] placeholder:tracking-normal placeholder:text-base placeholder:font-normal focus:border-[#2e7d32] focus:ring-4 focus:ring-[#2e7d32]/10"
                />

                {otpError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{otpError}</span>
                  </motion.div>
                )}

                <div className="mt-5 flex flex-col gap-3">
                  <button
                    id="otp-verify-btn"
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpVerifying || !otpValue.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15803d] py-4 text-sm font-black text-white shadow-md shadow-[#15803d]/25 transition hover:bg-[#166534] active:scale-[0.98] disabled:opacity-50">
                    {otpVerifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Verifying OTP...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Verify &amp; Complete Delivery</span>
                      </>
                    )}
                  </button>

                  <button
                    id="otp-cancel-btn"
                    type="button"
                    onClick={() => {
                      setOtpDialogOpen(false);
                      setOtpError(null);
                      setOtpValue("");
                    }}
                    className="flex w-full items-center justify-center rounded-2xl border border-[#dce8d4] bg-[#f8fbf5] py-3 text-sm font-semibold text-[#547d46] transition hover:bg-[#eaf3e3]">
                    Cancel
                  </button>
                </div>

                <p className="mt-4 text-center text-[11px] text-[#718575]">
                  Ask the customer for the 4-digit OTP sent to their registered
                  phone number.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default DeliveryBoyDashboard;
