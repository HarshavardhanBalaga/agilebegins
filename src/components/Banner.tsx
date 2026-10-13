import { ArrowRight } from "lucide-react";

const items = [
  "Peer Accountability",
  "Build Sessions",
  "Weekly Workshops",
  "Progress Tracking",
  "Career Prep",
];

export default function Banner() {
  return (
    <div className="overflow-hidden bg-accent font-[family-name:var(--font-cal-sans)] antialiased">
      <div className="flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 items-center"
          >
            {items.map((item) => (
              <span key={`${copy}-${item}`} className="flex items-center">
                <span className="px-6 py-2.5 text-lg tracking-[0.14em] whitespace-nowrap text-neutral-900 uppercase">
                  {item}
                </span>
                <ArrowRight
                  aria-hidden="true"
                  size={16}
                  strokeWidth={2.5}
                  className="-rotate-45 text-neutral-900"
                />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
