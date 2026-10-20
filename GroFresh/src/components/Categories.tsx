"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

const categories = [
  {
    name: "Fruits & vegetables",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Dairy, bread & eggs",
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Snacks & munchies",
    image:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Cold drinks",
    image:
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Rice, atta & dals",
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Masala & cooking",
    image:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Breakfast & sauces",
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Instant food",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Beauty & personal care",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Home & cleaning",
    image:
      "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Baby care",
    image:
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Pet supplies",
    image:
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=500&q=80",
  },
];

const Categories = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      aria-labelledby="categories-heading"
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a9a67]">
            Find your favorites
          </p>
          <h2
            id="categories-heading"
            className="mt-1 text-2xl font-black tracking-[-0.06em] text-[#183b2b] sm:text-3xl">
            Shop by category
          </h2>
        </div>
        <p className="hidden pb-1 text-sm text-[#748176] sm:block">
          All your everyday essentials in one place
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/shop?category=${encodeURIComponent(category.name)}`}
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a9c68f] sm:rounded-3xl">
            <article className="group relative flex min-h-36 flex-col items-center justify-end overflow-hidden rounded-2xl border border-[#edf1e9] bg-[#f3f7ed] p-3 text-center shadow-[0_12px_30px_-24px_rgba(24,59,43,0.38)] transition duration-200 hover:-translate-y-1 hover:border-[#d6e5cc] hover:shadow-[0_18px_35px_-22px_rgba(24,59,43,0.3)] sm:min-h-40 sm:rounded-3xl sm:p-4">
              <Image
                src={category.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-linear-to-t from-[#10291f]/80 via-[#10291f]/10 to-transparent"
              />
              <h3 className="relative z-10 max-w-36 text-xs font-bold leading-5 text-white drop-shadow sm:text-sm">
                {category.name}
              </h3>
            </article>
          </Link>
        ))}
      </div>
    </motion.section>
  );
};

export default Categories;
