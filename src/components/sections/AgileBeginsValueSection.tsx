import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import RollingText from "@/components/RollingText";

const tiles = [
  { text: "Clear Roadmaps for Your Goals", bg: "bg-[#D6FF00]" },
  { text: "Practical Skills for Real Careers", bg: "bg-[#F5F3EA]" },
  { text: "Build Projects That Prove Your Skills", bg: "bg-[#D6FF00]" },
  { text: "Get Feedback to Improve Your Work", bg: "bg-[#F5F3EA]" },
  { text: "Turn What You Learn Into Action", bg: "bg-[#D6FF00]" },
];

export default function AgileBeginsValueSection() {
  return (
    <section className="bg-white px-4 py-10 font-[family-name:var(--font-cal-sans)] antialiased sm:px-6 md:py-14">
      <div className="mx-auto grid w-[92%] max-w-[1320px] items-center gap-10 md:grid-cols-2 md:gap-8 lg:gap-12">
        {/* Left: heading + CTA */}
        <div className="flex flex-col items-start justify-center">
          <p className="text-xs font-normal tracking-[0.22em] text-[#111111] uppercase">
            Built for student execution
          </p>
          <h2 className="mt-4 max-w-[16ch] text-4xl leading-[1.05] font-normal tracking-tight text-balance text-[#111111] sm:text-5xl lg:text-[56px]">
            Turn What You Learn Into What You Build.
          </h2>
          <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-pretty text-[#111111]/70">
            Stop collecting resources and start making meaningful progress on
            your goals, one step at a time.
          </p>
          <Link
            href="/register"
            className="group mt-8 flex shrink-0 items-center gap-3 rounded-lg border-2 border-[#111111] bg-[#D6FF00] py-1.5 pr-2.5 pl-5 shadow-[3px_3px_0_0_#111111] transition-all duration-200 hover:bg-[#111111] hover:shadow-[0px_0px_0_0_#111111]"
          >
            <span className="leading-none font-normal whitespace-nowrap text-[#111111] uppercase text-sm transition-colors duration-200 group-hover:text-white">
              <RollingText text="Start Building" />
            </span>
            <span className="flex size-7.5 items-center justify-center rounded-md bg-[#111111] transition-colors duration-200 group-hover:bg-[#D6FF00]">
              <ArrowRight
                size={16}
                strokeWidth={2.5}
                aria-hidden="true"
                className="text-white transition-all duration-200 group-hover:-rotate-45 group-hover:text-[#111111]"
              />
            </span>
          </Link>
        </div>

        {/* Right: six-tile grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:gap-6">
          {tiles.map((tile) => (
            <article
              key={tile.text}
              className={`flex min-h-[150px] flex-col justify-between rounded-lg border-2 border-[#111111] p-4 shadow-[3px_3px_0_0_#111111] sm:min-h-[165px] lg:min-h-[180px] ${tile.bg}`}
            >
              <span
                aria-hidden="true"
                className="flex size-6 items-center justify-center rounded-full bg-[#111111]"
              >
                <Check size={13} strokeWidth={3.5} className="text-white" />
              </span>
              <h3 className="mt-6 text-left text-[15px] leading-snug font-normal text-[#111111] lg:text-lg">
                {tile.text}
              </h3>
            </article>
          ))}

          {/* Dark brand tile — logo fills the entire tile */}
          <div className="relative min-h-[150px] overflow-hidden rounded-lg border-2 border-[#111111] bg-[#292927] shadow-[3px_3px_0_0_#111111] sm:min-h-[165px] lg:min-h-[180px]">
            <Image
              src="/logos/cross-arrow-logo.png"
              alt="AgileBegins logo"
              fill
              sizes="(max-width: 768px) 45vw, 220px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
