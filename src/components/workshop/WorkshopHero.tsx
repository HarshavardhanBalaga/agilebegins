"use client";

import { motion, type Variants } from "framer-motion";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BackgroundDecor } from "@/components/landing/BackgroundDecor";
import type { Workshop } from "@/data/workshops";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const revealUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

interface WorkshopHeroProps {
  workshop: Workshop;
}

export function WorkshopHero({ workshop }: WorkshopHeroProps) {
  const isLive = workshop.status === "live";

  const infoRows = [
    { label: "Workshop", value: workshop.number },
    { label: "Platform", value: workshop.platform },
    { label: "Duration", value: workshop.duration },
    { label: "Registration", value: workshop.price },
    { label: "Seats", value: workshop.seats },
    { label: "Live Q&A", value: workshop.liveQa },
  ];

  return (
    <section id="top" className="relative overflow-hidden">
      <BackgroundDecor />

      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-y-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-12 lg:gap-x-16 lg:px-12 lg:pb-24 lg:pt-16">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-7"
        >
          <motion.div variants={revealUp}>
            <Badge>
              {isLive ? "Live Workshop " : "Workshop "}
              {workshop.number}
            </Badge>
          </motion.div>

          <motion.h1
            variants={revealUp}
            className="mt-6 font-display text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.03em] text-white"
          >
            {workshop.heroLines.map((line) => (
              <span key={line.text} className="block">
                {line.text}
                {line.accent && <span className="text-accent">.</span>}
              </span>
            ))}
          </motion.h1>

          <motion.p
            variants={revealUp}
            className="mt-7 max-w-[520px] text-base leading-relaxed text-white/[0.78] md:text-lg"
          >
            {workshop.description}
          </motion.p>

          <motion.div
            variants={revealUp}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5"
          >
            {isLive ? (
              <Button href={`/register?workshop=${workshop.slug}`}>
                Reserve Your Seat
              </Button>
            ) : (
              <span className="inline-flex items-center justify-center rounded-full bg-white/10 px-10 py-4 font-heading text-base font-bold text-white/60">
                Coming Soon
              </span>
            )}
            <Button href="/workshop" variant="secondary">
              Back to Workshops
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5"
        >
          <div className="relative mx-auto w-full max-w-[440px]">
            <div className="absolute -left-4 -top-4 h-full w-full rotate-2 rounded-2xl border border-white/20 bg-ink" />
            <div className="relative rounded-2xl bg-white p-7 text-ink shadow-[0_40px_80px_-24px_rgba(0,0,0,0.45)] sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                  Workshop Information
                </p>
                {isLive ? (
                  <span className="shrink-0 rounded-full bg-ink px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                    Live
                  </span>
                ) : null}
              </div>

              <dl className="mt-6">
                {infoRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 border-b border-neutral-100 py-3.5 last:border-none"
                  >
                    <dt className="text-sm font-semibold text-neutral-500">
                      {row.label}
                    </dt>
                    <dd className="font-heading text-sm font-bold text-ink">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {isLive ? (
                <p className="mt-6 rounded-xl bg-accent/15 px-4 py-3.5 text-center font-heading text-sm font-bold text-ink">
                  Only {workshop.seats === "Only 50" ? "50 seats" : workshop.seats} —
                  reserve before seats run out
                </p>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}