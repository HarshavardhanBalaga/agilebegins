import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { workshops } from "@/data/workshops";

export const metadata: Metadata = {
  title: "Workshops",
  description: "Practical live workshops that turn learning into building.",
};

/**
 * GET /workshops — public explorer for future functionality.
 * Same white card language as /app/workshops (2px ink borders,
 * hard shadows, brand blue accents, no hover). Live seats flow
 * through `/register`.
 */
export default function WorkshopsPage() {
  return (
    <main className="bg-white font-[family-name:var(--font-cal-sans)] antialiased">
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_40%,black_30%,transparent_75%)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(17,17,17,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute top-[42%] left-[57%] h-96 w-[46rem] max-w-[115vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300/40 blur-3xl"
        />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-14 pb-10 text-center md:pt-20">
          <h1 className="max-w-3xl text-4xl leading-[1.05] font-bold text-balance text-neutral-900 md:text-6xl">
            Workshops
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed font-normal text-neutral-600 md:text-lg">
            Practical live sessions that turn what you learn into what you
            build.
          </p>
        </div>
      </section>
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
          {workshops.map((workshop) => (
            <article
              key={workshop.slug}
              className="flex min-h-[190px] flex-col justify-between rounded-lg border-2 border-[#111111] bg-white p-5 shadow-[3px_3px_0_0_#111111]"
            >
              <div>
                <p className="text-xs font-normal tracking-[0.18em] text-brand uppercase">
                  {workshop.number} · {workshop.duration} · {workshop.price}
                </p>
                <h2 className="mt-3 text-xl leading-snug font-normal text-[#111111]">
                  {workshop.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed font-normal text-[#111111]/70">
                  {workshop.description}
                </p>
              </div>
              {workshop.status === "live" ? (
                <Link
                  href="/register"
                  className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-normal text-brand underline underline-offset-4"
                >
                  Reserve your seat
                  <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
                </Link>
              ) : (
                <p className="mt-6 inline-flex self-start rounded-full border border-[#111111]/30 px-2.5 py-1 text-[11px] font-normal tracking-[0.14em] text-[#111111]/60 uppercase">
                  Coming soon
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
