"use client";

import { motion } from "framer-motion";

export function AbstractComposition() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[460px] sm:h-[500px] lg:h-[560px]">
      {/* Blueprint grid + dot grid */}
      <svg
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="ab-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M48 0H0V48"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />
          </pattern>
          <pattern
            id="ab-dots"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.14)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ab-grid)" />
        <rect width="100%" height="100%" fill="url(#ab-dots)" />
      </svg>

      {/* Huge outlined number */}
      <span
        className="absolute -right-2 -top-6 select-none font-display text-[9rem] font-bold leading-none text-transparent sm:text-[11rem] lg:-right-6 lg:-top-8"
        style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.15)" }}
      >
        001
      </span>

      {/* Large outlined circle */}
      <div className="absolute -left-12 top-10 h-56 w-56 rounded-full border border-white/10" />

      {/* Smaller circle */}
      <div className="absolute bottom-20 right-6 h-28 w-28 rounded-full border border-white/15" />

      {/* Accent block */}
      <div className="absolute -left-3 top-[46%] z-10 h-7 w-7 rotate-12 bg-accent" />

      {/* White block */}
      <div className="absolute bottom-10 left-4 z-10 h-4 w-4 bg-white/25" />

      {/* Abstract diagonal arrow */}
      <svg
        className="absolute left-3 top-4 z-10 opacity-80"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d6ff00"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 20L20 4" />
        <path d="M9 4h11v11" />
      </svg>

      {/* Career roadmap line */}
      <svg
        className="absolute bottom-6 left-8 z-10 h-44 w-44"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20 185 C 55 150, 55 105, 105 90 S 165 62, 185 28"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          strokeDasharray="2 7"
          strokeLinecap="round"
        />
        <circle cx="20" cy="185" r="3" fill="#d6ff00" />
        <circle cx="105" cy="90" r="3" fill="#ffffff" />
        <circle cx="185" cy="28" r="3" fill="#d6ff00" />
      </svg>

      {/* Floating ticket card */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 70 }}
          animate={{ opacity: 1, y: [0, -14, 0] }}
          transition={{
            opacity: { duration: 1, ease: "easeOut", delay: 0.4 },
            y: {
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.4,
            },
          }}
        >
          <div className="relative rotate-[-6deg]">
            <div className="absolute -left-5 -top-5 h-full w-full rotate-3 rounded-2xl border border-white/20 bg-ink" />
            <div className="relative w-[300px] rounded-2xl bg-white p-7 text-ink shadow-[0_40px_80px_-24px_rgba(0,0,0,0.45)] sm:w-[326px]">
              <div className="flex items-center justify-between">
                <span className="font-heading text-[11px] font-bold uppercase tracking-[0.22em]">
                  Agile Begins
                </span>
                <span className="rounded-full bg-ink px-3.5 py-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                  Live
                </span>
              </div>

              <div className="mt-8 flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Workshop
                  </p>
                  <p className="mt-2 font-display text-6xl font-bold leading-none">
                    001
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Seat
                  </p>
                  <p className="mt-2 font-heading text-2xl font-bold">001</p>
                </div>
              </div>

              <div className="my-6 border-t border-dashed border-neutral-300" />

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Build · Learn · Grow
                </p>
                <span className="rounded-full bg-accent px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-wide text-ink">
                  Reserve Seat
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}