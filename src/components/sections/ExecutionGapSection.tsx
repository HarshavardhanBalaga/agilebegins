"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

type Task = {
  label: string;
  meta: string;
  done: boolean;
};

const tasks: Task[] = [
  { label: "Finish JavaScript full-course tutorial", meta: "Part 7 of 12", done: false },
  { label: "Build a portfolio project", meta: "Day 14 streak", done: true },
  { label: "Practise coding problems", meta: "2 of 5 today", done: false },
  { label: "Push work to GitHub", meta: "0 commits today", done: false },
  { label: "Apply for internships", meta: "1 of 3 sent", done: false },
  { label: "Complete DSA roadmap notes", meta: "Saved, not started", done: false },
  { label: "Ship landing page v1", meta: "Draft pending", done: true },
  { label: "Revise React hooks tutorial", meta: "Rewatching again", done: false },
];

const bubbleMessages = [
  "I'll start Monday…",
  "Saved 12 more tabs",
  "Tutorial 34 of 52…",
  "Portfolio tomorrow?",
  "Zero commits today",
  "Roadmap #6 saved",
  "Need accountability",
  "Just one more video…",
  "Stuck in tutorial hell",
  "No portfolio yet",
  "DSA day 0 again",
  "Watching, not building",
  "Interviews soon, help",
];

type Bubble = {
  id: number;
  text: string;
  x: number;
  y: number;
};

let bubbleId = 0;

function randomBubble(isMobile: boolean, usedTexts: string[]): Bubble {
  bubbleId += 1;
  // Draw from messages not currently on screen so two visible bubbles never
  // show the same text. Fall back to the full pool when all are in use.
  const available = bubbleMessages.filter((m) => !usedTexts.includes(m));
  const pool = available.length > 0 ? available : bubbleMessages;
  const text = pool[Math.floor(Math.random() * pool.length)];
  // Whole-section placement with a headline exclusion zone so bubbles never
  // cover the heading: desktop headline sits in the right 58% middle band,
  // mobile headline sits in the top ~55%.
  let x = 0;
  let y = 0;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    x = isMobile ? 3 + Math.random() * 68 : 2 + Math.random() * 80;
    y = isMobile ? 4 + Math.random() * 84 : 5 + Math.random() * 80;
    const inHeadlineZone = isMobile
      ? y < 56
      : x > 38 && y > 22 && y < 82;
    if (!inHeadlineZone) break;
  }
  return { id: bubbleId, text, x, y };
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#252525] px-4 py-3">
      <span
        aria-hidden="true"
        className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
          task.done ? "border-[#D6FF00] bg-[#D6FF00]" : "border-[#3d3d3d]"
        }`}
      >
        {task.done && (
          <Check size={13} strokeWidth={3.5} className="text-[#111111]" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-[#F5F5F5]">
          {task.label}
        </span>
        <span className="block truncate text-[11px] text-[#A3A3A3]">
          {task.meta}
        </span>
      </span>
    </div>
  );
}

export default function ExecutionGapSection() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const timers = useRef<number[]>([]);

  // Spawn floating bubbles on desktop only (avoids hydration mismatch).
  // Mobile (<768px) skips bubbles entirely — no popups on small screens.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.innerWidth < 768) return;

    const spawn = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) return;
      // Read visible bubbles from the ref (never from inside a state
      // updater) so the new text is always unique among visible bubbles.
      const bubble = randomBubble(
        isMobile,
        bubblesRef.current.map((b) => b.text),
      );
      bubblesRef.current = [...bubblesRef.current.slice(-4), bubble];
      setBubbles(bubblesRef.current);
      const removeId = window.setTimeout(() => {
        bubblesRef.current = bubblesRef.current.filter(
          (b) => b.id !== bubble.id,
        );
        setBubbles(bubblesRef.current);
      }, 5000);
      timers.current.push(removeId);

      const nextId = window.setTimeout(spawn, 900 + Math.random() * 900);
      timers.current.push(nextId);
    };

    const firstId = window.setTimeout(spawn, 800);
    timers.current.push(firstId);

    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, []);

  return (
    <section className="bg-white px-4 py-10 font-[family-name:var(--font-cal-sans)] sm:px-6 md:py-14">
      <div className="relative mx-auto h-[440px] w-full max-w-[1320px] overflow-hidden rounded-[20px] bg-[#111111] antialiased min-[400px]:h-[480px] md:h-[500px] lg:h-[540px]">
        <div className="flex h-full flex-col md:grid md:grid-cols-[42%_58%]">
          <div className="relative order-2 flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5 pb-6 md:order-1 md:px-8 md:py-10 lg:px-10">
            <div className="relative h-[170px] w-full max-w-[420px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] min-[400px]:h-[200px] sm:h-[230px] md:h-[380px] lg:h-[400px]">
              {/* Two identical halves: translateY(-50%) wraps seamlessly. */}
              <div className="animate-checklist-scroll flex w-full flex-col">
                {[0, 1].map((half) => (
                  <div key={half} aria-hidden={half === 1} className="flex flex-col gap-3 pb-3">
                    {tasks.map((task) => (
                      <TaskRow key={`${half}-${task.label}`} task={task} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 flex flex-col justify-center px-6 pt-8 pb-2 md:order-2 md:px-10 md:py-10 lg:px-14">
            <p className="text-xs font-medium tracking-[0.22em] text-[#D6FF00] uppercase">
              Sound familiar?
            </p>
            <h2 className="mt-4 max-w-[22ch] text-[26px] leading-[1.12] font-normal text-balance text-[#F5F5F5] sm:text-3xl md:text-4xl lg:text-[44px] lg:leading-[1.08]">
              Your potential deserves more than another unfinished plan.
            </h2>
            <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-pretty text-[#A3A3A3] md:text-base">
              You don&apos;t need another roadmap to save. You need to make
              progress on the one you have.
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden md:block"
        >
          <AnimatePresence>
            {bubbles.map((bubble) => (
              <motion.div
                key={bubble.id}
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute"
                style={{ left: `${bubble.x}%`, top: `${bubble.y}%` }}
              >
                <span className="block rounded-xl rounded-bl-sm bg-accent px-3 py-1.5 text-xs font-normal whitespace-nowrap text-[#111111]">
                  {bubble.text}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
