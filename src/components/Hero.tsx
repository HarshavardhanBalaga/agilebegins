import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RollingText from "@/components/RollingText";

export default function Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-76px)] flex-col justify-center overflow-hidden bg-white font-[family-name:var(--font-cal-sans)] antialiased">
      {/* Grid backdrop with radial fade so the edges melt back to white */}
      <div
        aria-hidden="true"
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_40%,black_30%,transparent_75%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(17,17,17,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* Soft lime glow behind the headline — offset slightly off-center and oversized for depth */}
      <div
        aria-hidden="true"
        className="absolute top-[42%] left-[57%] h-96 w-[46rem] max-w-[115vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300/40 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-20 pb-24 text-center md:pt-28 md:pb-32">
        {/* Eyebrow badge */}
        <p className="inline-flex items-center gap-2.5 rounded-full border-2 border-neutral-900 bg-white px-4 py-1.5 text-xs tracking-[0.18em] text-neutral-900 uppercase shadow-[3px_3px_0_0_#111111]">
          <span
            aria-hidden="true"
            className="flex size-5 items-center justify-center rounded-full bg-neutral-900 text-base leading-none font-bold text-accent"
          >
            #
          </span>
          Aiming to become the student go-to website
        </p>

        {/* Headline */}
        <h1 className="mt-8 max-w-3xl text-5xl leading-[1.02]  text-balance text-neutral-900 md:text-7xl">
          Your Bookmarks Won&apos;t Build Your Future.
        </h1>

        {/* Sub copy */}
        <p className="mt-6 max-w-xl text-base leading-relaxed font-normal text-neutral-600 md:text-lg">
          For students who save tutorials, resources, and roadmaps but rarely
          act on them.
        </p>

        {/* CTA — navbar button with lime default / dark hover and hard shadow that collapses on hover (button stays put) */}
        <div className="mt-10 flex items-center justify-center">
          <Link
            href="/login"
            className="group flex shrink-0 items-center gap-3.75 rounded-lg border-2 border-neutral-900 bg-accent py-1.5 pr-2.5 pl-5 shadow-[4px_4px_0_0_#111111] transition-all duration-200 hover:bg-neutral-900 hover:shadow-[0px_0px_0_0_#111111]"
          >
            <span className="leading-none font-normal whitespace-nowrap text-neutral-900 uppercase text-sm transition-colors duration-300 group-hover:text-white">
              <RollingText text="Sign In" />
            </span>
            <span className="flex size-7.5 items-center justify-center rounded-md bg-neutral-900 transition-colors duration-300 group-hover:bg-accent">
              <ArrowRight
                size={16}
                className="text-white transition-all duration-300 group-hover:-rotate-45 group-hover:text-neutral-900"
                strokeWidth={2.5}
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
