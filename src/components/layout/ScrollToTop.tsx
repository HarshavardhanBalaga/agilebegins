"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip hash navigations so Next.js / the browser can scroll to the target id.
    if (window.location.hash) return;

    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    const scroll = () => window.scrollTo(0, 0);
    scroll();

    // Re-apply after the router's own scroll handling so the final position is the top.
    const frame = requestAnimationFrame(scroll);
    html.style.scrollBehavior = previous;

    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}