interface StatsData {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

/**
 * KPI cards at the top of the admin dashboard.
 */
export function StatsCards({ counts }: { counts: StatsData }) {
  const cards = [
    { label: "Total Registrations", value: counts.total, accent: false },
    { label: "Pending", value: counts.pending, accent: true },
    { label: "Verified", value: counts.verified, accent: false },
    { label: "Rejected", value: counts.rejected, accent: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            {card.label}
          </p>
          <p
            className={`mt-3 font-display text-4xl font-bold ${
              card.accent ? "text-accent" : "text-white"
            }`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}