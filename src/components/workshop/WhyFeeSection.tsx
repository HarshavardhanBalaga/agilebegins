import { Card } from "@/components/ui/Card";
import type { Workshop } from "@/data/workshops";

export function WhyFeeSection({ workshop }: { workshop: Workshop }) {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-accent">
          The Small Fee
        </p>
        <h2 className="mt-4 font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1] tracking-[-0.02em] text-white">
          Why is this workshop only {workshop.price}?
        </h2>

        <Card variant="glass" className="mt-8 px-8 py-9 sm:px-10">
          <p className="text-base leading-relaxed text-white/[0.8]">
            This isn&apos;t about making money. It&apos;s about building a
            community of students serious enough to invest in themselves —
            even if it&apos;s just {workshop.price}. A small registration fee
            also keeps the room full of committed, focused participants.
          </p>
        </Card>
      </div>
    </section>
  );
}