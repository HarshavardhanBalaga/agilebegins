import Link from "next/link";
import type { ReactNode } from "react";

interface ButtonProps {
  href: string;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  className?: string;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center rounded-full font-heading font-bold transition-transform duration-300 hover:scale-[1.03]";

const variants = {
  primary: "bg-accent text-ink",
  secondary:
    "border border-white/60 text-white hover:border-white hover:bg-white hover:text-brand",
};

const sizes = {
  md: "px-8 py-3.5 text-sm",
  lg: "px-10 py-4 text-base",
};

export function Button({
  href,
  variant = "primary",
  size = "lg",
  className = "",
  children,
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}