import type { ReactNode } from "react";

interface CardProps {
  variant?: "solid" | "glass";
  className?: string;
  children: ReactNode;
}

const styles = {
  solid: "rounded-2xl bg-white text-ink shadow-[0_30px_60px_-24px_rgba(0,0,0,0.4)]",
  glass: "rounded-2xl border border-white/10 bg-white/[0.05] text-white",
};

export function Card({
  variant = "solid",
  className = "",
  children,
}: CardProps) {
  return (
    <div className={`${styles[variant]} ${className}`}>{children}</div>
  );
}