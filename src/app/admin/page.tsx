import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { registrationService } from "@/services/registrationService";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  pending: "bg-white/10 text-white",
  verified: "bg-accent text-ink",
  rejected: "bg-red-500/20 text-red-200",
};

/**
 * /admin — dashboard overview: headline KPIs, per-workshop registration
 * cards and the most recent registrations.
 */
export default async function AdminDashboardPage() {
  const [workshops, { items }] = await Promise.all([
    registrationService.adminSummary(),
    registrationService.listForAdmin(1, 5),
  ]);

  const totals = workshops.reduce(
    (acc, w) => ({
      total: acc.total + w.total,
      pending: acc.pending + w.pending,
      verified: acc.verified + w.verified,
      rejected: acc.rejected + w.rejected,
      attended: acc.attended + w.attended,
    }),
    { total: 0, pending: 0, verified: 0, rejected: 0, attended: 0 }
  );

  const kpis = [
    { label: "Total Registrations", value: totals.total },
    { label: "Pending", value: totals.pending, accent: true },
    { label: "Verified", value: totals.verified },
    { label: "Rejected", value: totals.rejected },
    { label: "Attended", value: totals.attended },
  ];

  return (
    <main className="mx-auto w-full max-w-[1280px] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white">
          Dashboard
        </h1>
        <p className="mt-3 max-w-[560px] text-base leading-relaxed text-white/[0.78]">
          A quick overview of registrations across all workshops.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
              {kpi.label}
            </p>
            <p
              className={`mt-3 font-display text-4xl font-bold ${
                kpi.accent ? "text-accent" : "text-white"
              }`}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-white">
          Workshops
        </h2>
        <Link
          href="/admin/workshops"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 font-heading text-sm font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          View all
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workshops.map((workshop) => (
          <Link
            key={workshop._id}
            href={`/admin/registrations?workshop=${workshop._id}`}
            className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/25"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
                Workshop {workshop.number}
              </span>
              <span
                className={`rounded-full px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.12em] ${
                  workshop.status === "LIVE"
                    ? "bg-accent/15 text-accent"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {workshop.status}
              </span>
            </div>
            <h3 className="mt-4 line-clamp-2 font-display text-lg font-bold leading-snug text-white group-hover:text-accent">
              {workshop.title}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Registered" value={workshop.total} />
              <Stat label="Pending" value={workshop.pending} />
              <Stat label="Verified" value={workshop.verified} />
              <Stat label="Attended" value={workshop.attended} />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-white">
          Recent registrations
        </h2>
        <Link
          href="/admin/registrations"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 font-heading text-sm font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          View all
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {items.length === 0 ? (
          <p className="p-10 text-center text-sm text-white/50">
            No registrations yet.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((item) => (
              <li
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="truncate text-sm text-white/50">
                    {item.email} · {item.workshopTitle}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.12em] ${
                      statusStyles[item.paymentStatus] ?? "bg-white/10 text-white"
                    }`}
                  >
                    {item.paymentStatus}
                  </span>
                  <span className="text-sm text-white/40">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
        {label}
      </p>
      <p className="mt-0.5 font-display text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
