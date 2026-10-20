"use client";

import { getSocket } from "@/lib/socket";
import { IMessage } from "@/models/message.model";
import axios from "axios";
import { Send, MessageSquare, Check, Sparkles } from "lucide-react";
import mongoose from "mongoose";
import { useEffect, useRef, useState } from "react";

type DeliveryBoyChatProps = {
  orderId: string;
  deliveryBoyId: mongoose.Types.ObjectId | string;
};

const QUICK_REPLIES = [
  "On my way! 🚴",
  "Arrived at drop location 📍",
  "Please come to the door 🚪",
  "Need help with directions 🗺️",
];

const DeliveryBoyChat = ({ orderId, deliveryBoyId }: DeliveryBoyChatProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const deliveryBoyIdStr = deliveryBoyId?.toString();

  // Auto-scroll to bottom of chat
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages.length]);

  // Join order room
  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    socket.emit("join-room", orderId);

    const handleIncomingMessage = (message: IMessage) => {
      if (message.roomId?.toString() === orderId.toString()) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) =>
              (m._id &&
                message._id &&
                m._id.toString() === message._id.toString()) ||
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

  // Fetch initial message history
  useEffect(() => {
    if (!orderId) return;
    const getAllMessages = async () => {
      try {
        setLoading(true);
        const res = await axios.post(`/api/chat/messages`, { roomId: orderId });
        if (Array.isArray(res.data)) {
          setMessages(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch chat messages:", error);
      } finally {
        setLoading(false);
      }
    };
    getAllMessages();
  }, [orderId]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend ?? newMessage).trim();
    if (!text || !deliveryBoyIdStr || !orderId) return;

    const socket = getSocket();
    const timeStr = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const payload = {
      roomId: orderId,
      senderId: deliveryBoyIdStr,
      text,
      time: timeStr,
    };

    socket.emit("send-message", payload);
    setNewMessage("");
  };

  const getSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const lastCustomerMsg = messages
        .filter((m) => m.senderId?.toString() !== deliveryBoyIdStr)
        .at(-1)?.text;

      const res = await axios.post(`/api/chat/ai`, {
        role: "delivery-boy",
        message:
          lastCustomerMsg ||
          messages.at(-1)?.text ||
          "Heading towards delivery destination",
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSuggestions(res.data);
      }
    } catch (error) {
      console.error("Failed to get suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <div className="flex flex-col rounded-3xl border border-[#dce8d4] bg-white shadow-sm overflow-hidden">
      {/* Chat Card Header */}
      <div className="flex items-center justify-between border-b border-[#eef4ea] bg-[#f9fbf8] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf3e3] text-[#2e7d32]">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#183b2b]">
              Customer Chat
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-semibold text-[#547d46]">
                Direct Dispatch Channel
              </span>
            </div>
          </div>
        </div>
        <span className="rounded-full bg-[#eaf3e3] px-2.5 py-0.5 text-[10px] font-bold text-[#2e7d32]">
          {messages.length} msg{messages.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Messages Scroll Box */}
      <div className="flex h-56 flex-col gap-2.5 overflow-y-auto bg-[#fafcf9] p-4 text-xs scrollbar-thin sm:h-64 sm:p-5">
        {loading ? (
          <div className="flex h-full items-center justify-center text-[#718575]">
            <p className="text-xs animate-pulse">Loading message history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center text-[#718575]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f0f5ed] text-[#547d46]">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-2 font-bold text-[#183b2b]">No messages yet</p>
            <p className="max-w-55 text-[11px] text-[#718575]">
              Coordinate handover, gates, or directions directly with the
              customer.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId?.toString() === deliveryBoyIdStr;
            return (
              <div
                key={msg._id?.toString() || `${idx}-${msg.time}`}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 shadow-xs transition ${
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

      {/* Quick Delivery Shortcuts & AI Suggestions */}
      <div className="border-t border-[#f0f5ed] bg-[#f9fbf8] px-3.5 py-2.5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#2e7d32]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#183b2b]">
              {suggestions.length > 0 ? "AI Smart Replies" : "Quick Replies"}
            </span>
          </div>

          <button
            type="button"
            onClick={getSuggestions}
            disabled={loadingSuggestions}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2e7d32]/30 bg-[#eaf3e3] px-2.5 py-1 text-[11px] font-bold text-[#2e7d32] shadow-xs transition hover:bg-[#d8eed3] disabled:opacity-50">
            <Sparkles
              className={`h-3 w-3 ${loadingSuggestions ? "animate-spin" : ""}`}
            />
            <span>
              {loadingSuggestions ? "Generating..." : "✨ AI Suggestions"}
            </span>
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((suggestion, idx) => (
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
                onClick={() => setSuggestions([])}
                className="shrink-0 rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-500 hover:bg-gray-100"
                title="Reset to default shortcuts">
                Reset
              </button>
            </>
          ) : (
            QUICK_REPLIES.map((reply, idx) => (
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

      {/* Input Form */}
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
          placeholder="Type message to customer..."
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
  );
};

export default DeliveryBoyChat;
