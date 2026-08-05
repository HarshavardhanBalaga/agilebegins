import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Workshop } from "@/data/workshops";

export function TimelineSection({ workshop }: { workshop: Workshop }) {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <SectionHeading kicker="Agenda" title="Workshop Timeline" />

      <ol className="relative mx-auto mt-14 max-w-2xl border-l-2 border-white/15 pl-8">
        {workshop.timeline.map((step, i) => (
          <li key={step.title} className="relative pb-10 last:pb-0">
            <span className="absolute -left-9 top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-accent bg-brand">
              <span className="h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Step {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1.5 font-heading text-xl font-bold text-white">
              {step.title}
            </h3>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/[0.7]">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}