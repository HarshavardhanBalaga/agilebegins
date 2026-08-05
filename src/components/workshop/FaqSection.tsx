"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Workshop } from "@/data/workshops";

export function FaqSection({ workshop }: { workshop: Workshop }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <SectionHeading kicker="Questions" title="Frequently Asked" />

      <div className="mx-auto mt-12 max-w-2xl space-y-3">
        {workshop.faq.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={item.question}
              className="rounded-xl border border-white/10 bg-white/[0.05]"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-heading text-base font-bold text-white">
                  {item.question}
                </span>
                <ChevronDown
                  size={18}
                  strokeWidth={2.5}
                  className={`shrink-0 text-accent transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-sm leading-relaxed text-white/[0.7]">
                      {item.answer}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}