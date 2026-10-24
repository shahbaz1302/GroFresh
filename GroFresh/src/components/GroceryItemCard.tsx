"use client";

import {
  setCartData,
  updateQuantity as updateCartQuantity,
} from "@/redux/cartSlice";
import { AppDispatch, RootState } from "@/redux/store";
import {
  CATEGORY_SUBCATEGORIES,
  getSubcategoryLabel,
  GROCERY_CATEGORIES,
  GroceryCategory,
  normalizeGroceryCategory,
} from "@/lib/grocery-categories";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  RotateCcw,
  Search,
  ShoppingBag,
  ShoppingBasket,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type GroceryItemsProps = { category?: string; groceries: GroceryItem[] };

type SortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

const GroceryItems = ({ category, groceries }: GroceryItemsProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { cartData } = useSelector((state: RootState) => state.cart);

  const currentCategory =
    normalizeGroceryCategory(category) ||
    normalizeGroceryCategory(groceries[0]?.category) ||
    category ||
    groceries[0]?.category ||
    GROCERY_CATEGORIES[0];

  const categoryGroceries = useMemo(() => {
    return currentCategory
      ? groceries.filter(
          (g) =>
            g.category.trim().toLowerCase() ===
            currentCategory.trim().toLowerCase(),
        )
      : groceries;
  }, [groceries, currentCategory]);

  const availableSubcategories = useMemo(() => {
    const configuredSubcategories =
      CATEGORY_SUBCATEGORIES[currentCategory as GroceryCategory] ?? [];
    const storedSubcategories = categoryGroceries
      .filter(
        (grocery) =>
          grocery.category.trim().toLowerCase() ===
            currentCategory.trim().toLowerCase() &&
          grocery.subCategory?.trim(),
      )
      .flatMap((grocery) => (grocery.subCategory ? [grocery.subCategory] : []));
    const subcategoryValues = Array.from(
      new Set([
        ...configuredSubcategories.map((subcategory) => subcategory.value),
        ...storedSubcategories,
      ]),
    );

    const subcategories = subcategoryValues.map((subCategory) => ({
      value: subCategory,
      label: getSubcategoryLabel(currentCategory, subCategory),
      count: categoryGroceries.filter(
        (grocery) =>
          grocery.category.trim().toLowerCase() ===
            currentCategory.trim().toLowerCase() &&
          grocery.subCategory === subCategory,
      ).length,
    }));

    const uncategorizedCount = categoryGroceries.filter((grocery) => {
      return !grocery.subCategory?.trim();
    }).length;

    if (uncategorizedCount > 0) {
      subcategories.push({
        value: "__uncategorized",
        label: "Uncategorized",
        count: uncategorizedCount,
      });
    }

    return subcategories;
  }, [currentCategory, categoryGroceries]);

  const defaultSubCategory = availableSubcategories[0]?.value || "";

  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  const setActiveSubCategory = (subCat: string) => {
    setSelectedSubCategory(subCat);
  };

  const activeSubCategory =
    selectedSubCategory &&
    availableSubcategories.some((s) => s.value === selectedSubCategory)
      ? selectedSubCategory
      : defaultSubCategory;

  useEffect(() => {
    setSelectedSubCategory(null);
    setSearchQuery("");
    setSortBy("featured");
  }, [category]);

  const filteredGroceries = useMemo(() => {
    let result = categoryGroceries;

    if (activeSubCategory === "__uncategorized") {
      result = result.filter((grocery) => !grocery.subCategory?.trim());
    } else if (activeSubCategory) {
      result = result.filter(
        (grocery) =>
          grocery.category.trim().toLowerCase() ===
            currentCategory.trim().toLowerCase() &&
          grocery.subCategory === activeSubCategory,
      );
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((grocery) => {
        const nameMatch = grocery.name.toLowerCase().includes(query);
        const subCatMatch = grocery.subCategory?.toLowerCase().includes(query);
        const subCatLabelMatch = getSubcategoryLabel(
          grocery.category,
          grocery.subCategory,
        )
          .toLowerCase()
          .includes(query);
        return nameMatch || subCatMatch || subCatLabelMatch;
      });
    }

    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [
    activeSubCategory,
    categoryGroceries,
    currentCategory,
    searchQuery,
    sortBy,
  ]);

  const cartQuantity = cartData.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const handleOpenCart = () => {
    window.dispatchEvent(new Event("grofresh-open-cart"));
  };

  const handleResetFilters = () => {
    setSelectedSubCategory(null);
    setSearchQuery("");
    setSortBy("featured");
  };

  const isFiltering =
    (selectedSubCategory !== null &&
      selectedSubCategory !== defaultSubCategory) ||
    searchQuery.trim() !== "";

  return (
    <main className="min-h-screen bg-[#f4f8f0] px-3.5 py-5 font-sans text-[#183b2b] pb-24 sm:px-6 sm:py-8 md:pb-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top bar with back link & quick stats */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <Link
            href="/"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#dce8d4] bg-white px-3.5 py-2 text-xs font-semibold text-[#547d46] shadow-xs transition hover:border-[#b6cda8] hover:bg-[#f8fbf5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]/60 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm">
            <ArrowLeft
              aria-hidden="true"
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
            />
            <span>Back to categories</span>
          </Link>

          {cartQuantity > 0 && (
            <button
              type="button"
              onClick={handleOpenCart}
              aria-label={`View cart with ${cartQuantity} items`}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#b8d7a3] bg-[#eaf3e3] px-3.5 py-1.5 text-xs font-bold text-[#345c2a] transition hover:bg-[#dcecd2] sm:text-sm">
              <ShoppingBag className="h-3.5 w-3.5 text-[#477739]" />
              <span>
                {cartQuantity} {cartQuantity === 1 ? "item" : "items"} in cart
              </span>
            </button>
          )}
        </div>

        {/* Page Heading */}
        <header className="mb-5 sm:mb-6">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a9a67] sm:text-xs">
            Shop groceries
          </p>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              {currentCategory}
            </h1>
            <p className="text-xs font-medium text-[#718575] sm:text-sm">
              {filteredGroceries.length}{" "}
              {filteredGroceries.length === 1 ? "item" : "items"} available
              {categoryGroceries.length !== filteredGroceries.length && (
                <span className="text-[#8c9f90]">
                  {" "}
                  (of {categoryGroceries.length})
                </span>
              )}
            </p>
          </div>
        </header>

        {/* Categories horizontal scroller */}
        <nav aria-label="Grocery categories" className="mb-5 sm:mb-7">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7a9a67] sm:text-xs">
              Categories
            </p>
            <span className="text-[11px] font-medium text-[#8c9f90] sm:hidden">
              Swipe to explore →
            </span>
          </div>
          <div className="-mx-3.5 flex gap-2 overflow-x-auto px-3.5 pb-1.5 pt-0.5 scrollbar-none sm:mx-0 sm:px-0">
            {GROCERY_CATEGORIES.map((cat) => {
              const isActive = cat === currentCategory;
              return (
                <Link
                  key={cat}
                  href={`/shop?category=${encodeURIComponent(cat)}`}
                  className={`inline-flex shrink-0 items-center rounded-xl px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9c68f] sm:px-3.5 sm:py-2 sm:text-sm ${
                    isActive
                      ? "bg-[#3f6535] text-white shadow-xs ring-1 ring-[#3f6535]"
                      : "border border-[#e2eadd] bg-white text-[#5d7063] hover:border-[#b8ceab] hover:bg-[#f6f9f3] hover:text-[#183b2b]"
                  }`}>
                  {cat}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile Subcategories Pills */}
        {categoryGroceries.length > 0 && availableSubcategories.length > 0 && (
          <div className="mb-4 md:hidden">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7a9a67]">
                Subcategories
              </span>
              {isFiltering && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-[#547d46] underline hover:text-[#385c2d]">
                  Reset
                </button>
              )}
            </div>
            <div className="-mx-3.5 flex gap-1.5 overflow-x-auto px-3.5 pb-2 scrollbar-none sm:mx-0 sm:px-0">
              {availableSubcategories.map((subcategory) => {
                const isActive = activeSubCategory === subcategory.value;
                return (
                  <button
                    key={subcategory.value}
                    type="button"
                    onClick={() => setActiveSubCategory(subcategory.value)}
                    aria-pressed={isActive}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? "bg-[#284936] text-white shadow-xs font-semibold"
                        : "border border-[#e2eadd] bg-white text-[#5d7063] hover:bg-[#f6f9f3]"
                    }`}>
                    <span>{subcategory.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#eaf3e3] text-[#477739]"
                      }`}>
                      {subcategory.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {categoryGroceries.length > 0 ? (
          <div className="grid items-start gap-4 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-6">
            {/* Desktop / Tablet Sidebar */}
            <aside
              aria-label="Filter products"
              className="hidden rounded-2xl border border-[#e5ecdf] bg-white p-3 md:sticky md:top-24 md:block lg:top-26">
              <div className="px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a9a67] lg:text-[11px]">
                  {currentCategory}
                </span>
                <h2 className="text-sm font-extrabold text-[#183b2b]">
                  Subcategories
                </h2>
              </div>
              <nav
                aria-label="Product subcategories"
                className="flex max-h-[calc(100vh-10rem)] flex-col gap-1 overflow-y-auto pr-1 scrollbar-thin">
                {availableSubcategories.map((subcategory) => ({
                    name: subcategory.label,
                    value: subcategory.value,
                    count: subcategory.count,
                  })).map((group) => (
                  <button
                    key={group.value}
                    type="button"
                    aria-pressed={activeSubCategory === group.value}
                    onClick={() => setActiveSubCategory(group.value)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9c68f] lg:py-2.5 lg:text-sm ${
                      activeSubCategory === group.value
                        ? "bg-[#eaf3e3] font-semibold text-[#3f6535]"
                        : "text-[#64776a] hover:bg-[#f6f9f3] hover:text-[#284936]"
                    }`}>
                    <span className="truncate">{group.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        activeSubCategory === group.value
                          ? "bg-[#3f6535] text-white"
                          : "bg-[#f1f6ed] text-[#6d8474]"
                      }`}>
                      {group.count}
                    </span>
                  </button>
                ))}
              </nav>
            </aside>

            <div className="min-w-0">
              {/* In-Page Toolbar */}
              <div className="mb-4 flex flex-col gap-2.5 rounded-2xl border border-[#e8eee3] bg-white p-2.5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3">
                <div className="relative flex flex-1 items-center rounded-xl border border-[#e5ecdf] bg-[#fbfdfa] px-3 py-1.5 transition focus-within:border-[#8cb870] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#dcebd0]">
                  <Search
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-[#82967b]"
                  />
                  <input
                    type="search"
                    placeholder={`Search in ${currentCategory.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ml-2 w-full bg-transparent text-xs text-[#183b2b] placeholder:text-[#93a295] outline-none sm:text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="ml-1 text-[#718575] hover:text-[#183b2b]">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#667a6d]">
                    <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="rounded-xl border border-[#e5ecdf] bg-[#fbfdfa] px-2 py-1 text-xs font-semibold text-[#284936] focus:outline-none">
                      <option value="featured">Featured</option>
                      <option value="price-asc">Price: Low-High</option>
                      <option value="price-desc">Price: High-Low</option>
                      <option value="name-asc">Name: A-Z</option>
                    </select>
                  </div>
                  {isFiltering && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold text-[#8b4435] hover:bg-[#fff2ef]">
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Product Grid */}
              {filteredGroceries.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredGroceries.map((grocery) => {
                    const quantity =
                      cartData.find((item) => item._id === grocery.id)
                        ?.quantity ?? 0;
                    return (
                      <article
                        key={grocery.id}
                        className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#e9eee5] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#c5d9b8] hover:shadow-[0_12px_30px_-16px_rgba(24,59,43,0.28)] sm:rounded-2xl">
                        {/* Clickable image + info area */}
                        <Link
                          href={`/product/${grocery.id}`}
                          className="flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a9c68f]"
                          aria-label={`View details for ${grocery.name}`}>
                          <div className="relative aspect-square w-full overflow-hidden bg-[#f6f9f3]">
                            <Image
                              src={grocery.image}
                              alt={grocery.name}
                              fill
                              sizes="(max-width: 640px) 48vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                              className="object-contain p-2.5 transition duration-300 group-hover:scale-105 sm:p-4"
                            />
                          </div>
                          <div className="px-3 pt-3 sm:px-4 sm:pt-4">
                            <p className="mb-2 inline-flex max-w-full rounded-full bg-[#eef5e8] px-2.5 py-1 text-[10px] font-semibold text-[#547d46] sm:text-[11px]">
                              <span className="truncate">{grocery.category}</span>
                            </p>
                            <p className="mb-1 truncate text-xs font-medium text-[#82967b]">
                              {getSubcategoryLabel(
                                grocery.category,
                                grocery.subCategory,
                              )}
                            </p>
                            <h2 className="truncate text-sm font-bold text-[#183b2b] sm:text-base">
                              {grocery.name}
                            </h2>
                            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1">
                              <p className="text-base font-extrabold text-[#3f6535] sm:text-lg">
                                ₹
                                {grocery.price.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                              <p className="text-xs font-medium text-[#82967b]">
                                per {grocery.unit}
                              </p>
                            </div>
                          </div>
                        </Link>
                        {/* Cart controls – stop propagation so clicks don't navigate */}
                        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                          {quantity === 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(
                                  setCartData({
                                    _id: grocery.id,
                                    name: grocery.name,
                                    category: grocery.category,
                                    image: grocery.image,
                                    price: grocery.price,
                                    unit: grocery.unit,
                                    quantity: 1,
                                  }),
                                );
                              }}
                              aria-label={`Add ${grocery.name} to cart`}
                              className="mt-2 w-full rounded-lg border border-[#76a85b] bg-[#f5faef] px-3 py-2 text-sm font-bold text-[#3f6535] transition hover:bg-[#eaf3e3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]/60">
                              Add to cart
                            </button>
                          ) : (
                            <div
                              aria-label={`${grocery.name}, quantity ${quantity}`}
                              className="mt-2 flex items-center justify-between rounded-lg bg-[#547d46] text-white">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dispatch(
                                    updateCartQuantity({
                                      groceryId: grocery.id,
                                      change: -1,
                                    }),
                                  );
                                }}
                                aria-label={`Remove one ${grocery.name}`}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dispatch(
                                    updateCartQuantity({
                                      groceryId: grocery.id,
                                      change: 1,
                                    }),
                                  );
                                }}
                                aria-label={`Add one ${grocery.name}`}
                                className="flex h-9 w-10 items-center justify-center rounded-r-lg text-lg font-bold transition hover:bg-[#3f6535] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white">
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#c5d9b8] bg-white px-5 py-14 text-center">
                  <ShoppingBasket
                    aria-hidden="true"
                    className="mx-auto h-8 w-8 text-[#82967b]"
                  />
                  <h2 className="mt-4 text-lg font-bold">
                    No{" "}
                    {activeSubCategory
                      ? getSubcategoryLabel(
                          currentCategory,
                          activeSubCategory,
                        ).toLocaleLowerCase()
                      : "matching"}{" "}
                    items found
                  </h2>
                  <p className="mt-1 text-sm text-[#82967b]">
                    Choose another item type to browse available products.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#c5d9b8] bg-white px-5 py-14 text-center">
            <ShoppingBasket
              aria-hidden="true"
              className="mx-auto h-8 w-8 text-[#82967b]"
            />
            <h2 className="mt-4 text-lg font-bold">
              No items in this category yet
            </h2>
            <p className="mt-1 text-sm text-[#82967b]">
              Please check back soon for new products.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default GroceryItems;
