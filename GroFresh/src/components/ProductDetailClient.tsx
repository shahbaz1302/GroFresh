"use client";

import {
  CATEGORY_SUBCATEGORIES,
  getSubcategoryLabel,
  GroceryCategory,
} from "@/lib/grocery-categories";
import {
  setCartData,
  updateQuantity as updateCartQuantity,
} from "@/redux/cartSlice";
import { AppDispatch, RootState } from "@/redux/store";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  HelpCircle,
  Home,
  Info,
  Leaf,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

export type GroceryItem = {
  id: string;
  name: string;
  category: string;
  subCategory?: string | null;
  image: string;
  price: number;
  unit: string;
};

type Props = {
  item: GroceryItem;
  relatedItems: GroceryItem[];
};

const DELIVERY_PROMISES = [
  { icon: Zap, label: "10-Min Delivery", color: "#0a8f4c" },
  { icon: ShieldCheck, label: "100% Quality", color: "#16a34a" },
  { icon: RotateCcw, label: "Doorstep Return", color: "#3f6535" },
  { icon: Truck, label: "Free Over ₹100", color: "#2563eb" },
];

const HIGHLIGHTS = [
  {
    icon: Leaf,
    title: "100% Farm Fresh",
    desc: "Sourced daily from verified growers",
  },
  {
    icon: BadgeCheck,
    title: "Quality Tested",
    desc: "3-tier inspection before dispatch",
  },
  {
    icon: Package,
    title: "Eco-Safe Packing",
    desc: "Hygienic, temperature-controlled",
  },
  {
    icon: Clock,
    title: "Superfast Arrival",
    desc: "Packed & delivered in 10 mins",
  },
];

export default function ProductDetailClient({ item, relatedItems }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { cartData } = useSelector((state: RootState) => state.cart);

  const [activeTab, setActiveTab] = useState<"specs" | "storage" | "promise">(
    "specs",
  );
  const [isWishlisted, setIsWishlisted] = useState(false);

  const cartQuantity = cartData.find((c) => c._id === item.id)?.quantity ?? 0;
  const totalCartQty = cartData.reduce((t, c) => t + c.quantity, 0);

  const subCatLabel = getSubcategoryLabel(item.category, item.subCategory);
  const mrp = Math.round(item.price * 1.15);
  const savings = Math.max(0, mrp - item.price);

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
    toast.success(`Added ${item.name} to cart!`, {
      icon: "🛒",
      style: {
        borderRadius: "1rem",
        background: "#183b2b",
        color: "#fff",
        fontSize: "13px",
      },
    });
  };

  const handleInc = () => {
    dispatch(updateCartQuantity({ groceryId: item.id, change: 1 }));
  };

  const handleDec = () => {
    dispatch(updateCartQuantity({ groceryId: item.id, change: -1 }));
  };

  const handleOpenCart = () => {
    window.dispatchEvent(new Event("grofresh-open-cart"));
  };

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied to clipboard!", {
          icon: "🔗",
          style: {
            borderRadius: "1rem",
            background: "#183b2b",
            color: "#fff",
            fontSize: "13px",
          },
        });
      }
    } catch {
      toast("Share link: " + window.location.href);
    }
  };

  const toggleWishlist = () => {
    setIsWishlisted((prev) => !prev);
    toast(
      !isWishlisted
        ? "Saved to your favorites!"
        : "Removed from your favorites",
      {
        icon: !isWishlisted ? "❤️" : "🤍",
        style: {
          borderRadius: "1rem",
          background: "#183b2b",
          color: "#fff",
          fontSize: "13px",
        },
      },
    );
  };

  return (
    <main className="min-h-screen bg-[#f4f8f0] pb-24 font-sans text-[#183b2b]">
      {/* ── Top Micro-Banner ── */}
      <div className="border-b border-[#e5ecdf] bg-linear-to-r from-[#eaf5dc] via-[#f4f9ed] to-[#eaf5dc] px-4 py-2 text-center text-xs font-semibold text-[#284936]">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0a8f4c] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0a8f4c]"></span>
          </span>
          <span>
            Instant 10-Minute Delivery is active in your area · 100% Quality
            Guaranteed
          </span>
        </div>
      </div>

      {/* ── Breadcrumb & Action Header ── */}
      <div className="border-b border-[#e5ecdf] bg-white/90 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-[#64776a]">
            <Link
              href="/"
              id="breadcrumb-home"
              className="inline-flex items-center gap-1 font-medium transition hover:text-[#0a8f4c]">
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#a8b8a5]" />
            <Link
              href={`/shop?category=${encodeURIComponent(item.category)}`}
              id="breadcrumb-category"
              className="font-medium truncate max-w-36 transition hover:text-[#0a8f4c]">
              {item.category}
            </Link>
            {item.subCategory && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-[#a8b8a5]" />
                <span className="font-medium text-[#718575] truncate max-w-36">
                  {subCatLabel}
                </span>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-[#a8b8a5]" />
            <span className="font-bold text-[#183b2b] truncate max-w-48 sm:max-w-xs">
              {item.name}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cbe3bb] bg-[#edf8e5] px-2.5 py-1 text-[11px] font-bold text-[#2e6822]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0a8f4c] animate-pulse" />
              In Stock & Fresh
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back navigation button */}
        <div className="pt-5">
          <button
            id="back-btn"
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-[#dce8d4] bg-white px-4 py-2 text-xs font-bold text-[#3f6535] shadow-xs transition hover:border-[#b6cda8] hover:bg-[#f6fbf2] active:scale-95">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to browse
          </button>
        </div>

        {/* ── Main Product Showcase ── */}
        <section
          aria-label="Product Details"
          className="mt-5 grid gap-8 lg:grid-cols-[1.05fr_1.15fr] lg:gap-12">
          {/* ── Left Column: Media & Trust Showcase ── */}
          <div className="flex flex-col gap-4">
            {/* Primary Image Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#e5ecdf] bg-white shadow-xs transition duration-300 hover:shadow-md">
              {/* Floating badges & tools */}
              <div className="absolute left-4 top-4 z-10 flex flex-col items-start gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#0a8f4c] px-3 py-1 text-xs font-black text-white shadow-md shadow-[#0a8f4c]/20">
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  10 MINS
                </span>
                {item.subCategory && (
                  <span className="rounded-full border border-[#dce8d4] bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#3f6535] shadow-xs backdrop-blur-xs">
                    {subCatLabel}
                  </span>
                )}
              </div>

              {/* Top right actions (Share & Wishlist) */}
              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleWishlist}
                  aria-label={
                    isWishlisted ? "Remove from favorites" : "Add to favorites"
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5ecdf] bg-white/95 text-[#64776a] shadow-xs backdrop-blur-xs transition hover:scale-105 hover:border-[#b6cda8] hover:text-[#b91c1c] active:scale-90">
                  <Heart
                    className={`h-4 w-4 transition ${
                      isWishlisted
                        ? "fill-[#dc2626] text-[#dc2626]"
                        : "text-[#64776a]"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share product"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5ecdf] bg-white/95 text-[#64776a] shadow-xs backdrop-blur-xs transition hover:scale-105 hover:border-[#b6cda8] hover:text-[#0a8f4c] active:scale-90">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {/* Product Hero Image */}
              <div className="relative flex aspect-square w-full items-center justify-center p-8 sm:p-12 bg-radial from-[#eef7ea]/70 via-[#fafcf8] to-white">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 92vw, 48vw"
                  className="object-contain p-8 sm:p-12 drop-shadow-xl transition duration-500 group-hover:scale-105"
                />
              </div>

              {/* Delivery Assurance Strip */}
              <div className="grid grid-cols-4 divide-x divide-[#e8eee3] border-t border-[#e8eee3] bg-[#f9fbf7]">
                {DELIVERY_PROMISES.map(({ icon: Icon, label, color }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center justify-center gap-1.5 px-2 py-3.5 text-center transition hover:bg-white">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}15` }}>
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    <span className="text-[10px] font-bold text-[#4d6353] leading-tight">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Promise Callout Card */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-[#dce8d4] bg-linear-to-r from-[#f1f8ed] to-[#fbfdfa] p-4 text-xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0a8f4c] text-white shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-[#183b2b]">
                  GroFresh Freshness Guarantee
                </h3>
                <p className="mt-0.5 text-[#64776a] leading-relaxed">
                  Handpicked daily from trusted local farms. If you're not 100%
                  satisfied with quality or freshness, get an instant doorstep
                  refund.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right Column: Product Info & Commerce Hub ── */}
          <div className="flex flex-col">
            {/* Category Tag & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/shop?category=${encodeURIComponent(item.category)}`}
                id="product-category-link"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe1c6] bg-[#eef7ea] px-3 py-1 text-xs font-bold text-[#3f6535] transition hover:bg-[#e2f1da] hover:text-[#284936]">
                <Tag className="h-3 w-3" />
                <span>{item.category}</span>
              </Link>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-1 text-[11px] font-bold text-[#92400e]">
                <Sparkles className="h-3 w-3" />
                Best Seller
              </span>
            </div>

            {/* Product Title */}
            <h1 className="mt-3 text-2xl font-black tracking-tight text-[#183b2b] sm:text-3xl lg:text-4xl leading-tight">
              {item.name}
            </h1>

            {/* Sub-label & Size */}
            <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-[#718575]">
              <span>{subCatLabel}</span>
              <span>·</span>
              <span className="text-[#3f6535]">Net Qty: 1 {item.unit}</span>
            </div>

            {/* Social Proof & Ratings */}
            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-lg bg-[#fef3c7] px-2.5 py-1 text-xs font-black text-[#92400e]">
                <Star className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                <span>4.8</span>
              </div>
              <span className="text-xs font-semibold text-[#64776a]">
                340+ customer ratings
              </span>
              <span className="text-xs text-[#a0b09d]">·</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a8f4c]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified Purchase
              </span>
            </div>

            {/* Price Showcase Card */}
            <div className="mt-5 rounded-2xl border border-[#e5ecdf] bg-white p-4.5 shadow-xs">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-black text-[#0a8f4c] sm:text-4xl tracking-tight">
                  ₹
                  {item.price.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm font-semibold text-[#718575]">
                  / {item.unit}
                </span>
                {savings > 0 && (
                  <>
                    <span className="text-sm font-semibold text-[#9ca3af] line-through">
                      ₹
                      {mrp.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-xs font-black text-[#b91c1c]">
                      Save ₹{savings} (15% OFF)
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-[11px] font-medium text-[#82967b]">
                Inclusive of all taxes · Lowest price in the neighborhood
              </p>
            </div>

            {/* 10-Minute Express Delivery Banner */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#c4e3b7] bg-linear-to-r from-[#f0faed] via-[#f7fbf5] to-[#f0faed] p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0a8f4c] text-white shadow-xs">
                  <Zap className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#183b2b]">
                    Delivering in{" "}
                    <span className="text-[#0a8f4c]">10 Minutes</span>
                  </p>
                  <p className="text-[11px] font-medium text-[#64776a]">
                    Order now & an assigned rider is dispatched right away
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <span className="inline-block rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#3f6535] shadow-xs">
                  ⚡ Express
                </span>
              </div>
            </div>

            {/* Add to Cart / Quantity Selector */}
            <div className="mt-6">
              {cartQuantity === 0 ? (
                <button
                  id="add-to-cart-btn"
                  type="button"
                  onClick={handleAdd}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#0a8f4c] px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-[#0a8f4c]/25 transition duration-200 hover:bg-[#078042] hover:shadow-xl hover:shadow-[#0a8f4c]/35 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0a8f4c]/40 cursor-pointer">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Cart</span>
                  <span className="rounded-lg bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                    ₹{item.price.toFixed(2)}
                  </span>
                </button>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between rounded-2xl bg-[#0a8f4c] p-1.5 shadow-lg shadow-[#0a8f4c]/25">
                    <button
                      id="decrease-qty-btn"
                      type="button"
                      onClick={handleDec}
                      aria-label="Decrease quantity"
                      className="flex h-11 w-12 items-center justify-center rounded-xl text-white transition hover:bg-black/15 active:scale-90 focus-visible:outline-none">
                      <Minus className="h-5 w-5" />
                    </button>
                    <div className="flex flex-col items-center">
                      <span
                        aria-live="polite"
                        className="text-lg font-black text-white">
                        {cartQuantity} in cart
                      </span>
                      <span className="text-[10px] font-bold text-white/80">
                        ₹{(item.price * cartQuantity).toFixed(2)}
                      </span>
                    </div>
                    <button
                      id="increase-qty-btn"
                      type="button"
                      onClick={handleInc}
                      aria-label="Increase quantity"
                      className="flex h-11 w-12 items-center justify-center rounded-xl text-white transition hover:bg-black/15 active:scale-90 focus-visible:outline-none">
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* View Cart Button (Drawer trigger) */}
              {totalCartQty > 0 && (
                <button
                  id="view-cart-btn"
                  type="button"
                  onClick={handleOpenCart}
                  className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-[#0a8f4c] bg-white px-6 py-3.5 text-sm font-extrabold text-[#0a8f4c] transition hover:bg-[#f0faf4] active:scale-[0.99] cursor-pointer">
                  <ShoppingBag className="h-4 w-4" />
                  <span>
                    View Cart ({totalCartQty}{" "}
                    {totalCartQty === 1 ? "item" : "items"})
                  </span>
                </button>
              )}
            </div>

            {/* Highlights Grid */}
            <div className="mt-7 grid grid-cols-2 gap-3">
              {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-2xl border border-[#e5ecdf] bg-white p-3.5 transition hover:border-[#b6cda8]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef7ea] text-[#3f6535]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#183b2b]">{title}</h4>
                    <p className="text-[10px] text-[#718575] leading-snug">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Product Specifications & Information Tabs ── */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-[#e5ecdf] bg-white shadow-xs">
              {/* Tab headers */}
              <div className="flex border-b border-[#eef4e8] bg-[#f9fbf7]">
                <button
                  type="button"
                  onClick={() => setActiveTab("specs")}
                  className={`flex-1 border-b-2 py-3 text-xs font-bold transition ${
                    activeTab === "specs"
                      ? "border-[#0a8f4c] bg-white text-[#0a8f4c]"
                      : "border-transparent text-[#718575] hover:text-[#183b2b]"
                  }`}>
                  Specifications
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("storage")}
                  className={`flex-1 border-b-2 py-3 text-xs font-bold transition ${
                    activeTab === "storage"
                      ? "border-[#0a8f4c] bg-white text-[#0a8f4c]"
                      : "border-transparent text-[#718575] hover:text-[#183b2b]"
                  }`}>
                  Storage & Tips
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("promise")}
                  className={`flex-1 border-b-2 py-3 text-xs font-bold transition ${
                    activeTab === "promise"
                      ? "border-[#0a8f4c] bg-white text-[#0a8f4c]"
                      : "border-transparent text-[#718575] hover:text-[#183b2b]"
                  }`}>
                  Our Promise
                </button>
              </div>

              {/* Tab contents */}
              <div className="p-4 sm:p-5">
                {activeTab === "specs" && (
                  <dl className="divide-y divide-[#f1f6ed] text-xs">
                    {[
                      { label: "Category", value: item.category },
                      { label: "Subcategory", value: subCatLabel },
                      { label: "Net Quantity / Unit", value: item.unit },
                      {
                        label: "Price per Unit",
                        value: `₹${item.price.toFixed(2)}`,
                      },
                      { label: "Country of Origin", value: "India" },
                      { label: "Packaging Type", value: "Eco-Friendly Safe Pouch" },
                      { label: "FSSAI License", value: "Certified & Verified" },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between py-2.5">
                        <dt className="font-semibold text-[#718575]">{label}</dt>
                        <dd className="font-bold text-[#183b2b]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {activeTab === "storage" && (
                  <div className="space-y-3 text-xs text-[#526656] leading-relaxed">
                    <p className="flex items-start gap-2">
                      <span className="font-bold text-[#3f6535]">✓</span>
                      <span>
                        Store in a cool, clean, dry environment away from direct
                        sunlight to preserve optimal crispness and nutrients.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold text-[#3f6535]">✓</span>
                      <span>
                        Refrigerate perishable goods promptly upon arrival in
                        the vegetable crisper or dedicated dairy compartment.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold text-[#3f6535]">✓</span>
                      <span>
                        Wash thoroughly with fresh water before cooking or
                        consuming fresh produce.
                      </span>
                    </p>
                  </div>
                )}

                {activeTab === "promise" && (
                  <div className="space-y-2.5 text-xs text-[#526656]">
                    <div className="flex items-center gap-2 font-bold text-[#183b2b]">
                      <BadgeCheck className="h-4 w-4 text-[#0a8f4c]" />
                      <span>Zero-Compromise Freshness</span>
                    </div>
                    <p className="leading-relaxed">
                      Every item is checked by quality specialists before being
                      packed into insulated bags. If you notice any defect,
                      simply return it to the delivery partner at your doorstep
                      for an instantaneous full refund.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Related Products Section ── */}
        {relatedItems.length > 0 && (
          <section className="mt-16" aria-label="Related products">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#e5ecdf] pb-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0a8f4c]">
                  SIMILAR PICKS FOR YOU
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#183b2b] sm:text-3xl">
                  {item.subCategory ? (
                    <>
                      More in{" "}
                      <span className="text-[#0a8f4c]">
                        {getSubcategoryLabel(item.category, item.subCategory)}
                      </span>
                    </>
                  ) : (
                    <>
                      More from{" "}
                      <span className="text-[#0a8f4c]">{item.category}</span>
                    </>
                  )}
                </h2>
              </div>
              <Link
                href={`/shop?category=${encodeURIComponent(item.category)}`}
                id="see-all-category-link"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dce8d4] bg-white px-4 py-2 text-xs font-bold text-[#3f6535] shadow-xs transition hover:border-[#b6cda8] hover:bg-[#f6fbf2] active:scale-95">
                <span>View all in {item.category}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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

      {/* ── Mobile Sticky Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e5ecdf] bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(24,59,43,0.08)] backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#f6f9f3]">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[#183b2b]">
                {item.name}
              </p>
              <p className="text-xs font-black text-[#0a8f4c]">
                ₹{item.price.toFixed(2)}{" "}
                <span className="text-[10px] font-normal text-[#718575]">
                  / {item.unit}
                </span>
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {cartQuantity === 0 ? (
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-xl bg-[#0a8f4c] px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-[#0a8f4c]/20 active:scale-95">
                Add to Cart
              </button>
            ) : (
              <div className="flex items-center rounded-xl bg-[#0a8f4c] text-white">
                <button
                  type="button"
                  onClick={handleDec}
                  aria-label="Decrease quantity"
                  className="flex h-8 w-8 items-center justify-center font-bold">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 text-xs font-black">{cartQuantity}</span>
                <button
                  type="button"
                  onClick={handleInc}
                  aria-label="Increase quantity"
                  className="flex h-8 w-8 items-center justify-center font-bold">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
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
  const mrp = Math.round(item.price * 1.15);

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
    toast.success(`Added ${item.name}`, {
      icon: "🛒",
      style: {
        borderRadius: "1rem",
        background: "#183b2b",
        color: "#fff",
        fontSize: "12px",
      },
    });
  };

  const handleChange = (e: React.MouseEvent, change: number) => {
    e.preventDefault();
    dispatch(updateCartQuantity({ groceryId: item.id, change }));
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e9eee5] bg-white transition duration-200 hover:-translate-y-1 hover:border-[#b6cda8] hover:shadow-[0_16px_36px_-18px_rgba(24,59,43,0.22)]">
      {/* Clickable Image + Info */}
      <Link
        href={`/product/${item.id}`}
        id={`related-product-${item.id}`}
        className="flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8cb870]">
        {/* Image Container with Badges */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#f6f9f3]">
          {/* Top 10-Min Badge */}
          <div className="absolute left-2.5 top-2.5 z-10">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#0a8f4c] px-2 py-0.5 text-[9px] font-black text-white shadow-xs">
              <Zap className="h-2.5 w-2.5 fill-current" />
              10m
            </span>
          </div>

          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 24vw, 16vw"
            className="object-contain p-3 transition duration-300 group-hover:scale-105"
          />
        </div>

        {/* Info */}
        <div className="px-3 pt-3 sm:px-3.5 sm:pt-3.5">
          <p className="mb-1 inline-flex max-w-full rounded-full bg-[#eef7ea] px-2 py-0.5 text-[9px] font-bold text-[#3f6535]">
            <span className="truncate">{subCatLabel}</span>
          </p>
          <h3 className="truncate text-xs font-bold text-[#183b2b] sm:text-sm">
            {item.name}
          </h3>
          <p className="mt-0.5 text-[10px] font-semibold text-[#82967b]">
            1 {item.unit}
          </p>

          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="text-sm font-black text-[#0a8f4c] sm:text-base">
              ₹
              {item.price.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-[10px] font-semibold text-[#9ca3af] line-through">
              ₹{mrp}
            </span>
          </div>
        </div>
      </Link>

      {/* Cart controls */}
      <div className="mt-auto px-3 pb-3 sm:px-3.5 sm:pb-3.5 pt-2">
        {quantity === 0 ? (
          <button
            type="button"
            onClick={handleAdd}
            id={`add-related-${item.id}`}
            className="w-full rounded-xl border border-[#76a85b] bg-[#f5faef] py-2 text-xs font-black text-[#3f6535] transition hover:bg-[#0a8f4c] hover:border-[#0a8f4c] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cb870] active:scale-95 cursor-pointer">
            Add to cart
          </button>
        ) : (
          <div
            aria-label={`${item.name}, quantity ${quantity}`}
            className="flex items-center justify-between rounded-xl bg-[#0a8f4c] text-white">
            <button
              type="button"
              onClick={(e) => handleChange(e, -1)}
              id={`dec-related-${item.id}`}
              aria-label={`Remove one ${item.name}`}
              className="flex h-8 w-9 items-center justify-center font-black transition hover:bg-black/15 active:scale-95">
              −
            </button>
            <span
              aria-live="polite"
              className="min-w-6 text-center text-xs font-black">
              {quantity}
            </span>
            <button
              type="button"
              onClick={(e) => handleChange(e, 1)}
              id={`inc-related-${item.id}`}
              aria-label={`Add one ${item.name}`}
              className="flex h-8 w-9 items-center justify-center font-black transition hover:bg-black/15 active:scale-95">
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
