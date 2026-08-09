"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { BackgroundDecor } from "./BackgroundDecor";
import { AbstractComposition } from "./AbstractComposition";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.35 },
  },
};

const revealUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const lineReveal: Variants = {
  hidden: { y: "112%" },
  show: {
    y: "0%",
    transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
  },
};

const LINES = [
  { text: "STOP", accent: false },
  { text: "GUESSING", accent: true },
  { text: "START", accent: false },
  { text: "BUILDING", accent: true },
];

function Headline() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      aria-label="Stop guessing. Start building."
      className="[container-type:inline-size]"
    >
      {LINES.map((line) => (
        <span
          key={line.text}
          className="-mb-[0.12em] block overflow-hidden pb-[0.12em]"
        >
          <motion.span
            variants={lineReveal}
            className="block font-display text-[clamp(3rem,13.2cqw,9rem)] font-bold leading-[0.9] tracking-[-0.03em] text-white"
          >
            {line.text}
            {line.accent && <span className="text-accent">.</span>}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <BackgroundDecor />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5.5rem)] w-full max-w-[1280px] grid-cols-1 items-center gap-y-16 px-5 pb-24 pt-8 sm:px-8 sm:pt-12 lg:grid-cols-12 lg:gap-x-16 lg:gap-y-0 lg:px-12 lg:pb-20 lg:pt-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-8 lg:pr-4"
        >
          <div>
            <Headline />
          </div>

          <motion.p
            variants={revealUp}
            className="mt-8 max-w-[520px] text-base leading-relaxed text-white/[0.78] md:text-lg"
          >
            Practical workshops for ambitious students who want internships,
            projects, freelancing, and real career growth.
          </motion.p>

          <motion.div
            variants={revealUp}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5"
          >
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-accent px-10 py-4 font-heading text-base font-bold text-ink transition-transform duration-300 hover:scale-[1.03]"
            >
              Reserve Your Seat
            </a>
            <Link
              href="/workshop"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 px-10 py-4 font-heading text-base font-bold text-white transition-all duration-300 hover:scale-[1.03] hover:border-white hover:bg-white hover:text-brand"
            >
              Explore Workshops
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-4"
        >
          <AbstractComposition />
        </motion.div>
      </div>
    </section>
  );
}