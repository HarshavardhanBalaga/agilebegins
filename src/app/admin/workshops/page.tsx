import Link from "next/link";
import { ArrowRight, Mail, Users } from "lucide-react";
import { registrationService } from "@/services/registrationService";

export const dynamic = "force-dynamic";

/**
 * /admin/workshops — every workshop with its registration breakdown, linking
 * through to the registrations manager pre-filtered by that workshop.
 */
export default async function AdminWorkshopsPage() {
  const workshops = await registrationService.adminSummary();

  return (
    <main className="mx-auto w-full max-w-[1280px] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white">
          Workshops
        </h1>
        <p className="mt-3 max-w-[560px] text-base leading-relaxed text-white/[0.78]">
          Registrations per workshop. Select a workshop to review and manage its
          students.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workshops.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50 md:col-span-2 xl:col-span-3">
            No workshops yet.
          </p>
        ) : (
          workshops.map((workshop) => (
            <div
              key={workshop._id}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/25"
            >
              <Link
                href={`/admin/registrations?workshop=${workshop._id}`}
                className="block flex-1"
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

                <h2 className="mt-4 line-clamp-2 font-display text-lg font-bold leading-snug text-white group-hover:text-accent">
                  {workshop.title}
                </h2>

                <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
                  <Users className="h-4 w-4" aria-hidden />
                  {workshop.total} registration
                  {workshop.total === 1 ? "" : "s"}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-sm">
                  <Breakdown label="Pending" value={workshop.pending} tone="pending" />
                  <Breakdown label="Verified" value={workshop.verified} tone="verified" />
                  <Breakdown label="Rejected" value={workshop.rejected} tone="rejected" />
                  <Breakdown label="Attended" value={workshop.attended} tone="attended" />
                </div>

                <span className="mt-6 inline-flex items-center gap-2 font-heading text-sm font-bold text-white/70 transition-colors group-hover:text-accent">
                  Manage registrations
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>

              <Link
                href={`/admin/workshops/${workshop._id}/mail-settings`}
                className="mt-4 inline-flex items-center gap-2 border-t border-white/10 pt-4 font-heading text-sm font-bold text-white/60 transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4" aria-hidden />
                Mail settings
              </Link>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

const tones: Record<string, string> = {
  pending: "text-white",
  verified: "text-accent",
  rejected: "text-red-200",
  attended: "text-white",
};

function Breakdown({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
        {label}
      </p>
      <p className={`mt-0.5 font-display text-xl font-bold ${tones[tone]}`}>
        {value}
      </p>
    </div>
  );
}
