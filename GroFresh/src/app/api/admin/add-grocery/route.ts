import { auth } from "@/auth";
import { uploadOnCloudinary } from "@/lib/cloudinary";
import connectDB from "@/lib/db";
import groceryModel from "@/models/grocery.model";
import {
  isGroceryCategory,
  isSubcategoryForCategory,
} from "@/lib/grocery-categories";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json(
        { message: "Only Admin can add grocery" },
        { status: 401 },
      );
    }
    const formData = await request.formData();
    const name = formData.get("name");
    const priceValue = formData.get("price");
    const categoryValue = formData.get("category");
    const subCategory = formData.get("subCategory");
    const unit = formData.get("unit");
    const image = formData.get("image");

    if (
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
      !unit.trim() ||
      !(image instanceof Blob)
    ) {
      return NextResponse.json(
        { message: "Please provide valid grocery details and an image." },
        { status: 400 },
      );
    }

    const imageUrl = await uploadOnCloudinary(image);
    const grocery = await groceryModel.create({
      name: name.trim(),
      price: Number(priceValue),
      category: categoryValue,
      subCategory,
      unit: unit.trim(),
      image: imageUrl,
    });
    return NextResponse.json(grocery, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: `Failed to add grocery ${error}` },
      { status: 500 },
    );
  }
}
