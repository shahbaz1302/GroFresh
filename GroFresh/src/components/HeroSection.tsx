"use client";

import { Clock3 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const slides = [
  {
    id: "fresh-picks",
    eyebrow: "Picked for your day",
    title: "Fresh picks,\nfeeling good.",
    description: "Crisp produce and everyday favorites, brought to your door.",
    badge: "Farm-fresh favorites",
    art: ["🥑", "🍋", "🥬"],
    background: "from-[#e8f5d9] via-[#f4f8e9] to-[#fff4ce]",
    accent: "bg-[#d8edb8]",
  },
  {
    id: "snack-time",
    eyebrow: "A little something delicious",
    title: "Snack time?\nSorted.",
    description: "Stock up on crunchy, sweet, and savory treats you love.",
    badge: "Treat yourself",
    art: ["🍿", "🥨", "🍪"],
    background: "from-[#fff0d9] via-[#fff8e9] to-[#fce2d8]",
    accent: "bg-[#f6d8b4]",
  },
  {
    id: "quick-delivery",
    eyebrow: "More time for the good stuff",
    title: "Forgot a thing?\nWe’re on it.",
    description: "Your grocery-list essentials are just around the corner.",
    badge: "Quick neighborhood delivery",
    art: ["🛵", "🥛", "🍞"],
    background: "from-[#dff3ed] via-[#f1f8ed] to-[#e3efff]",
    accent: "bg-[#c6e9dd]",
  },
];

const HeroSection = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="GroFresh offers and highlights"
      className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-[#f3f7ed] shadow-[0_24px_65px_-38px_rgba(24,59,43,0.4)] sm:rounded-4xl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`relative grid min-h-84 overflow-hidden bg-linear-to-br ${slide.background} sm:min-h-96 lg:min-h-150 lg:grid-cols-[1.05fr_0.95fr]`}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-36 border-white/25 sm:h-80 sm:w-80"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 left-[35%] h-72 w-72 rounded-full bg-white/25 blur-2xl"
            />

            <div className="relative z-10 flex flex-col items-start justify-center px-6 pb-5 pt-8 sm:px-10 sm:py-10 lg:px-14 xl:px-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#53744c] shadow-sm sm:text-xs">
                <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                {slide.eyebrow}
              </span>
              <h1 className="mt-5 whitespace-pre-line text-[2.65rem] font-black leading-[0.98] tracking-[-0.075em] text-[#183b2b] sm:mt-6 sm:text-6xl lg:text-[4.25rem]">
                {slide.title}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#5d6d63] sm:mt-5 sm:text-base sm:leading-7">
                {slide.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#183b2b] px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_25px_-15px_rgba(24,59,43,0.8)] sm:mt-6 sm:text-sm">
                {slide.badge}
                <span aria-hidden="true">✦</span>
              </span>
            </div>

            <div
              aria-hidden="true"
              className="relative flex min-h-44 items-center justify-center px-6 pb-12 sm:min-h-56 sm:px-10 lg:min-h-0 lg:pb-8 lg:pr-14">
              <div
                className={`absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full ${slide.accent} opacity-80 blur-[1px] sm:h-64 sm:w-64 lg:h-80 lg:w-80`}
              />
              <div className="absolute left-[18%] top-[20%] h-3 w-3 rounded-full bg-white/80 sm:left-[22%] sm:top-[18%]" />
              <div className="absolute right-[18%] top-[25%] h-2.5 w-2.5 rounded-full bg-white/90 sm:right-[22%]" />
              <div className="absolute bottom-[22%] left-[24%] h-2 w-2 rounded-full bg-[#76a85b]/50" />

              <div className="relative flex h-44 w-full max-w-md items-center justify-center sm:h-56 lg:h-80">
                <motion.span
                  key={`${slide.id}-left`}
                  initial={{ opacity: 0, y: 12, rotate: -18 }}
                  animate={{ opacity: 1, y: 0, rotate: -14 }}
                  transition={{ delay: 0.12, duration: 0.45 }}
                  className="absolute left-[8%] top-[20%] flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/80 bg-white/75 text-5xl shadow-[0_18px_35px_-20px_rgba(24,59,43,0.4)] sm:left-[12%] sm:h-24 sm:w-24 sm:text-6xl lg:h-28 lg:w-28">
                  {slide.art[0]}
                </motion.span>
                <motion.span
                  key={`${slide.id}-center`}
                  initial={{ opacity: 0, y: 18, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.04, duration: 0.5 }}
                  className="relative z-10 flex h-28 w-28 items-center justify-center rounded-4xl border border-white/90 bg-white/85 text-7xl shadow-[0_28px_45px_-20px_rgba(24,59,43,0.42)] sm:h-36 sm:w-36 sm:rounded-[2.5rem] sm:text-8xl lg:h-44 lg:w-44 lg:text-[6.5rem]">
                  {slide.art[1]}
                </motion.span>
                <motion.span
                  key={`${slide.id}-right`}
                  initial={{ opacity: 0, y: 12, rotate: 18 }}
                  animate={{ opacity: 1, y: 0, rotate: 14 }}
                  transition={{ delay: 0.18, duration: 0.45 }}
                  className="absolute right-[8%] top-[24%] flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/80 bg-white/75 text-5xl shadow-[0_18px_35px_-20px_rgba(24,59,43,0.4)] sm:right-[12%] sm:h-24 sm:w-24 sm:text-6xl lg:h-28 lg:w-28">
                  {slide.art[2]}
                </motion.span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-5 pb-4 sm:px-8 sm:pb-5 lg:px-10">
          <div className="flex items-center gap-2" aria-label="Choose a slide">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show slide ${index + 1}: ${item.eyebrow}`}
                aria-current={activeSlide === index ? "true" : undefined}
                onClick={() => setActiveSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#547d46] ${
                  activeSlide === index
                    ? "w-7 bg-[#315c3d]"
                    : "w-2 bg-[#315c3d]/30 hover:bg-[#315c3d]/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
