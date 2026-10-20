import { auth } from "@/auth";
import { uploadOnCloudinary } from "@/lib/cloudinary";
import connectDB from "@/lib/db";
import {
  isGroceryCategory,
  isSubcategoryForCategory,
} from "@/lib/grocery-categories";
import groceryModel from "@/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json(
      { message: "Only Admin can view groceries" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    const groceries = await groceryModel.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({ groceries });
  } catch (error) {
    console.error("Failed to fetch groceries:", error);
    return NextResponse.json(
      { message: "Failed to load groceries" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json(
      { message: "Only Admin can edit grocery items" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    const formData = await request.formData();
    const id = formData.get("id");
    const name = formData.get("name");
    const priceValue = formData.get("price");
    const categoryValue = formData.get("category");
    const subCategory = formData.get("subCategory");
    const unit = formData.get("unit");
    const image = formData.get("image");

    if (
      typeof id !== "string" ||
      !id.trim() ||
      typeof name !== "string" ||
      !name.trim() ||
      typeof priceValue !== "string" ||
      !Number.isFinite(Number(priceValue)) ||
      Number(priceValue) < 0 ||
      typeof categoryValue !== "string" ||
      !isGroceryCategory(categoryValue) ||
      typeof subCategory !== "string" ||
      !isSubcategoryForCategory(categoryValue, subCategory) ||
      typeof unit !== "string" ||
      !unit.trim()
    ) {
      return NextResponse.json(
        { message: "Please provide valid grocery details." },
        { status: 400 },
      );
    }

    const existingGrocery = await groceryModel.findById(id);
    if (!existingGrocery) {
      return NextResponse.json(
        { message: "Grocery item not found." },
        { status: 404 },
      );
    }

    let imageUrl = existingGrocery.image;
    if (image instanceof Blob && image.size > 0) {
      const uploadedUrl = await uploadOnCloudinary(image);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    existingGrocery.name = name.trim();
    existingGrocery.price = Number(priceValue);
    existingGrocery.category = categoryValue;
    existingGrocery.subCategory = subCategory;
    existingGrocery.unit = unit.trim();
    existingGrocery.image = imageUrl;

    await existingGrocery.save();

    return NextResponse.json({
      message: "Grocery updated successfully",
      grocery: existingGrocery,
    });
  } catch (error) {
    console.error("Failed to edit grocery:", error);
    return NextResponse.json(
      { message: `Failed to update grocery: ${error}` },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json(
      { message: "Only Admin can delete grocery items" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Grocery ID is required." },
        { status: 400 },
      );
    }

    const deleted = await groceryModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { message: "Grocery item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Grocery item deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Failed to delete grocery:", error);
    return NextResponse.json(
      { message: "Failed to delete grocery item" },
      { status: 500 },
    );
  }
}
