"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RollingText from "@/components/RollingText";

const links = [
  { label: "HOW IT WORKS", href: "#how-it-works" },
  { label: "PRICING", href: "#pricing" },
  { label: "WHY US", href: "#why-us" },
  { label: "FAQs", href: "#faqs" },
];

export default function Navbar() {
  // Nav links stay visible at the top; scrolling down hides them, and even a
  // small scroll back up brings them back.
  const [linksVisible, setLinksVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const prev = lastY.current;
      lastY.current = y;

      if (y <= 24) {
        setLinksVisible(true);
        return;
      }
      if (y > prev) {
        // Scrolling down — hide.
        setLinksVisible(false);
      } else if (y < prev) {
        // Any upward movement — show.
        setLinksVisible(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-100 w-full bg-transparent px-6 py-4 font-normal font-[family-name:var(--font-cal-sans)] antialiased lg:px-[6.25%]">
      <div className="mx-auto flex w-full max-w-415.5 items-center justify-between">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="Project One home"
        >
          <Image
            src="/logos/logo_exact_black_transparent_64px.png"
            alt="Project One"
            width={36}
            height={36}
            priority
            className="h-auto w-9"
          />
          <span className="font-normal leading-none text-neutral-900 text-lg">
            AgileBegins
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <nav
            aria-label="Primary"
            className={`hidden shrink-0 items-center gap-10 rounded-lg bg-neutral-900 px-5.5 py-3.5 transition-all duration-400 [perspective:480px] md:flex ${
              linksVisible
                ? "[transform:rotateX(0deg)] opacity-100"
                : "pointer-events-none [transform:rotateX(-84deg)] opacity-0"
            }`}
            style={{ transformOrigin: "top center" }}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-normal leading-none whitespace-nowrap text-white/85 transition-colors hover:text-accent text-sm tracking-wide"
              >
                <RollingText text={link.label} />
              </Link>
            ))}
          </nav>

          <Link
            href="#reserve"
            className="group flex shrink-0 items-center gap-3.75 rounded-lg border border-transparent bg-neutral-900 py-1.5 pr-2.5 pl-5 transition-colors duration-200 hover:border-neutral-900 hover:bg-accent"
          >
            <span className="font-normal leading-none whitespace-nowrap text-white uppercase text-sm transition-colors duration-200 group-hover:text-neutral-900">
              <RollingText text="Reserve Spot" />
            </span>
            <span className="flex size-7.5 items-center justify-center rounded-md bg-accent transition-colors duration-200 group-hover:bg-neutral-900">
              <ArrowRight
                size={16}
                className="text-neutral-900 transition-all duration-200 group-hover:-rotate-45 group-hover:text-white"
                strokeWidth={2.5}
              />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

