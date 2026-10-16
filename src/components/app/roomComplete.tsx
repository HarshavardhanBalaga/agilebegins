import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RollingText from "@/components/RollingText";
import type { RoomSummaryView } from "@/services/roomService";

/**
 * Session completion: "Session complete — 45 min focused, 3 tasks" plus
 * Find another companion / Back home. Lightweight, no gamification.
 */
export function SessionComplete({ summary }: { summary: RoomSummaryView }) {
  const focusMin = Math.max(1, Math.round(summary.focusSec / 60));
  return (
    <section aria-label="Session complete" className="text-center">
      <p className="inline-flex items-center gap-2 text-xs font-normal tracking-[0.18em] text-brand uppercase">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent ring-1 ring-neutral-900" />
        Session complete
      </p>
      <h1 className="mx-auto mt-4 max-w-[20ch] text-4xl leading-[1.05] font-normal text-balance text-neutral-900 sm:text-5xl">
        Well studied.
      </h1>
      <p className="mx-auto mt-5 max-w-[52ch] text-base leading-relaxed font-normal text-pretty text-neutral-600 sm:text-lg">
        {summary.durationMin} min together · {focusMin} min focused · {summary.tasksCompleted}{" "}
        {summary.tasksCompleted === 1 ? "task" : "tasks"} completed
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        <Link
          href="/app/find"
          className="group inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-lg border-2 border-neutral-900 bg-accent py-1.5 pr-2.5 pl-4 shadow-[4px_4px_0_0_#111111] transition-all duration-200 hover:bg-neutral-900 hover:shadow-[0px_0px_0_0_#111111]"
        >
          <span className="leading-none font-normal whitespace-nowrap text-neutral-900 uppercase text-sm transition-colors duration-300 group-hover:text-white">
            <RollingText text="Find another companion" />
          </span>
          <span className="flex size-7 items-center justify-center rounded-md bg-neutral-900 transition-colors duration-300 group-hover:bg-accent">
            <ArrowRight
              size={15}
              strokeWidth={2.5}
              aria-hidden="true"
              className="text-white transition-all duration-300 group-hover:-rotate-45 group-hover:text-neutral-900"
            />
          </span>
        </Link>
        <Link
          href="/app"
          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-normal text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-900"
        >
          Back home
        </Link>
      </div>
    </section>
  );
}

/** Partner left while you stayed: gentle closed state with re-queue CTAs. */
export function PartnerLeft() {
  return (
    <section aria-label="Room closed" className="text-center">
      <p className="inline-flex items-center gap-2 text-xs font-normal tracking-[0.18em] text-brand uppercase">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-neutral-300" />
        Room closed
      </p>
      <h1 className="mx-auto mt-4 max-w-[20ch] text-4xl leading-[1.05] font-normal text-balance text-neutral-900 sm:text-5xl">
        Your companion left.
      </h1>
      <p className="mx-auto mt-5 max-w-[52ch] text-base leading-relaxed font-normal text-pretty text-neutral-600 sm:text-lg">
        This study room is closed. Find another partner whenever you&apos;re ready.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        <Link
          href="/app/find"
          className="group inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-lg border-2 border-neutral-900 bg-accent py-1.5 pr-2.5 pl-4 shadow-[4px_4px_0_0_#111111] transition-all duration-200 hover:bg-neutral-900 hover:shadow-[0px_0px_0_0_#111111]"
        >
          <span className="leading-none font-normal whitespace-nowrap text-neutral-900 uppercase text-sm transition-colors duration-300 group-hover:text-white">
            <RollingText text="Find another companion" />
          </span>
          <span className="flex size-7 items-center justify-center rounded-md bg-neutral-900 transition-colors duration-300 group-hover:bg-accent">
            <ArrowRight
              size={15}
              strokeWidth={2.5}
              aria-hidden="true"
              className="text-white transition-all duration-300 group-hover:-rotate-45 group-hover:text-neutral-900"
            />
          </span>
        </Link>
        <Link
          href="/app"
          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-normal text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-900"
        >
          Back home
        </Link>
      </div>
    </section>
  );
}

