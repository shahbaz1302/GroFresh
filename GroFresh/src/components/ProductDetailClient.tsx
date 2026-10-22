"use client";

import {
  setCartData,
  updateQuantity as updateCartQuantity,
} from "@/redux/cartSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { getSubcategoryLabel } from "@/lib/grocery-categories";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Leaf,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

type GroceryItem = {
  id: string;
  name: string;
  category: string;
  subCategory?: string | null;
  image: string;
  price: number;
  unit: string;
};

type Props = { item: GroceryItem; relatedItems: GroceryItem[] };

const DELIVERY_PROMISES = [
  { icon: Zap, label: "10 min delivery", color: "#f59e0b" },
  { icon: ShieldCheck, label: "100% safe", color: "#10b981" },
  { icon: RefreshCw, label: "Easy returns", color: "#6366f1" },
  { icon: Truck, label: "Free over ₹100", color: "#3b82f6" },
];

const HIGHLIGHTS = [
  { icon: Leaf, label: "Fresh & natural" },
  { icon: BadgeCheck, label: "Quality assured" },
  { icon: Clock, label: "Long shelf life" },
  { icon: Package, label: "Hygienic packing" },
];

export default function ProductDetailClient({ item, relatedItems }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { cartData } = useSelector((state: RootState) => state.cart);

  const cartQuantity = cartData.find((c) => c._id === item.id)?.quantity ?? 0;
  const totalCartQty = cartData.reduce((t, c) => t + c.quantity, 0);

  const subCatLabel = getSubcategoryLabel(item.category, item.subCategory);

  const handleAdd = () => {
    dispatch(
      setCartData({
        _id: item.id,
        name: item.name,
        category: item.category,
        image: item.image,
        price: item.price,
        unit: item.unit,
        quantity: 1,
      }),
    );
  };

  const handleInc = () =>
    dispatch(updateCartQuantity({ groceryId: item.id, change: 1 }));
  const handleDec = () =>
    dispatch(updateCartQuantity({ groceryId: item.id, change: -1 }));

  const handleOpenCart = () =>
    window.dispatchEvent(new Event("grofresh-open-cart"));

  return (
    <main className="min-h-screen bg-[#f4f8f0] pb-28 font-sans text-[#183b2b]">
      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-[#e5ead9] px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-xs text-[#6b7a6d]">
          <Link
            href="/"
            className="hover:text-[#3f6535] transition"
            id="breadcrumb-home">
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/shop?category=${encodeURIComponent(item.category)}`}
            className="hover:text-[#3f6535] transition truncate max-w-30"
            id="breadcrumb-category">
            {item.category}
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#183b2b] truncate max-w-37.5">
            {item.name}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Back button ── */}
        <button
          id="back-btn"
          type="button"
          onClick={() => router.back()}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#dce8d4] bg-white px-4 py-2 text-xs font-semibold text-[#547d46] shadow-sm transition hover:border-[#b6cda8] hover:bg-[#f8fbf5]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        {/* ── Main Product Card ── */}
        <section
          className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-10"
          aria-label="Product details">
          {/* Image panel */}
          <div className="relative overflow-hidden rounded-3xl border border-[#e2ead9] bg-white shadow-sm">
            {/* Badges */}
            <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0a8f4c] px-2.5 py-1 text-[11px] font-bold text-white shadow">
                <Zap className="h-3 w-3" />
                10 min
              </span>
              {item.subCategory && (
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#547d46] shadow backdrop-blur-sm">
                  {subCatLabel}
                </span>
              )}
            </div>

            <div className="relative flex items-center justify-center p-6 sm:p-10 aspect-square">
              <Image
                src={item.image}
                alt={item.name}
                fill
                priority
                sizes="(max-width: 768px) 90vw, 45vw"
                className="object-contain p-6 sm:p-10 drop-shadow-lg transition duration-500 hover:scale-105"
              />
            </div>

            {/* Delivery promise strip */}
            <div className="grid grid-cols-4 border-t border-[#e5ead9] bg-[#f9fcf5]">
              {DELIVERY_PROMISES.map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 py-3 px-1 text-center">
                  <Icon className="h-4 w-4" style={{ color }} />
                  <span className="text-[9px] font-semibold text-[#64776a] leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Info panel */}
          <div className="flex flex-col">
            {/* Category pill */}
            <Link
              href={`/shop?category=${encodeURIComponent(item.category)}`}
              id="product-category-link"
              className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#eaf3e3] px-3 py-1.5 text-xs font-bold text-[#3f6535] transition hover:bg-[#d9eccc]">
              <Tag className="h-3 w-3" />
              {item.category}
            </Link>

            {/* Name */}
            <h1 className="text-2xl font-black tracking-tight text-[#183b2b] sm:text-3xl lg:text-4xl leading-tight">
              {item.name}
            </h1>

            {/* Sub-label */}
            <p className="mt-1 text-sm font-medium text-[#82967b]">
              {subCatLabel} · per {item.unit}
            </p>

            {/* Rating (decorative) */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= 4 ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-[#e5e7eb] text-[#e5e7eb]"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-[#183b2b]">4.0</span>
              <span className="text-xs text-[#82967b]">(200+ orders)</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3">
              <p className="text-4xl font-black text-[#0a8f4c]">
                ₹
                {item.price.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm font-medium text-[#82967b]">
                per {item.unit}
              </p>
              {/* Decorative MRP */}
              <p className="text-sm font-medium text-[#a0a0a0] line-through">
                ₹
                {(item.price * 1.15).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-xs font-bold text-[#b91c1c]">
                13% OFF
              </span>
            </div>

            {/* Delivery info */}
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f0faf4] border border-[#c0e4c9] px-4 py-3">
              <Zap className="h-4 w-4 shrink-0 text-[#0a8f4c]" />
              <p className="text-sm font-semibold text-[#1a5c34]">
                Delivery in{" "}
                <span className="text-[#0a8f4c]">10 minutes</span>{" "}
              </p>
            </div>

            {/* Add to cart / Quantity */}
            <div className="mt-6">
              {cartQuantity === 0 ? (
                <button
                  id="add-to-cart-btn"
                  type="button"
                  onClick={handleAdd}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0a8f4c] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#0a8f4c]/30 transition hover:bg-[#078042] hover:shadow-[#078042]/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0a8f4c]/40">
                  <ShoppingCart className="h-5 w-5" />
                  Add to cart
                </button>
              ) : (
                <div className="flex items-center justify-between rounded-2xl bg-[#0a8f4c] px-2 py-2 shadow-lg shadow-[#0a8f4c]/30">
                  <button
                    id="decrease-qty-btn"
                    type="button"
                    onClick={handleDec}
                    aria-label="Remove one"
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white transition hover:bg-[#078042] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white">
                    <Minus className="h-5 w-5" />
                  </button>
                  <span
                    aria-live="polite"
                    className="min-w-12 text-center text-xl font-black text-white">
                    {cartQuantity}
                  </span>
                  <button
                    id="increase-qty-btn"
                    type="button"
                    onClick={handleInc}
                    aria-label="Add one more"
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white transition hover:bg-[#078042] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              )}

              {totalCartQty > 0 && (
                <button
                  id="view-cart-btn"
                  type="button"
                  onClick={handleOpenCart}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#0a8f4c] px-6 py-3.5 text-sm font-bold text-[#0a8f4c] transition hover:bg-[#f0faf4] active:scale-[0.98]">
                  <ShoppingBag className="h-4 w-4" />
                  View cart ({totalCartQty}{" "}
                  {totalCartQty === 1 ? "item" : "items"})
                </button>
              )}
            </div>

            {/* Highlights */}
            <div className="mt-7 grid grid-cols-2 gap-3">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-[#e5ead9] bg-white px-3 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf3e3]">
                    <Icon className="h-4 w-4 text-[#3f6535]" />
                  </div>
                  <span className="text-xs font-semibold text-[#344b38]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Product details table */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-[#e5ead9] bg-white">
              <div className="border-b border-[#eef4e8] bg-[#f8fbf5] px-5 py-3">
                <h2 className="text-sm font-bold text-[#183b2b]">
                  Product information
                </h2>
              </div>
              <dl className="divide-y divide-[#eef4e8]">
                {[
                  { label: "Category", value: item.category },
                  { label: "Subcategory", value: subCatLabel },
                  { label: "Unit", value: item.unit },
                  {
                    label: "Price",
                    value: `₹${item.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex px-5 py-3 text-sm">
                    <dt className="w-1/3 font-semibold text-[#64776a]">
                      {label}
                    </dt>
                    <dd className="flex-1 font-medium text-[#183b2b]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── Related Products ── */}
        {relatedItems.length > 0 && (
          <section className="mt-12" aria-label="Related products">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a9a67]">
                  You may also like
                </p>
                <h2 className="text-xl font-black tracking-tight text-[#183b2b] sm:text-2xl">
                  {item.subCategory ? (
                    <>
                      More{" "}
                      <span className="text-[#3f6535]">
                        {getSubcategoryLabel(item.category, item.subCategory)}
                      </span>
                    </>
                  ) : (
                    <>
                      More from{" "}
                      <span className="text-[#3f6535]">{item.category}</span>
                    </>
                  )}
                </h2>
              </div>
              <Link
                href={`/shop?category=${encodeURIComponent(item.category)}`}
                id="see-all-category-link"
                className="inline-flex items-center gap-1 rounded-full border border-[#dce8d4] bg-white px-3.5 py-2 text-xs font-semibold text-[#547d46] shadow-xs transition hover:border-[#b6cda8] hover:bg-[#f8fbf5]">
                See all →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {relatedItems.map((rel) => (
                <RelatedCard
                  key={rel.id}
                  item={rel}
                  cartData={cartData}
                  dispatch={dispatch}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* ── Related Product Card ── */
function RelatedCard({
  item,
  cartData,
  dispatch,
}: {
  item: GroceryItem;
  cartData: ReturnType<
    typeof useSelector<RootState, RootState["cart"]["cartData"]>
  >;
  dispatch: AppDispatch;
}) {
  const quantity = cartData.find((c) => c._id === item.id)?.quantity ?? 0;
  const subCatLabel = getSubcategoryLabel(item.category, item.subCategory);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(
      setCartData({
        _id: item.id,
        name: item.name,
        category: item.category,
        image: item.image,
        price: item.price,
        unit: item.unit,
        quantity: 1,
      }),
    );
  };

  const handleChange = (e: React.MouseEvent, change: number) => {
    e.preventDefault();
    dispatch(updateCartQuantity({ groceryId: item.id, change }));
  };

  return (
    <Link
      href={`/product/${item.id}`}
      id={`related-product-${item.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#e9eee5] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#c5d9b8] hover:shadow-[0_12px_30px_-16px_rgba(24,59,43,0.28)] sm:rounded-2xl">
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f6f9f3]">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 48vw, (max-width: 1024px) 22vw, 18vw"
          className="object-contain p-2.5 transition duration-300 group-hover:scale-105 sm:p-4"
        />
      </div>

      {/* Info */}
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        <p className="mb-1.5 inline-flex max-w-full rounded-full bg-[#eef5e8] px-2.5 py-1 text-[10px] font-semibold text-[#547d46] sm:text-[11px]">
          <span className="truncate">{subCatLabel}</span>
        </p>
        <p className="truncate text-sm font-bold text-[#183b2b]">{item.name}</p>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-1">
          <p className="text-sm font-extrabold text-[#3f6535] sm:text-base">
            ₹
            {item.price.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-[10px] font-medium text-[#82967b]">
            per {item.unit}
          </p>
        </div>
      </div>

      {/* Cart controls */}
      <div className="mt-auto px-3 pb-3 sm:px-4 sm:pb-4">
        {quantity === 0 ? (
          <button
            type="button"
            onClick={handleAdd}
            id={`add-related-${item.id}`}
            className="mt-2 w-full rounded-lg border border-[#76a85b] bg-[#f5faef] px-3 py-2 text-xs font-bold text-[#3f6535] transition hover:bg-[#eaf3e3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]/60">
            Add to cart
          </button>
        ) : (
          <div
            aria-label={`${item.name}, quantity ${quantity}`}
            className="mt-2 flex items-center justify-between rounded-lg bg-[#547d46] text-white"
            onClick={(e) => e.preventDefault()}>
            <button
              type="button"
              onClick={(e) => handleChange(e, -1)}
              id={`dec-related-${item.id}`}
              aria-label={`Remove one ${item.name}`}
              className="flex h-9 w-10 items-center justify-center rounded-l-lg text-lg font-bold transition hover:bg-[#3f6535] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white">
              −
            </button>
            <span
              aria-live="polite"
              className="min-w-8 text-center text-sm font-bold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={(e) => handleChange(e, 1)}
              id={`inc-related-${item.id}`}
              aria-label={`Add one ${item.name}`}
              className="flex h-9 w-10 items-center justify-center rounded-r-lg text-lg font-bold transition hover:bg-[#3f6535] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white">
              +
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
