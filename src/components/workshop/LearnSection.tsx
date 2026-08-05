import { Check } from "lucide-react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Workshop } from "@/data/workshops";

export function LearnSection({ workshop }: { workshop: Workshop }) {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <SectionHeading kicker="Curriculum" title="What You'll Learn" />

      <ul className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
        {workshop.learn.map((item) => (
          <li
            key={item}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-4"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-ink">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-sm font-medium text-white/90">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}