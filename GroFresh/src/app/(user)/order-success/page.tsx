"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const formatOrderId = (orderId: string | null) => {
  if (!orderId) {
    return "Confirmed";
  }

  return `#${orderId.slice(-8).toUpperCase()}`;
};

const OrderSuccessContent = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8f4] px-4 pb-12 pt-5 text-[#263a2d] sm:px-6 sm:pt-7 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#dfeec8]/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-[#f6e7c7]/70 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-[#66776a] transition hover:text-[#294b35] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Link>

          <Link
            href="/"
            aria-label="GroFresh home"
            className="text-xl font-black tracking-[-0.06em] text-[#294b35] sm:text-2xl">
            GRO<span className="text-[#80a85d]">FRESH</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#778579] sm:text-sm">
            <PackageCheck
              aria-hidden="true"
              className="h-4 w-4 text-[#80a85d]"
            />
            <span className="hidden sm:inline">Order confirmed</span>
            <span className="sm:hidden">Done</span>
          </div>
        </motion.header>

        <motion.ol
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06 }}
          aria-label="Checkout progress"
          className="mb-8 flex items-center justify-center gap-2">
          <li className="flex items-center gap-2 text-xs font-bold text-[#5e8b4d] sm:text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f1e1]">
              <Check aria-hidden="true" className="h-4 w-4" />
            </span>
            Basket
          </li>
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-[#c3ccc0]" />
          <li className="flex items-center gap-2 text-xs font-bold text-[#5e8b4d] sm:text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f1e1]">
              <Check aria-hidden="true" className="h-4 w-4" />
            </span>
            Checkout
          </li>
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-[#c3ccc0]" />
          <li
            aria-current="step"
            className="flex items-center gap-2 text-xs font-bold text-[#294b35] sm:text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#294b35] text-xs text-white">
              3
            </span>
            Done
          </li>
        </motion.ol>

        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-3xl border border-[#e8ece4] bg-white shadow-[0_12px_35px_-28px_rgba(39,67,47,0.35)]">
          <div className="h-1 bg-[linear-gradient(90deg,#9ccf73,#d7eb8f,#7ea961)]" />

          <div className="px-5 py-8 text-center sm:px-10 sm:py-12">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.15, type: "spring" }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f1e1] text-[#4f7d43] ring-8 ring-[#f4f8ef] sm:h-24 sm:w-24">
              <Check aria-hidden="true" className="h-10 w-10 sm:h-12 sm:w-12" />
            </motion.div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#86a177]">
              You&apos;re all set
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#263a2d] sm:text-4xl">
              Order placed successfully
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#7a887c]">
              Thank you for shopping with GroFresh. Your groceries are being
              packed and will be at your door shortly.
            </p>

            {/* <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-[#e8ece4] bg-[#f8f9f6] p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4e8] text-[#638a50]">
                  <Clock3 aria-hidden="true" className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#8a978b]">
                  Estimated arrival
                </p>
                <p className="mt-1 text-lg font-extrabold tracking-tight">
                  25–35 minutes
                </p>
              </div>
              <div className="rounded-2xl border border-[#e8ece4] bg-[#f8f9f6] p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4e8] text-[#638a50]">
                  <PackageCheck aria-hidden="true" className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#8a978b]">
                  Order ID
                </p>
                <p className="mt-1 text-lg font-extrabold tracking-tight">
                  {formatOrderId(orderId)}
                </p>
              </div>
            </div> */}

            {/* <div className="mt-5 rounded-2xl border border-[#cbdcbe] bg-[#f7faf4] p-4 text-left">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f0df] text-[#5d8749]">
                  <MapPin aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-extrabold">Out for packing</p>
                  <p className="mt-1 text-xs leading-5 text-[#829084]">
                    We&apos;ll notify you as soon as a delivery partner is on
                    the way. Keep your phone nearby for updates.
                  </p>
                </div>
                <span className="ml-auto hidden rounded-full bg-[#e5f0dc] px-2.5 py-1 text-[10px] font-bold text-[#5f8c4b] sm:inline">
                  FAST
                </span>
              </div>
            </div> */}

            {/* <ul className="mt-6 grid gap-2 text-left sm:grid-cols-3">
              {[
                { label: "Confirmed", done: true },
                { label: "Packing", done: false },
                { label: "On the way", done: false },
              ].map((step, index) => (
                <li
                  key={step.label}
                  className={`rounded-2xl border px-3 py-3 ${
                    step.done
                      ? "border-[#83a970] bg-[#f7faf4]"
                      : "border-[#edf0ea] bg-white"
                  }`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a978b]">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-bold">{step.label}</p>
                </li>
              ))}
            </ul> */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4f7d43] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(53,99,53,0.8)] transition hover:bg-[#3f6b37] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dcebd0]">
                Continue shopping
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e4ebe0] bg-white px-6 py-3.5 text-sm font-extrabold text-[#46584a] transition hover:border-[#c1d5b3] hover:bg-[#f7faf4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#eaf3e3]">
                View orders & tracking
              </Link>
            </div>

            <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#94a094]">
              <Sparkles aria-hidden="true" className="h-3 w-3 text-[#80a85d]" />
              Fresh picks, already on their way to your door.
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

const OrderSuccessPage = () => {
  return (
    <Suspense
      fallback={
        <main
          aria-live="polite"
          className="min-h-screen bg-[#f7f8f4] px-4 py-12 text-center text-sm font-medium text-[#718575]">
          Confirming your order...
        </main>
      }>
      <OrderSuccessContent />
    </Suspense>
  );
};

export default OrderSuccessPage;
