interface SectionHeadingProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {kicker ? (
        <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-accent">
          {kicker}
        </p>
      ) : null}
      <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[0.95] tracking-[-0.02em] text-white">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-white/[0.75] md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}