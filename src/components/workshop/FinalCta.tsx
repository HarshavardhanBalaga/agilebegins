import { Button } from "@/components/ui/Button";

export function FinalCta({ slug }: { slug: string }) {
  return (
    <section id="reserve" className="relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[1280px] px-5 text-center sm:px-8 lg:px-12">
        <h2 className="font-display text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.92] tracking-[-0.03em] text-white">
          <span className="block">Ready to Stop Guessing?</span>
          <span className="block text-accent">Start Building.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/[0.75]">
          Reserve your seat today and take the first step toward building your
          career with clarity.
        </p>

        <div className="mt-10">
          <Button href={`/register?workshop=${slug}`} className="px-14">
            Reserve Your Seat
          </Button>
        </div>
      </div>
    </section>
  );
}
