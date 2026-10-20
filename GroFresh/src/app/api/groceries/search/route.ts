import connectDB from "@/lib/db";
import groceryModel from "@/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({ groceries: [] }, { status: 200 });
    }

    await connectDB();

    // Escape special regex characters
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedQuery, "i");

    const groceries = await groceryModel
      .find({
        $or: [{ name: regex }, { category: regex }, { subCategory: regex }],
      })
      .sort({ name: 1 })
      .limit(10)
      .lean();

    return NextResponse.json(
      {
        groceries: groceries.map((item) => ({
          _id: item._id.toString(),
          name: item.name,
          category: item.category,
          subCategory: item.subCategory,
          image: item.image,
          price: item.price,
          unit: item.unit,
        })),
      },
      { status: 200 },
    );
  } catch (error: any) {
    if (
      error?.digest === "HANGING_PROMISE_REJECTION" ||
      error?.digest?.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("Error searching groceries:", error);
    return NextResponse.json(
      { message: "Failed to search groceries" },
      { status: 500 },
    );
  }
}
