"use client";

import {
  Clock,
  Heart,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success("Thank you for subscribing to GroFresh deals!");
    setNewsletterEmail("");
  };

  return (
    <footer className="mt-16 border-t border-[#e5ecdf] bg-white font-sans text-[#183b2b]">
      {/* 4 Feature Value Props Bar */}
      <div className="border-b border-[#edf2e8] bg-[#f9fbf7]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#e8eee3] bg-white p-4 shadow-sm transition hover:border-[#b6cda8] hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf5dc] text-[#3f6535]">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#183b2b]">
                  10-Minute Delivery
                </h4>
                <p className="text-xs text-[#718575]">
                  Superfast doorstep grocery arrival
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#e8eee3] bg-white p-4 shadow-sm transition hover:border-[#b6cda8] hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf5dc] text-[#3f6535]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#183b2b]">
                  100% Farm Fresh
                </h4>
                <p className="text-xs text-[#718575]">
                  Organic fruits, veggies & dairy
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#e8eee3] bg-white p-4 shadow-sm transition hover:border-[#b6cda8] hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf5dc] text-[#3f6535]">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#183b2b]">
                  Free Delivery on ₹100+
                </h4>
                <p className="text-xs text-[#718575]">
                  No delivery fees on orders above ₹100
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#e8eee3] bg-white p-4 shadow-sm transition hover:border-[#b6cda8] hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf5dc] text-[#3f6535]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#183b2b]">
                  Safe & Secure Checkout
                </h4>
                <p className="text-xs text-[#718575]">
                  UPI, Cards, NetBanking & COD
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf5dc] text-[#183b2b]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6">
                  <path
                    d="M12 20.5c-4.4-2.8-6.6-6.2-6.6-10.2 0-2.7 1.6-4.5 4-4.5 1.4 0 2.2.8 2.6 2 .5-1.2 1.3-2 2.7-2 2.4 0 4 1.8 4 4.5 0 4-2.2 7.4-6.7 10.2Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 18.5c-.2-4.6.8-7.7 3.3-9.8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-2xl font-extrabold tracking-[-0.07em] text-[#183b2b]">
                Gro<span className="text-[#76a85b]">Fresh</span>
              </span>
            </Link>

            <p className="mt-3 max-w-sm text-xs leading-relaxed text-[#718575] sm:text-sm">
              GroFresh is India&apos;s lightning-fast grocery delivery service.
              Experience farm-fresh produce, dairy, bakery, snacks, and daily
              household essentials delivered to your door in 10 minutes.
            </p>

            <div className="mt-5 space-y-2 text-xs text-[#526557]">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#76a85b] shrink-0" />
                <span>Express Hubs active in Mumbai, Delhi, Bengaluru & more</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#76a85b] shrink-0" />
                <span>Helpline: +91 1800-GRO-FRESH (Toll Free)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#76a85b] shrink-0" />
                <span>support@grofresh.com</span>
              </p>
            </div>
          </div>

          {/* Quick Categories (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#183b2b]">
              Categories
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs font-semibold text-[#546e5a]">
              <li>
                <Link
                  href="/shop?category=Fruits%20%26%20vegetables"
                  className="transition hover:text-[#2d5624] hover:underline">
                  Fruits & Vegetables
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=Dairy%2C%20bread%20%26%20eggs"
                  className="transition hover:text-[#2d5624] hover:underline">
                  Dairy, Bread & Eggs
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=Snacks%20%26%20munchies"
                  className="transition hover:text-[#2d5624] hover:underline">
                  Snacks & Munchies
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=Cold%20drinks"
                  className="transition hover:text-[#2d5624] hover:underline">
                  Cold Drinks & Juices
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=Rice%2C%20atta%20%26%20dals"
                  className="transition hover:text-[#2d5624] hover:underline">
                  Rice, Atta & Dals
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=Instant%20food"
                  className="transition hover:text-[#2d5624] hover:underline">
                  Instant Food
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support & Links (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#183b2b]">
              Customer Service
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs font-semibold text-[#546e5a]">
              <li>
                <Link
                  href="/orders"
                  className="transition hover:text-[#2d5624] hover:underline">
                  My Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/checkout"
                  className="transition hover:text-[#2d5624] hover:underline">
                  Cart & Checkout
                </Link>
              </li>
              <li>
                <span className="cursor-pointer transition hover:text-[#2d5624]">
                  Track Delivery
                </span>
              </li>
              <li>
                <span className="cursor-pointer transition hover:text-[#2d5624]">
                  Cancellation Policy
                </span>
              </li>
              <li>
                <span className="cursor-pointer transition hover:text-[#2d5624]">
                  FAQ & Help Center
                </span>
              </li>
              <li>
                <span className="cursor-pointer transition hover:text-[#2d5624]">
                  Partner Delivery Boys
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter & Socials (4 cols) */}
          <div className="lg:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#183b2b]">
              Stay Fresh with Weekly Deals
            </h4>
            <p className="mt-2 text-xs text-[#718575]">
              Subscribe to get exclusive coupon codes, seasonal fruit arrivals,
              and flash discounts delivered to your inbox.
            </p>

            <form onSubmit={handleSubscribe} className="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="min-w-0 flex-1 rounded-2xl border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-2.5 text-xs text-[#183b2b] placeholder-[#98a398] outline-none transition focus:border-[#76a85b] focus:bg-white"
              />
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="flex items-center gap-1.5 rounded-2xl bg-[#183b2b] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#285e23] active:scale-95">
                <span>Join</span>
                <Send className="h-3 w-3" />
              </button>
            </form>

            <div className="mt-6">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#718575]">
                Connect With Us
              </span>
              <div className="mt-3 flex items-center gap-2">
                {/* Instagram */}
                <button
                  type="button"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] text-[#526557] transition hover:border-[#b6cda8] hover:bg-[#eaf5dc] hover:text-[#2d5624]">
                  <svg className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </button>
                {/* Twitter / X */}
                <button
                  type="button"
                  aria-label="Twitter"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] text-[#526557] transition hover:border-[#b6cda8] hover:bg-[#eaf5dc] hover:text-[#2d5624]">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                {/* Facebook */}
                <button
                  type="button"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] text-[#526557] transition hover:border-[#b6cda8] hover:bg-[#eaf5dc] hover:text-[#2d5624]">
                  <svg className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </button>
                {/* YouTube */}
                <button
                  type="button"
                  aria-label="YouTube"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] text-[#526557] transition hover:border-[#b6cda8] hover:bg-[#eaf5dc] hover:text-[#2d5624]">
                  <svg className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                    <polygon points="10 15 15 12 10 9 10 15"/>
                  </svg>
                </button>
                {/* LinkedIn */}
                <button
                  type="button"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5ecdf] bg-[#f9fbf7] text-[#526557] transition hover:border-[#b6cda8] hover:bg-[#eaf5dc] hover:text-[#2d5624]">
                  <svg className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                    <rect width="4" height="12" x="2" y="9"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div className="border-t border-[#edf2e8] bg-[#f9fbf7] py-6 text-xs text-[#718575]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="flex items-center gap-1">
            © {new Date().getFullYear()} GroFresh Marketplace Pvt. Ltd. Crafted
            with <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> for fresh food lovers.
          </p>

          <div className="flex flex-wrap items-center gap-4 font-semibold text-[#546e5a]">
            <span className="cursor-pointer hover:underline">Privacy Policy</span>
            <span>•</span>
            <span className="cursor-pointer hover:underline">Terms of Service</span>
            <span>•</span>
            <span className="cursor-pointer hover:underline">Security</span>
            <span>•</span>
            <span className="cursor-pointer hover:underline">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
