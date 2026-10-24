import { auth } from "@/auth";
import GroceryItems from "@/components/GroceryItemCard";
import Navbar from "@/components/Navbar";
import connectDB from "@/lib/db";
import {
  GROCERY_CATEGORIES,
  normalizeGroceryCategory,
} from "@/lib/grocery-categories";
import groceryModel from "@/models/grocery.model";
import userModel from "@/models/user.model";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type ShopPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

const ShopContent = async ({ searchParams }: ShopPageProps) => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  await connectDB();
  const isAdmin =
    session.user?.id === "admin" && session.user?.role === "admin";
  let navbarUser;

  if (isAdmin) {
    navbarUser = {
      name: session?.user?.name ?? "Admin",
      email: session?.user?.email ?? "",
      role: "admin" as const,
    };
  } else {
    const user = await userModel.findById(session.user?.id).lean();

    if (!user) {
      redirect("/login");
    }

    navbarUser = {
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      image: user.image,
    };
  }

  const query = await searchParams;
  const rawCategory =
    typeof query.category === "string" ? query.category : undefined;
  const normalizedCategory = normalizeGroceryCategory(rawCategory);

  if (!normalizedCategory) {
    const firstGrocery = await groceryModel.findOne({}, { category: 1 }).lean();
    const defaultCategory =
      normalizeGroceryCategory(firstGrocery?.category) || GROCERY_CATEGORIES[0];
    redirect(`/shop?category=${encodeURIComponent(defaultCategory)}`);
  }

  if (rawCategory !== normalizedCategory) {
    redirect(`/shop?category=${encodeURIComponent(normalizedCategory)}`);
  }

  const category = normalizedCategory;
  const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const groceries = await groceryModel
    .find({
      category: { $regex: new RegExp(`^${escapedCategory}$`, "i") },
    })
    .sort({ name: 1 })
    .lean();

  return (
    <>
      <Navbar user={navbarUser} />
      <GroceryItems
        category={category}
        groceries={groceries.map((grocery) => ({
          id: grocery._id.toString(),
          name: grocery.name,
          category:
            normalizeGroceryCategory(grocery.category) || grocery.category,
          subCategory: grocery.subCategory,
          image: grocery.image,
          price: grocery.price,
          unit: grocery.unit,
        }))}
      />
    </>
  );
};

const ShopPage = ({ searchParams }: ShopPageProps) => {
  return (
    <Suspense
      fallback={
        <main
          aria-live="polite"
          className="min-h-screen bg-[#f4f8f0] px-4 py-12 text-center text-sm font-medium text-[#718575]">
          Loading groceries...
        </main>
      }>
      <ShopContent searchParams={searchParams} />
    </Suspense>
  );
};

export default ShopPage;
