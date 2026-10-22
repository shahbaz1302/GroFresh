"use client";

import {
  ArrowLeft,
  CheckCircle,
  ImagePlus,
  Loader2,
  PackagePlus,
  Tag,
  Wheat,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import axios from "axios";
import {
  CATEGORY_SUBCATEGORIES,
  GROCERY_CATEGORIES,
  GroceryCategory,
  isGroceryCategory,
} from "@/lib/grocery-categories";

type Status = "idle" | "loading" | "success" | "error";

const AddGrocery = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState<GroceryCategory | "">("");
  const [subCategory, setSubCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setErrorMessage("Please select a product image.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("unit", unit);
      formData.append("image", imageFile);

      await axios.post("/api/admin/add-grocery", formData);

      setStatus("success");
      setTimeout(() => {
        setName("");
        setPrice("");
        setUnit("");
        setCategory("");
        setSubCategory("");
        clearImage();
        setStatus("idle");
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  const isLoading = status === "loading";

  return (
    <main className="min-h-screen bg-[#f4f8f0] px-4 py-10 font-sans text-[#183b2b] sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-2xl">
        <Link
          href="/"
          className="absolute top-4 -left-90 inline-flex items-center gap-2 rounded-full border border-[#dce8d4] bg-white px-4 py-2.5 text-sm font-semibold text-[#547d46] shadow-sm transition hover:border-[#b6cda8] hover:bg-[#f8fbf5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]/60">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* ── Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-[#e5ecdf] bg-white p-6 shadow-[0_16px_48px_-20px_rgba(24,59,43,0.18)] sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Image upload ── */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#284936]">
                Product image <span className="text-[#9c4b3c]">*</span>
              </label>

              {imagePreview ? (
                <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-[#e5ecdf] bg-[#f6f9f3]">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-contain p-2"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#9c4b3c] shadow-sm backdrop-blur-sm transition hover:bg-[#fff4f1]"
                    aria-label="Remove image">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-52 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#c5d9b8] bg-[#f6f9f3] text-[#7b8f7a] transition hover:border-[#76a85b] hover:bg-[#eef5e8] hover:text-[#547d46]">
                  <ImagePlus className="h-9 w-9 opacity-70" />
                  <span className="text-sm font-medium">
                    Click to upload image
                  </span>
                  <span className="text-xs opacity-60">
                    PNG, JPG, WEBP up to 10 MB
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* ── Name ── */}
            <div>
              <label
                htmlFor="grocery-name"
                className="mb-1.5 block text-sm font-semibold text-[#284936]">
                Product name <span className="text-[#9c4b3c]">*</span>
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-2.5 transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60">
                <Tag className="h-4 w-4 shrink-0 text-[#82967b]" />
                <input
                  id="grocery-name"
                  type="text"
                  required
                  placeholder="e.g. Organic Full-Fat Milk"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[#183b2b] outline-none placeholder:text-[#98a398]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {/* ── Category ── */}
              <div className="w-[50%]">
                <label
                  htmlFor="grocery-category"
                  className="mb-1.5 block text-sm font-semibold text-[#284936]">
                  Category <span className="text-[#9c4b3c]">*</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-2.5 transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60">
                  <Wheat className="h-4 w-4 shrink-0 text-[#82967b]" />
                  <select
                    id="grocery-category"
                    required
                    value={category}
                    onChange={(e) => {
                      const selectedCategory = e.target.value;
                      setCategory(
                        isGroceryCategory(selectedCategory)
                          ? selectedCategory
                          : "",
                      );
                      setSubCategory("");
                    }}
                    className="flex-1 bg-transparent text-sm text-[#183b2b] outline-none">
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
              </div>

              {/* ── Subcategory ── */}
              <div className="w-[50%]">
                <label
                  htmlFor="grocery-subcategory"
                  className="mb-1.5 block text-sm font-semibold text-[#284936]">
                  Subcategory <span className="text-[#9c4b3c">*</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-2.5 transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60">
                  <select
                    id="grocery-subcategory"
                    required
                    disabled={!category}
                    value={subCategory}
                    onChange={(event) =>
                      setSubCategory(event.currentTarget.value)
                    }
                    className="flex-1 bg-transparent text-sm text-[#183b2b] outline-none disabled:cursor-not-allowed disabled:text-[#98a398]">
                    <option value="" disabled>
                      {category
                        ? "Select a subcategory"
                        : "Select a category first"}
                    </option>
                    {category &&
                      CATEGORY_SUBCATEGORIES[category].map((subcategory) => (
                        <option
                          key={subcategory.value}
                          value={subcategory.value}>
                          {subcategory.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Price & Unit (side by side) ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="grocery-price"
                  className="mb-1.5 block text-sm font-semibold text-[#284936]">
                  Price (₹) <span className="text-[#9c4b3c]">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-2.5 transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60">
                  <span className="shrink-0 text-sm font-semibold text-[#82967b]">
                    ₹
                  </span>
                  <input
                    id="grocery-price"
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-[#183b2b] outline-none placeholder:text-[#98a398]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="grocery-unit"
                  className="mb-1.5 block text-sm font-semibold text-[#284936]">
                  Unit <span className="text-[#9c4b3c]">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-2.5 transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60">
                  <input
                    id="grocery-unit"
                    type="text"
                    required
                    placeholder="e.g. 500 ml, 1 kg"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-[#183b2b] outline-none placeholder:text-[#98a398]"
                  />
                </div>
              </div>
            </div>

            {/* ── Error banner ── */}
            {status === "error" && (
              <div className="flex items-start gap-2.5 rounded-xl bg-[#fff4f1] px-4 py-3 text-sm text-[#9c4b3c]">
                <X className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage || "Failed to add grocery."}</span>
              </div>
            )}

            {/* ── Success banner ── */}
            {status === "success" && (
              <div className="flex items-center gap-2.5 rounded-xl bg-[#eef7e6] px-4 py-3 text-sm font-medium text-[#3d7a32]">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Grocery added successfully!</span>
              </div>
            )}

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={isLoading || status === "success"}
              className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#547d46] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_-6px_rgba(84,125,70,0.6)] transition hover:bg-[#3f6535] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding grocery…
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Added!
                </>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4" />
                  Add Grocery
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  );
};

export default AddGrocery;
