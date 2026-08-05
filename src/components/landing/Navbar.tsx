"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Workshop 001", href: "/workshops/workshop-001" },
  { label: "About", href: "/#about" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 bg-brand"
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Logo />

        <nav className="hidden items-center gap-10 lg:flex">
          {NAV_LINKS.map((link) => {
            const isHighlighted = link.label === "Workshop 001";
            return (
              <a
                key={link.label}
                href={link.href}
                className={`group relative text-sm font-medium transition-colors duration-300 hover:text-white ${
                  isHighlighted ? "text-accent" : "text-muted"
                }`}
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 h-[2px] w-full origin-left scale-x-0 rounded-full bg-accent transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#reserve"
            className="hidden rounded-full bg-accent px-8 py-3 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.03] sm:inline-flex"
          >
            Reserve Your Seat
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden lg:hidden"
      >
        <nav className="flex flex-col border-t border-white/10 px-6 py-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-white/5 py-3 font-heading text-sm font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#reserve"
            onClick={() => setOpen(false)}
            className="mt-4 rounded-full bg-accent px-6 py-3 text-center font-heading text-sm font-bold text-ink"
          >
            Reserve Your Seat
          </a>
        </nav>
      </motion.div>
    </motion.header>
  );
}