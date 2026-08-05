import Link from "next/link";

import { Navbar } from "@/components/landing/Navbar";
import { WorkshopGrid } from "@/components/workshop/WorkshopGrid";

export default function WorkshopPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-white/60 transition-colors hover:text-white"
                  >
                    Home
                  </Link>
                </li>
                <li aria-hidden="true" className="text-white/40">
                  /
                </li>
                <li aria-current="page" className="font-medium text-white">
                  Workshops
                </li>
              </ol>
            </nav>

            <h1 className="mt-10 font-display text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.03em] text-white">
              <span className="block">Explore</span>
              <span className="block">Workshops</span>
            </h1>

            <p className="mt-6 max-w-[650px] text-base leading-relaxed text-white/[0.78] md:text-lg">
              Browse current and upcoming Agile Begins workshops designed to
              help students build practical skills, gain career clarity, and
              prepare for internships.
            </p>

            <div className="mt-14 lg:mt-16">
              <WorkshopGrid />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}