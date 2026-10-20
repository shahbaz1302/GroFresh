"use client";

import { IOrder } from "@/models/order.model";
import { RootState } from "@/redux/store";
import axios from "axios";
import {
  ArrowLeft,
  Send,
  Bike,
  Phone,
  MapPin,
  MessageSquare,
  Check,
  Sparkles,
  ShoppingBag,
  Navigation,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { useSelector } from "react-redux";
import dynamic from "next/dynamic";
import { getSocket } from "@/lib/socket";
import { IMessage } from "@/models/message.model";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 sm:h-96 w-full items-center justify-center rounded-2xl border border-[#dce8d4] bg-[#f9fbf8] text-sm font-medium text-[#718575]">
      Loading live navigation map...
    </div>
  ),
});

const CUSTOMER_QUICK_REPLIES = [
  "Leave at the door 📦",
  "I'm at home 👍",
  "Please ring the bell 🔔",
  "Call upon arrival 📞",
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const TrackOrderContent = () => {
  const { orderId } = useParams() as { orderId: string };
  const [order, setOrder] = useState<IOrder>();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userData } = useSelector((state: RootState) => state.user);
  const userIdStr = userData?._id?.toString();

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages.length]);

  useEffect(() => {
    if (!orderId) return;
    const getOrder = async () => {
      try {
        const res = await axios.get(`/api/user/get-order/${orderId}`);
        setOrder(res.data);
        if (res.data?.deliveryAddress) {
          const lat = Number(res.data.deliveryAddress.latitude);
          const lng = Number(res.data.deliveryAddress.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
            setUserLocation({ latitude: lat, longitude: lng });
          }
        }
        if (res.data?.assignedDeliveryBoy?.location?.coordinates) {
          const coords = res.data.assignedDeliveryBoy.location.coordinates;
          if (Array.isArray(coords) && coords.length >= 2 && (coords[0] !== 0 || coords[1] !== 0)) {
            setDeliveryBoyLocation({
              latitude: coords[1],
              longitude: coords[0],
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
      }
    };
    getOrder();
  }, [orderId, userData?._id]);

  useEffect(() => {
    const socket = getSocket();
    const handleLocationUpdate = ({ userId, location }: any) => {
      const assignedId = (order?.assignedDeliveryBoy as any)?._id?.toString();
      if (userId && assignedId && userId.toString() === assignedId) {
        if (location?.coordinates && location.coordinates.length >= 2) {
          const lat = Number(location.coordinates[1]);
          const lng = Number(location.coordinates[0]);
          if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
            setDeliveryBoyLocation({
              latitude: lat,
              longitude: lng,
            });
          }
        }
      }
    };

    socket.on("update-deliveryBoy-location", handleLocationUpdate);
    return () => {
      socket.off("update-deliveryBoy-location", handleLocationUpdate);
    };
  }, [order]);

  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    socket.emit("join-room", orderId);

    const handleIncomingMessage = (message: IMessage) => {
      if (message.roomId?.toString() === orderId.toString()) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) =>
              (m._id && message._id && m._id.toString() === message._id.toString()) ||
              (m.time === message.time &&
                m.text === message.text &&
                m.senderId?.toString() === message.senderId?.toString()),
          );
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on("send-message", handleIncomingMessage);

    return () => {
      socket.off("send-message", handleIncomingMessage);
      socket.off("join-room");
    };
  }, [orderId]);

  // Fetch past chat messages
  useEffect(() => {
    if (!orderId) return;
    const getAllMessages = async () => {
      try {
        setLoadingChat(true);
        const res = await axios.post(`/api/chat/messages`, { roomId: orderId });
        if (Array.isArray(res.data)) {
          setMessages(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch chat messages:", error);
      } finally {
        setLoadingChat(false);
      }
    };
    getAllMessages();
  }, [orderId]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend ?? newMessage).trim();
    if (!text || !userIdStr || !orderId) return;

    const socket = getSocket();
    const timeStr = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const payload = {
      roomId: orderId,
      senderId: userIdStr,
      text,
      time: timeStr,
    };

    socket.emit("send-message", payload);
    setNewMessage("");
  };

  const getAiSuggestions = async () => {
    try {
      setLoadingAiSuggestions(true);
      const lastRiderMsg = messages
        .filter((m) => m.senderId?.toString() !== userIdStr)
        .at(-1)?.text;

      const res = await axios.post(`/api/chat/ai`, {
        role: "user",
        message:
          lastRiderMsg ||
          messages.at(-1)?.text ||
          "Order delivery in progress",
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAiSuggestions(res.data);
      }
    } catch (error) {
      console.error("Failed to get AI suggestions:", error);
    } finally {
      setLoadingAiSuggestions(false);
    }
  };

  const assignedBoy = order?.assignedDeliveryBoy as any;

  const orderStatusConfig = useMemo(() => {
    switch (order?.status) {
      case "outForDelivery":
        return {
          label: "Out for Delivery",
          colorClass: "bg-blue-100 text-[#0284c7] border-blue-200",
          dotColor: "bg-blue-500",
          desc: "Your rider is on the way with your fresh groceries!",
        };
      case "delivered":
        return {
          label: "Delivered",
          colorClass: "bg-emerald-100 text-[#15803d] border-emerald-200",
          dotColor: "bg-emerald-500",
          desc: "Package safely handed over. Enjoy your fresh groceries!",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          colorClass: "bg-red-100 text-red-700 border-red-200",
          dotColor: "bg-red-500",
          desc: "This order has been cancelled.",
        };
      default:
        return {
          label: "Order Placed",
          colorClass: "bg-[#eaf3e3] text-[#2e7d32] border-[#dce8d4]",
          dotColor: "bg-emerald-500",
          desc: "Grocery items are being packed at the store hub.",
        };
    }
  }, [order?.status]);

  return (
    <main className="min-h-screen bg-[#f4f8f0] px-4 py-6 font-sans text-[#183b2b] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* TOP BAR / NAVIGATION */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 rounded-full border border-[#dce8d4] bg-white px-4 py-2 text-xs font-bold text-[#2e7d32] shadow-xs transition hover:border-[#b6cda8] hover:bg-[#eaf3e3]">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Orders</span>
            </Link>

            <span className="hidden sm:inline-block text-[#dce8d4]">•</span>
            <span className="text-xs font-mono font-semibold text-[#547d46]">
              Order #{orderId?.slice(-6)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Real-time rider GPS badge */}
            {deliveryBoyLocation ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Live GPS Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fed7aa] bg-[#fffbf5] px-3 py-1 text-xs font-semibold text-[#c2410c]">
                <Clock className="h-3.5 w-3.5 animate-spin" />
                Connecting GPS...
              </span>
            )}

            {/* Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${orderStatusConfig.colorClass}`}>
              <span
                className={`h-2 w-2 rounded-full ${orderStatusConfig.dotColor} animate-pulse`}></span>
              {orderStatusConfig.label}
            </span>
          </div>
        </div>

        {/* MAIN RESPONSIVE SPLIT GRID */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Map & Delivery Info (7 Cols on desktop) */}
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            {/* Live Map Card */}
            <div className="overflow-hidden rounded-3xl border border-[#dce8d4] bg-white p-4 shadow-[0_12px_40px_-20px_rgba(24,59,43,0.12)] sm:p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-black text-[#183b2b] sm:text-lg">
                    <Navigation className="h-5 w-5 text-[#2e7d32]" />
                    <span>Real-Time Delivery Route</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-[#718575]">
                    {orderStatusConfig.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#547d46]">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f5ed] px-2.5 py-1">
                    <Bike className="h-3.5 w-3.5 text-[#2e7d32]" /> Rider
                  </span>
                  <span>→</span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f5ed] px-2.5 py-1">
                    <MapPin className="h-3.5 w-3.5 text-[#2e7d32]" /> You
                  </span>
                </div>
              </div>

              {/* Leaflet Live Map */}
              {userLocation ? (
                <LiveMap
                  userLocation={userLocation}
                  deliveryBoyLocation={deliveryBoyLocation}
                  className="relative h-85 sm:h-105 w-full rounded-2xl overflow-hidden border border-[#dce8d4] shadow-inner"
                />
              ) : (
                <div className="flex h-72 sm:h-96 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#dce8d4] bg-[#f9fbf8] p-6 text-center">
                  <MapPin className="h-8 w-8 text-[#547d46] animate-bounce" />
                  <p className="mt-3 text-sm font-bold text-[#183b2b]">
                    Locating Delivery Coordinates...
                  </p>
                  <p className="mt-1 text-xs text-[#718575]">
                    Syncing your drop point with the live dispatch network.
                  </p>
                </div>
              )}
            </div>

            {/* Delivery Partner & Drop Details Card */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Delivery Partner Card */}
              <div className="rounded-3xl border border-[#dce8d4] bg-white p-5 shadow-sm">
                <span className="text-xs font-black uppercase tracking-wider text-[#547d46]">
                  Delivery Partner
                </span>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf3e3] text-[#2e7d32] shadow-inner">
                      <Bike className="h-6 w-6" />
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"></span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-[#183b2b]">
                        {assignedBoy?.name || "Assigned GroFresh Partner"}
                      </h4>
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-[#547d46]">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Verified Rider
                      </p>
                    </div>
                  </div>

                  {assignedBoy?.mobile && (
                    <a
                      href={`tel:${assignedBoy.mobile}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dce8d4] bg-white text-[#2e7d32] shadow-xs transition hover:bg-[#eaf3e3]"
                      title="Call Delivery Partner">
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Delivery Destination */}
              <div className="rounded-3xl border border-[#dce8d4] bg-white p-5 shadow-sm">
                <span className="text-xs font-black uppercase tracking-wider text-[#547d46]">
                  Drop Destination
                </span>

                <div className="mt-3 space-y-1">
                  <p className="text-xs font-bold text-[#183b2b]">
                    {order?.deliveryAddress?.fullName || userData?.name || "Recipient"}
                  </p>
                  <p className="text-xs font-medium text-[#526a57] line-clamp-2">
                    {order?.deliveryAddress?.street}
                  </p>
                  <p className="text-xs text-[#718575]">
                    {order?.deliveryAddress?.city},{" "}
                    {order?.deliveryAddress?.pincode}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Bag Summary */}
            <div className="rounded-3xl border border-[#dce8d4] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-[#2e7d32]" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#183b2b]">
                    Order Summary ({order?.items?.length || 0} items)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-[#dce8d4] bg-[#f9fcf7] px-3 py-1 text-xs font-black text-[#183b2b]">
                    {currency.format(order?.totalAmount || 0)}
                  </span>
                  <span
                    className={`rounded-xl px-2.5 py-1 text-[11px] font-bold ${
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
            </div>
          </div>

          {/* RIGHT COLUMN: Live Rider Chat (5 Cols on desktop) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-6 flex flex-col overflow-hidden rounded-3xl border border-[#dce8d4] bg-white shadow-[0_12px_40px_-20px_rgba(24,59,43,0.12)]">
              {/* Chat Card Header */}
              <div className="flex items-center justify-between border-b border-[#eef4ea] bg-[#f9fbf8] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#eaf3e3] text-[#2e7d32]">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#183b2b]">
                      Chat with Rider
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                      </span>
                      <p className="text-[11px] font-medium text-[#547d46]">
                        {assignedBoy?.name ? `${assignedBoy.name} • Active` : "Delivery Partner Online"}
                      </p>
                    </div>
                  </div>
                </div>

                <span className="rounded-full bg-[#eaf3e3] px-2.5 py-0.5 text-[11px] font-bold text-[#2e7d32]">
                  {messages.length} msg{messages.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Chat Message Stream */}
              <div className="flex h-95 sm:h-110 flex-col gap-3 overflow-y-auto bg-[#fafcf9] p-4 text-xs scrollbar-thin sm:p-5">
                {loadingChat ? (
                  <div className="flex h-full items-center justify-center text-[#718575]">
                    <p className="text-xs animate-pulse">Loading conversation...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="my-auto flex flex-col items-center justify-center text-center text-[#718575]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f5ed] text-[#547d46]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="mt-3 font-bold text-[#183b2b]">
                      Message your rider
                    </p>
                    <p className="mt-1 max-w-55 text-[11px] text-[#718575]">
                      Need to leave gate instructions or verify arrival? Send a quick message!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId?.toString() === userIdStr;
                    return (
                      <div
                        key={msg._id?.toString() || `${idx}-${msg.time}`}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 shadow-xs transition ${
                            isMe
                              ? "rounded-2xl rounded-tr-xs bg-[#183b2b] text-white"
                              : "rounded-2xl rounded-tl-xs border border-[#dce8d4] bg-white text-[#183b2b]"
                          }`}>
                          <p className="text-xs leading-relaxed font-medium">
                            {msg.text}
                          </p>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                              isMe ? "text-[#a3c4ab]" : "text-[#718575]"
                            }`}>
                            <span>{msg.time}</span>
                            {isMe && <Check className="h-3 w-3 text-emerald-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Preset Buttons & AI Suggestions for Customers */}
              <div className="border-t border-[#f0f5ed] bg-[#f9fbf8] px-3.5 py-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#2e7d32]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#183b2b]">
                      {aiSuggestions.length > 0
                        ? "AI Smart Replies"
                        : "Quick Replies"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={getAiSuggestions}
                    disabled={loadingAiSuggestions}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2e7d32]/30 bg-[#eaf3e3] px-2.5 py-1 text-[11px] font-bold text-[#2e7d32] shadow-xs transition hover:bg-[#d8eed3] disabled:opacity-50">
                    <Sparkles
                      className={`h-3 w-3 ${loadingAiSuggestions ? "animate-spin" : ""}`}
                    />
                    <span>
                      {loadingAiSuggestions
                        ? "Generating..."
                        : "✨ AI Suggestions"}
                    </span>
                  </button>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {aiSuggestions.length > 0 ? (
                    <>
                      {aiSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(suggestion)}
                          className="shrink-0 rounded-full border border-[#2e7d32]/40 bg-[#edf8ea] px-3 py-1 text-[11px] font-semibold text-[#1e5824] shadow-xs transition hover:border-[#2e7d32] hover:bg-[#d8eed3] flex items-center gap-1">
                          <span>{suggestion}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setAiSuggestions([])}
                        className="shrink-0 rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-500 hover:bg-gray-100"
                        title="Reset to default shortcuts">
                        Reset
                      </button>
                    </>
                  ) : (
                    CUSTOMER_QUICK_REPLIES.map((reply, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(reply)}
                        className="shrink-0 rounded-full border border-[#dce8d4] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2e7d32] shadow-xs transition hover:border-[#b6cda8] hover:bg-[#eaf3e3]">
                        {reply}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Send Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 border-t border-[#eef4ea] bg-white p-3 sm:p-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send a note to rider..."
                  className="flex-1 rounded-2xl border border-[#dce8d4] bg-[#f9fbf8] px-3.5 py-2.5 text-xs font-medium text-[#183b2b] placeholder-[#718575] transition focus:border-[#2e7d32] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2e7d32] text-white shadow-sm transition hover:bg-[#256629] disabled:opacity-40 disabled:hover:bg-[#2e7d32]">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const TrackOrder = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4f8f0]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2e7d32] border-t-transparent"></div>
            <p className="text-sm font-bold text-[#183b2b]">Loading order tracking...</p>
          </div>
        </div>
      }>
      <TrackOrderContent />
    </Suspense>
  );
};

export default TrackOrder;
