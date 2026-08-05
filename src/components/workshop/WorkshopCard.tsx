"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

import type { Workshop } from "@/data/workshops";

interface WorkshopCardProps {
  workshop: Workshop;
}

const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function WorkshopCard({ workshop }: WorkshopCardProps) {
  const isLive = workshop.status === "live";

  return (
    <motion.li
      variants={reveal}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="flex flex-col rounded-2xl bg-white p-7 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.4)] sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
          Workshop {workshop.number}
        </p>
        <span
          className={[
            "shrink-0 rounded-full px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.14em]",
            isLive ? "bg-accent text-ink" : "bg-neutral-100 text-neutral-500",
          ].join(" ")}
        >
          {isLive ? "LIVE" : "COMING SOON"}
        </span>
      </div>

      <h3 className="mt-6 font-heading text-2xl font-bold leading-snug tracking-tight text-ink">
        {workshop.title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-neutral-500 line-clamp-3">
        {workshop.description}
      </p>

      <div className="mt-auto pt-8">
        {workshop.duration || workshop.platform ? (
          <dl className="flex flex-wrap gap-x-8 gap-y-4 border-t border-neutral-100 pt-6">
            {workshop.duration ? (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Duration
                </dt>
                <dd className="mt-1 font-heading text-sm font-semibold text-ink">
                  {workshop.duration}
                </dd>
              </div>
            ) : null}
            {workshop.platform ? (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Platform
                </dt>
                <dd className="mt-1 font-heading text-sm font-semibold text-ink">
                  {workshop.platform}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {isLive ? (
          <Link
            href={`/workshops/${workshop.slug}`}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-accent px-6 py-3.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.02]"
          >
            {workshop.cta}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-6 flex w-full cursor-not-allowed items-center justify-center rounded-full bg-neutral-100 px-6 py-3.5 font-heading text-sm font-bold text-neutral-400"
          >
            {workshop.cta}
          </button>
        )}
      </div>
    </motion.li>
  );
}