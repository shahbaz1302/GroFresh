import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProductDetailClient from "@/components/ProductDetailClient";
import connectDB from "@/lib/db";
import groceryModel from "@/models/grocery.model";
import userModel from "@/models/user.model";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

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
      title: `${grocery.name} | GroFresh - 10 Min Delivery`,
      description: `Buy fresh ${grocery.name} online from GroFresh. Category: ${grocery.category}. Price: ₹${grocery.price} per ${grocery.unit}. Superfast 10-minute doorstep delivery.`,
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
    ? {
        category: grocery.category,
        subCategory: grocery.subCategory,
        _id: { $ne: grocery._id },
      }
    : { category: grocery.category, _id: { $ne: grocery._id } };

  let relatedRaw = await groceryModel.find(subCategoryFilter).limit(8).lean();

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
    <div className="flex min-h-screen flex-col justify-between bg-[#f4f8f0]">
      <div>
        <Navbar user={navbarUser} />
        <ProductDetailClient item={item} relatedItems={related} />
      </div>
      <Footer />
    </div>
  );
};

/* Modern shimmer skeleton matching GroFresh layout */
function ProductPageSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading product details"
      className="min-h-screen bg-[#f4f8f0] pb-24 font-sans text-[#183b2b]">
      {/* Breadcrumb Skeleton */}
      <div className="border-b border-[#e5ecdf] bg-white/80 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <div className="h-4 w-12 animate-pulse rounded bg-[#e8eee3]" />
          <span className="text-[#c8d4c3]">/</span>
          <div className="h-4 w-24 animate-pulse rounded bg-[#e8eee3]" />
          <span className="text-[#c8d4c3]">/</span>
          <div className="h-4 w-36 animate-pulse rounded bg-[#e8eee3]" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Back button skeleton */}
        <div className="h-9 w-24 animate-pulse rounded-full bg-white shadow-xs" />

        {/* Main Product Showcase Skeleton */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          {/* Image box skeleton */}
          <div className="overflow-hidden rounded-3xl border border-[#e5ecdf] bg-white p-8 shadow-xs">
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-[#f6f9f3]" />
            <div className="mt-6 grid grid-cols-4 gap-2 border-t border-[#edf2e8] pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-[#e8eee3]" />
                  <div className="h-3 w-12 animate-pulse rounded bg-[#e8eee3]" />
                </div>
              ))}
            </div>
          </div>

          {/* Details skeleton */}
          <div className="flex flex-col gap-4">
            <div className="h-6 w-28 animate-pulse rounded-full bg-[#e8eee3]" />
            <div className="h-9 w-3/4 animate-pulse rounded-xl bg-[#e8eee3]" />
            <div className="h-4 w-40 animate-pulse rounded bg-[#e8eee3]" />
            <div className="h-10 w-48 animate-pulse rounded-xl bg-[#e8eee3]" />
            <div className="h-14 w-full animate-pulse rounded-2xl bg-[#eaf3e3]" />
            <div className="h-13 w-full animate-pulse rounded-2xl bg-[#0a8f4c]/20" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-2xl border border-[#e5ecdf] bg-white"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const ProductPage = ({ params }: ProductPageProps) => (
  <Suspense fallback={<ProductPageSkeleton />}>
    <ProductContent params={params} />
  </Suspense>
);

export default ProductPage;
