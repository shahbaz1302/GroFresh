import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import connectDB from "@/lib/db";
import groceryModel from "@/models/grocery.model";
import userModel from "@/models/user.model";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import ProductDetailClient from "@/components/ProductDetailClient";

type ProductPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  try {
    await connectDB();
    const { id } = await params;
    const grocery = await groceryModel.findById(id).lean();
    if (!grocery) return { title: "Product not found | GroFresh" };
    return {
      title: `${grocery.name} | GroFresh`,
      description: `Buy ${grocery.name} online from GroFresh. Category: ${grocery.category}. Price: ₹${grocery.price} per ${grocery.unit}. Delivered in 10 minutes.`,
    };
  } catch {
    return { title: "GroFresh" };
  }
}

const ProductContent = async ({ params }: ProductPageProps) => {
  const session = await auth();
  if (!session) redirect("/login");

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
    if (!user) redirect("/login");
    navbarUser = {
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      image: user.image,
    };
  }

  const { id } = await params;
  const grocery = await groceryModel.findById(id).lean();
  if (!grocery) notFound();

  // Fetch related items matching the same subCategory first, fall back to category
  const subCategoryFilter = grocery.subCategory?.trim()
    ? { category: grocery.category, subCategory: grocery.subCategory, _id: { $ne: grocery._id } }
    : { category: grocery.category, _id: { $ne: grocery._id } };

  let relatedRaw = await groceryModel
    .find(subCategoryFilter)
    .limit(8)
    .lean();

  // If no subcategory matches found, fall back to same category
  if (relatedRaw.length === 0 && grocery.subCategory?.trim()) {
    relatedRaw = await groceryModel
      .find({ category: grocery.category, _id: { $ne: grocery._id } })
      .limit(8)
      .lean();
  }

  const item = {
    id: grocery._id.toString(),
    name: grocery.name,
    category: grocery.category,
    subCategory: grocery.subCategory ?? null,
    image: grocery.image,
    price: grocery.price,
    unit: grocery.unit,
  };

  const related = relatedRaw.map((g) => ({
    id: g._id.toString(),
    name: g.name,
    category: g.category,
    subCategory: g.subCategory ?? null,
    image: g.image,
    price: g.price,
    unit: g.unit,
  }));

  return (
    <>
      <Navbar user={navbarUser} />
      <ProductDetailClient item={item} relatedItems={related} />
    </>
  );
};

const ProductPage = ({ params }: ProductPageProps) => (
  <Suspense
    fallback={
      <main
        aria-live="polite"
        className="min-h-screen bg-[#f4f8f0] px-4 py-12 text-center text-sm font-medium text-[#718575]">
        Loading product...
      </main>
    }>
    <ProductContent params={params} />
  </Suspense>
);

export default ProductPage;
