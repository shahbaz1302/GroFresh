"use client";

import {
  ArrowLeft,
  Boxes,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Pencil,
  PlusCircle,
  Search,
  ShoppingBasket,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  CATEGORY_SUBCATEGORIES,
  GROCERY_CATEGORIES,
  GroceryCategory,
  getSubcategoryLabel,
  isGroceryCategory,
} from "@/lib/grocery-categories";

type Grocery = {
  _id: string;
  name: string;
  category: string;
  subCategory: string;
  image: string;
  price: number;
  unit: string;
};

type GroceryResponse = { groceries?: Grocery[]; message?: string };

const ITEMS_PER_PAGE = 12;

const ViewGrocery = () => {
  const [groceries, setGroceries] = useState<Grocery[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [editingGrocery, setEditingGrocery] = useState<Grocery | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editCategory, setEditCategory] = useState<GroceryCategory | "">("");
  const [editSubCategory, setEditSubCategory] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchGroceries = async () => {
      try {
        const response = await fetch("/api/admin/groceries");
        const data: GroceryResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message ?? "Unable to load groceries.");
        }

        setGroceries(data.groceries ?? []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load groceries.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchGroceries();
  }, []);

  const categories = useMemo(
    () => [
      "All categories",
      ...Array.from(new Set(groceries.map((grocery) => grocery.category))).sort(
        (a, b) => a.localeCompare(b),
      ),
    ],
    [groceries],
  );

  const filteredGroceries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return groceries.filter((grocery) => {
      const matchesSearch =
        !query ||
        grocery.name.toLocaleLowerCase().includes(query) ||
        grocery.category.toLocaleLowerCase().includes(query) ||
        getSubcategoryLabel(grocery.category, grocery.subCategory)
          .toLocaleLowerCase()
          .includes(query);
      const matchesCategory =
        category === "All categories" || grocery.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [category, groceries, search]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, category]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGroceries.length / ITEMS_PER_PAGE),
  );
  const paginatedGroceries = filteredGroceries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  // Show at most 5 page numbers around current page
  const visiblePages = pageNumbers.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
  );

  const handleOpenEdit = (grocery: Grocery) => {
    setEditingGrocery(grocery);
    setEditName(grocery.name);
    setEditPrice(grocery.price.toString());
    setEditUnit(grocery.unit);
    setEditCategory(
      isGroceryCategory(grocery.category) ? grocery.category : "",
    );
    setEditSubCategory(grocery.subCategory);
    setEditImageFile(null);
    setEditImagePreview(grocery.image);
    setShowDeleteConfirm(false);
  };

  const handleCloseEdit = () => {
    setEditingGrocery(null);
    setEditImageFile(null);
    setEditImagePreview(null);
    setShowDeleteConfirm(false);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrocery) return;

    if (!editName.trim()) {
      toast.error("Please enter a product name.");
      return;
    }

    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    if (!editCategory) {
      toast.error("Please select a category.");
      return;
    }

    if (!editSubCategory) {
      toast.error("Please select a subcategory.");
      return;
    }

    if (!editUnit.trim()) {
      toast.error("Please specify a unit (e.g. 1 kg, 500 g).");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving changes to grocery item...");

    try {
      const formData = new FormData();
      formData.append("id", editingGrocery._id);
      formData.append("name", editName.trim());
      formData.append("price", editPrice);
      formData.append("category", editCategory);
      formData.append("subCategory", editSubCategory);
      formData.append("unit", editUnit.trim());
      if (editImageFile) {
        formData.append("image", editImageFile);
      }

      const res = await fetch("/api/admin/groceries", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update item.");
      }

      // Update in local state
      setGroceries((prev) =>
        prev.map((item) =>
          item._id === editingGrocery._id
            ? {
                ...item,
                name: editName.trim(),
                price: parsedPrice,
                category: editCategory,
                subCategory: editSubCategory,
                unit: editUnit.trim(),
                image: data.grocery?.image || item.image,
              }
            : item,
        ),
      );

      toast.success("Grocery item updated successfully!", { id: toastId });
      handleCloseEdit();
    } catch (err: unknown) {
      console.error("Error updating grocery:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update grocery item.",
        { id: toastId },
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Delete item handler
  const handleDeleteGrocery = async () => {
    if (!editingGrocery) return;

    setIsDeleting(true);
    const toastId = toast.loading("Deleting grocery item...");

    try {
      const res = await fetch(`/api/admin/groceries?id=${editingGrocery._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete item.");
      }

      // Remove from state
      setGroceries((prev) =>
        prev.filter((item) => item._id !== editingGrocery._id),
      );

      toast.success("Grocery item deleted successfully!", { id: toastId });
      handleCloseEdit();
    } catch (err: unknown) {
      console.error("Error deleting grocery:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete grocery item.",
        { id: toastId },
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f8f0] px-4 py-8 font-sans text-[#183b2b] sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#dce8d4] bg-white px-4 py-2.5 text-sm font-semibold text-[#547d46] shadow-sm transition hover:border-[#b6cda8] hover:bg-[#f8fbf5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]/60">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <Link
            href="/add-grocery"
            className="inline-flex items-center gap-2 rounded-full bg-[#183b2b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#25523d] active:scale-95">
            <PlusCircle className="h-4 w-4 text-[#a8d591]" />
            Add New Grocery
          </Link>
        </div>

        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#eaf3e3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#547d46]">
              <Boxes className="h-3.5 w-3.5" />
              Admin Inventory & Catalog
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[#183b2b]">
              Grocery <span className="text-[#76a85b]">catalog</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#718575] sm:text-base">
              Browse, search, and click{" "}
              <span className="font-bold text-[#183b2b]">Edit</span> on any item
              to update prices, stock units, categories, or images.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-[#e5ecdf] bg-white px-4 py-3 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5e8] text-[#547d46]">
              <ShoppingBasket className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xl font-bold leading-5">
                {isLoading ? "—" : groceries.length}
              </span>
              <span className="mt-1 block text-xs font-medium text-[#82967b]">
                Products listed
              </span>
            </span>
          </div>
        </header>

        <section className="rounded-3xl border border-[#e5ecdf] bg-white p-4 shadow-[0_16px_48px_-20px_rgba(24,59,43,0.18)] sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-3 transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60">
              <Search className="h-4 w-4 shrink-0 text-[#82967b]" />
              <input
                type="search"
                aria-label="Search groceries"
                placeholder="Search by product or category…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#183b2b] outline-none placeholder:text-[#98a398]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="rounded-full p-1 text-[#82967b] transition hover:bg-[#eef5e8] hover:text-[#547d46]">
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-3 text-[#82967b] transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60 sm:w-64">
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
              <span className="sr-only">Filter by category</span>
              <select
                aria-label="Filter by category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#284936] outline-none">
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-2xl border border-[#f0d8d2] bg-[#fff4f1] px-5 py-8 text-center">
              <p className="font-semibold text-[#9c4b3c]">{errorMessage}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-semibold text-[#547d46] underline decoration-[#b6cda8] underline-offset-4 hover:text-[#3f6535]">
                Try again
              </button>
            </div>
          ) : isLoading ? (
            <div
              aria-live="polite"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-[#e9eee5]">
                  <div className="aspect-4/3 animate-pulse bg-[#f1f5ed]" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-[#f1f5ed]" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-[#f1f5ed]" />
                    <div className="h-5 w-1/3 animate-pulse rounded bg-[#f1f5ed]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredGroceries.length > 0 ? (
            <>
              <p className="mb-4 text-xs font-medium text-[#82967b]">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * ITEMS_PER_PAGE + 1,
                  filteredGroceries.length,
                )}
                –
                {Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredGroceries.length,
                )}{" "}
                of {filteredGroceries.length}{" "}
                {filteredGroceries.length === 1 ? "product" : "products"}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedGroceries.map((grocery) => (
                  <article
                    key={grocery._id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e9eee5] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#c5d9b8] hover:shadow-[0_12px_30px_-16px_rgba(24,59,43,0.28)]">
                    {/* Top Image Preview & Quick Edit Floating Pill */}
                    <div className="relative aspect-4/3 overflow-hidden bg-[#f6f9f3]">
                      <Image
                        src={grocery.image}
                        alt={grocery.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain p-5 transition duration-300 group-hover:scale-105"
                      />

                      {/* Floating Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(grocery)}
                        className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-[#dce8d4] bg-white/95 px-3 py-1.5 text-xs font-bold text-[#2d5624] shadow-sm backdrop-blur transition hover:scale-105 hover:bg-[#eaf5dc] active:scale-95">
                        <Pencil className="h-3.5 w-3.5 text-[#547d46]" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="p-4 flex flex-1 flex-col justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <p className="inline-flex max-w-full rounded-full bg-[#eef5e8] px-2.5 py-0.5 text-[11px] font-semibold text-[#547d46]">
                            <span className="truncate">{grocery.category}</span>
                          </p>
                        </div>
                        <p className="mb-1 truncate text-xs font-medium text-[#82967b]">
                          {getSubcategoryLabel(
                            grocery.category,
                            grocery.subCategory,
                          )}
                        </p>
                        <h2
                          className="line-clamp-2 text-base font-bold text-[#183b2b]"
                          title={grocery.name}>
                          {grocery.name}
                        </h2>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#f0f4ec] flex items-center justify-between gap-2">
                        <div>
                          <p className="text-lg font-extrabold text-[#3f6535]">
                            ₹
                            {grocery.price.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p className="truncate text-[11px] font-medium text-[#82967b]">
                            per {grocery.unit}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(grocery)}
                          className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[#dce8d4] bg-[#f8fbf5] px-3 py-1.5 text-xs font-bold text-[#3f6535] transition hover:bg-[#eaf5dc] hover:border-[#b6cda8] active:scale-95">
                          <Pencil className="h-3 w-3" />
                          <span>Modify</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Result info */}
                  <p className="text-xs font-medium text-[#82967b]">
                    Page {currentPage} of {totalPages}
                  </p>

                  {/* Page buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Prev */}
                    <button
                      type="button"
                      id="pagination-prev"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5ecdf] bg-white text-[#547d46] shadow-xs transition hover:border-[#b6cda8] hover:bg-[#f8fbf5] disabled:cursor-not-allowed disabled:opacity-40">
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {visiblePages.map((page, idx) => {
                      const prevPage = visiblePages[idx - 1];
                      const showEllipsisBefore =
                        prevPage !== undefined && page - prevPage > 1;
                      return (
                        <span key={page} className="flex items-center gap-1.5">
                          {showEllipsisBefore && (
                            <span className="flex h-9 w-6 items-center justify-center text-xs font-medium text-[#82967b]">
                              …
                            </span>
                          )}
                          <button
                            type="button"
                            id={`pagination-page-${page}`}
                            onClick={() => setCurrentPage(page)}
                            aria-current={
                              currentPage === page ? "page" : undefined
                            }
                            aria-label={`Go to page ${page}`}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition ${
                              currentPage === page
                                ? "bg-[#183b2b] text-white shadow-sm"
                                : "border border-[#e5ecdf] bg-white text-[#547d46] shadow-xs hover:border-[#b6cda8] hover:bg-[#f8fbf5]"
                            }`}>
                            {page}
                          </button>
                        </span>
                      );
                    })}

                    {/* Next */}
                    <button
                      type="button"
                      id="pagination-next"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      aria-label="Next page"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5ecdf] bg-white text-[#547d46] shadow-xs transition hover:border-[#b6cda8] hover:bg-[#f8fbf5] disabled:cursor-not-allowed disabled:opacity-40">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </nav>
              )}
            </>
          ) : groceries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#c5d9b8] bg-[#f9fbf7] px-5 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef5e8] text-[#547d46]">
                <ShoppingBasket className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-lg font-bold">No groceries yet</h2>
              <p className="mt-1 text-sm text-[#82967b]">
                Add your first product to see it in your catalog.
              </p>
              <Link
                href="/add-grocery"
                className="mt-5 inline-flex rounded-xl bg-[#547d46] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f6535]">
                Add a grocery
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#c5d9b8] bg-[#f9fbf7] px-5 py-14 text-center">
              <Search className="mx-auto h-7 w-7 text-[#82967b]" />
              <h2 className="mt-4 text-lg font-bold">No matching groceries</h2>
              <p className="mt-1 text-sm text-[#82967b]">
                Try another search term or category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All categories");
                }}
                className="mt-4 text-sm font-semibold text-[#547d46] underline decoration-[#b6cda8] underline-offset-4 hover:text-[#3f6535]">
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>

      {/* EDIT GROCERY MODAL */}
      <AnimatePresence>
        {editingGrocery && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-grocery-title"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-2xl rounded-3xl border border-[#e5ecdf] bg-white p-6 shadow-2xl sm:p-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#f0f4ec] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf5dc] text-[#3f6535]">
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h2
                      id="edit-grocery-title"
                      className="text-xl font-extrabold text-[#183b2b]">
                      Edit Grocery Item
                    </h2>
                    <p className="text-xs text-[#718575]">
                      Modify product details, category, pricing, or product
                      image.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close edit modal"
                  onClick={handleCloseEdit}
                  disabled={isSaving || isDeleting}
                  className="rounded-full p-2 text-[#718575] transition hover:bg-[#f4f7f1] hover:text-[#183b2b] disabled:opacity-50">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveEdit} className="mt-6 space-y-5">
                {/* Product Name */}
                <div>
                  <label
                    htmlFor="edit-name"
                    className="block text-xs font-bold uppercase tracking-wider text-[#547d46]">
                    Product Name *
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Organic Cow Milk, Fresh Apples"
                    className="mt-1.5 w-full rounded-2xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-2.5 text-sm text-[#183b2b] transition focus:border-[#76a85b] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#dcebd0]/60"
                  />
                </div>

                {/* Price and Unit Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-price"
                      className="block text-xs font-bold uppercase tracking-wider text-[#547d46]">
                      Price in INR (₹) *
                    </label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-4 top-2.5 text-sm font-bold text-[#718575]">
                        ₹
                      </span>
                      <input
                        id="edit-price"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-2xl border border-[#e5ecdf] bg-[#f9fbf7] pl-8 pr-4 py-2.5 text-sm text-[#183b2b] transition focus:border-[#76a85b] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#dcebd0]/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-unit"
                      className="block text-xs font-bold uppercase tracking-wider text-[#547d46]">
                      Unit / Measurement *
                    </label>
                    <input
                      id="edit-unit"
                      type="text"
                      required
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      placeholder="e.g. 1 kg, 500 g, 1 litre, 6 pcs"
                      className="mt-1.5 w-full rounded-2xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-2.5 text-sm text-[#183b2b] transition focus:border-[#76a85b] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#dcebd0]/60"
                    />
                  </div>
                </div>

                {/* Category & Subcategory Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-category"
                      className="block text-xs font-bold uppercase tracking-wider text-[#547d46]">
                      Category *
                    </label>
                    <select
                      id="edit-category"
                      required
                      value={editCategory}
                      onChange={(e) => {
                        const newCat = e.target.value as GroceryCategory;
                        setEditCategory(newCat);
                        // Reset subcategory to first available option
                        if (newCat && CATEGORY_SUBCATEGORIES[newCat]?.[0]) {
                          setEditSubCategory(
                            CATEGORY_SUBCATEGORIES[newCat][0].value,
                          );
                        } else {
                          setEditSubCategory("");
                        }
                      }}
                      className="mt-1.5 w-full rounded-2xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-2.5 text-sm text-[#183b2b] transition focus:border-[#76a85b] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#dcebd0]/60">
                      <option value="" disabled>
                        Select a category
                      </option>
                      {GROCERY_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-subcategory"
                      className="block text-xs font-bold uppercase tracking-wider text-[#547d46]">
                      Subcategory *
                    </label>
                    <select
                      id="edit-subcategory"
                      required
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      disabled={!editCategory}
                      className="mt-1.5 w-full rounded-2xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-2.5 text-sm text-[#183b2b] transition focus:border-[#76a85b] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#dcebd0]/60 disabled:opacity-50">
                      <option value="" disabled>
                        Select subcategory
                      </option>
                      {editCategory &&
                        CATEGORY_SUBCATEGORIES[editCategory]?.map((sub) => (
                          <option key={sub.value} value={sub.value}>
                            {sub.label}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Product Image Section */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#547d46]">
                    Product Image
                  </label>
                  <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* Current / Preview Image Display */}
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#e5ecdf] bg-[#f9fbf7]">
                      {editImagePreview ? (
                        <Image
                          src={editImagePreview}
                          alt="Preview"
                          fill
                          sizes="96px"
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#718575]">
                          <ImagePlus className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Replace File Input */}
                    <div className="flex-1">
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        id="edit-image-file"
                        onChange={handleEditImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="edit-image-file"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#dce8d4] bg-[#f9fbf7] px-4 py-2 text-xs font-bold text-[#426e3f] transition hover:bg-[#eaf5dc] hover:border-[#b6cda8]">
                        <ImagePlus className="h-4 w-4" />
                        <span>
                          {editImageFile
                            ? "Change Chosen Image"
                            : "Upload New Image"}
                        </span>
                      </label>
                      <p className="mt-1.5 text-[11px] text-[#718575]">
                        {editImageFile
                          ? `New selected: ${editImageFile.name}`
                          : "Leave empty to keep current image."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delete Confirmation Area */}
                {showDeleteConfirm ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs font-bold text-rose-800">
                      Are you sure you want to delete &quot;
                      {editingGrocery.name}&quot;?
                    </p>
                    <p className="mt-1 text-[11px] text-rose-700">
                      This action will remove the product permanently from your
                      catalog.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={handleDeleteGrocery}
                        className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50">
                        {isDeleting && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        <span>Yes, Delete Item</span>
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f4ec] pt-5">
                  {!showDeleteConfirm && (
                    <button
                      type="button"
                      disabled={isSaving || isDeleting}
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Item</span>
                    </button>
                  )}

                  <div className="ml-auto flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isSaving || isDeleting}
                      onClick={handleCloseEdit}
                      className="rounded-2xl border border-[#dce8d4] bg-white px-5 py-2.5 text-xs font-bold text-[#5e7462] transition hover:bg-[#f8fbf5] disabled:opacity-50">
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving || isDeleting}
                      className="flex items-center gap-2 rounded-2xl bg-[#183b2b] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#285e23] disabled:opacity-50 active:scale-95">
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-[#a8d591]" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 text-[#a8d591]" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ViewGrocery;
