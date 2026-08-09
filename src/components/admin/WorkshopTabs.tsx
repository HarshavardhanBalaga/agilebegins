"use client";

import type { AdminWorkshopSummary } from "@/services/registrationService";

/**
 * Horizontal workshop selector for the admin dashboard. "All workshops" is
 * always the first pill; each workshop shows its registration total.
 */
export function WorkshopTabs({
  workshops,
  activeId,
  onChange,
}: {
  workshops: AdminWorkshopSummary[];
  activeId: string | null;
  onChange: (workshopId: string | null) => void;
}) {
  const grandTotal = workshops.reduce((sum, w) => sum + w.total, 0);

  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
      <div className="flex min-w-max items-center gap-2">
        <TabButton
          label="All workshops"
          count={grandTotal}
          active={activeId === null}
          onClick={() => onChange(null)}
        />
        {workshops.map((workshop) => (
          <TabButton
            key={workshop._id}
            label={workshop.title}
            count={workshop.total}
            active={activeId === workshop._id}
            onClick={() => onChange(workshop._id)}
          />
        ))}
      </div>
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 font-heading text-sm font-bold transition-colors ${
        active
          ? "border-accent bg-accent text-ink"
          : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
      }`}
    >
      <span className="max-w-[220px] truncate">{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
          active ? "bg-ink/15 text-ink" : "bg-white/10 text-white/60"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
