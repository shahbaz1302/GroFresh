import { auth } from "@/auth";
import GroceryItems from "@/components/GroceryItemCard";
import Navbar from "@/components/Navbar";
import connectDB from "@/lib/db";
import { GROCERY_CATEGORIES } from "@/lib/grocery-categories";
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
  let category =
    typeof query.category === "string" ? query.category : undefined;

  if (!category) {
    const firstGrocery = await groceryModel.findOne({}, { category: 1 }).lean();
    const defaultCategory = firstGrocery?.category || GROCERY_CATEGORIES[0];
    redirect(`/shop?category=${encodeURIComponent(defaultCategory)}`);
  }

  const groceries = await groceryModel
    .find({ category })
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
          category: grocery.category,
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
