"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

function Float({
  children,
  className = "",
  duration = 10,
  delay = 0,
  distance = 14,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  distance?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -distance, 0], x: [0, distance * 0.35, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      {children}
    </motion.div>
  );
}

export function BackgroundDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Oversized background typography */}
      <span className="absolute -right-[6%] top-[3%] select-none font-display text-[clamp(7rem,16vw,18rem)] font-bold leading-none tracking-[-0.02em] text-white/[0.03]">
        BUILD
      </span>
      <span className="absolute -left-[8%] bottom-[5%] select-none font-display text-[clamp(7rem,15vw,17rem)] font-bold leading-none tracking-[-0.02em] text-white/[0.03]">
        GROW
      </span>
      <span className="absolute bottom-[18%] right-[20%] hidden select-none font-display text-[clamp(2.5rem,5vw,5rem)] font-bold leading-none tracking-[0.1em] text-white/[0.03] lg:block">
        001
      </span>

      {/* Floating geometric shapes */}
      <Float className="absolute right-[3%] top-[22%] h-16 w-16 rounded-full border border-white/[0.08]">
        <span className="block h-full w-full rounded-full border border-white/[0.08]" />
      </Float>

      <Float
        className="absolute right-[17%] top-[62%]"
        duration={13}
        distance={20}
      >
        <span className="block h-5 w-5 rotate-12 bg-accent/60" />
      </Float>

      <Float
        className="absolute left-[30%] top-[16%]"
        duration={12}
        delay={0.8}
        distance={12}
      >
        <span className="block h-8 w-8 rounded-full bg-white/[0.08]" />
      </Float>

      <Float className="absolute bottom-[24%] right-[30%]" duration={11}>
        <span className="block h-12 w-12 rotate-45 border border-white/[0.12]" />
      </Float>

      <Float
        className="absolute bottom-[14%] left-[14%] hidden lg:block"
        duration={14}
        delay={1.4}
      >
        <span className="block h-3 w-3 rounded-full bg-accent/60" />
      </Float>

      {/* Diagonal accent line */}
      <div className="absolute left-[46%] top-[-4%] h-[120%] w-px rotate-[22deg] bg-white/[0.06]" />
    </div>
  );
}