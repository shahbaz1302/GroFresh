import connectDB from "@/lib/db";
import groceryModel from "@/models/grocery.model";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectDB();

    const grocery = await groceryModel.findById(id).lean();

    if (!grocery) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ grocery });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch grocery item" },
      { status: 500 },
    );
  }
}
