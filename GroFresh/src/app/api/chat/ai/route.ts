import connectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { message, role } = await request.json();

    const userRole = role === "delivery-boy" ? "delivery-boy" : "user";
    const contextMessage =
      message ||
      (userRole === "delivery-boy"
        ? "Heading towards delivery destination"
        : "Where is my order?");

    const prompt = `You are a professional assistant chatbot for a grocery delivery service.

You will be given:
- role: either 'user' or 'delivery-boy'
- last message: the last message sent in the conversation

Your task:
- If role is "user": generate 3 short WhatsApp-style quick replies that a user/customer might send.
- If role is "delivery-boy": generate 3 short WhatsApp-style quick replies that a delivery partner might send.

RULES:
1. Replies must match the context of the last message.
2. Keep replies short and human-like (max 10 words).
3. Use emojis naturally (max 1 emoji per reply).
4. No generic responses like "Okay", "Hmm", "Sure" alone.
5. Each reply must add some value or context.
6. Must be helpful, respectful, and relevant to delivery, status, help, or location.
7. No numbering, no extra instructions, no extra text.
8. Just return comma separated reply suggestions in one line.

Role: ${userRole}
Last message: ${contextMessage}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[CHAT_SUGGESTIONS] Gemini API non-ok status:", response.status, errText);
      return NextResponse.json(
        userRole === "delivery-boy"
          ? ["On my way! 🚴", "Arrived at drop location 📍", "Please come to the door 🚪"]
          : ["Please leave it at the door 📦", "I am at home 👍", "Call upon arrival 📞"],
        { status: 200 }
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleaned = (text || "")
      .replace(/^[\s\n]+|[\s\n]+$/g, "")
      .replace(/"/g, "")
      .replace(/'/g, "'")
      .split(/,|\n/)
      .map((item: any) => item.replace(/^[0-9\.\-\*\s]+/, "").trim())
      .filter((item: any) => item.length > 0)
      .slice(0, 4);

    if (cleaned.length === 0) {
      return NextResponse.json(
        userRole === "delivery-boy"
          ? ["On my way! 🚴", "Arrived at drop location 📍", "Please come to the door 🚪"]
          : ["Please leave it at the door 📦", "I am at home 👍", "Call upon arrival 📞"],
        { status: 200 }
      );
    }

    return NextResponse.json(cleaned, { status: 200 });
  } catch (error) {
    console.error("[CHAT_SUGGESTIONS] Error:", error);
    return NextResponse.json(
      ["On my way! 🚴", "Arrived at drop location 📍", "Please come to the door 🚪"],
      { status: 200 },
    );
  }
}

