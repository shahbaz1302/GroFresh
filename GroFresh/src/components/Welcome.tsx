"use client";

import { motion } from "motion/react";

type propType={
  nextStep:(s:number)=>void
}

export default function Welcome({nextStep}:propType) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#f8fbf5_0%,#f2f7ee_35%,#edf3e8_100%)] px-5 py-10 font-sans text-[#183b2b]">
      <div
        aria-hidden="true"
        className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#dfeec8]/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-12 right-10 h-80 w-80 rounded-full bg-[#f6e7c7]/80 blur-3xl"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),transparent_30%,rgba(121,167,95,0.08))]" />

      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-4xl border border-white/80 bg-white/75 p-6 shadow-[0_30px_90px_-35px_rgba(24,59,43,0.45)] backdrop-blur-xl sm:p-8"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#9ccf73,#d7eb8f,#7ea961)]" />

        <div className="flex items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.18, duration: 0.5, ease: "easeOut" }}
            className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,#eaf5dc,#dfeec8)] text-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_22px_-10px_rgba(121,167,95,0.8)]"
            aria-hidden="true"
          >
            🌱
          </motion.div>

          <div className="rounded-full border border-[#dfe8d8] bg-[#f4f8f1] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#54715a]">
            Local & fresh
          </div>
        </div>

        <div className="mt-7 text-center">
          <p className="text-sm font-bold tracking-[-0.04em] text-[#224c39]">
            Gro<span className="bg-linear-to-r from-[#5d8d4c] to-[#9dcf5d] bg-clip-text text-transparent">Fresh</span>
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-[-0.08em] text-[#173d2e] sm:text-[3.2rem]">
            Fresh food,
            <span className="block bg-linear-to-r from-[#183b2b] via-[#2a6a4a] to-[#6d9b58] bg-clip-text text-transparent">
              happier living.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#5d6d63] sm:text-base">
            Discover handpicked produce, pantry essentials, and chef-worthy picks
            delivered in minutes from the people who grow them nearby.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3 text-left">
          {[
            ["2k+", "happy shoppers"],
            ["15 min", "avg. delivery"],
            ["100%", "farm fresh"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#edf2e9] bg-[#f9fbf7] p-3 shadow-[0_10px_30px_-18px_rgba(24,59,43,0.4)]"
            >
              <div className="text-base font-black tracking-[-0.06em] text-[#1a3c2d]">
                {value}
              </div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#7b877f]">
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <motion.button
            onClick={()=>nextStep(2)}
            className="cursor-pointer mx-auto w-1/2 rounded-full bg-[linear-gradient(135deg,#183b2b,#24583d)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_35px_-18px_rgba(24,59,43,0.9)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_38px_-18px_rgba(24,59,43,0.95)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#76a85b]"
          >
            Get started
            <span aria-hidden="true" className="text-base">→</span>
          </motion.button>
        </div>

        <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#7d8b7f]">
          Good food is just around the corner.
        </p>
      </motion.section>
    </main>
  );
}
