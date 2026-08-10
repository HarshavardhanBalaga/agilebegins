"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/clientFetch";
import { StatusTimeline } from "@/components/admin/StatusTimeline";
import type { RegistrationDetail } from "@/models/registration";

const statusStyles: Record<string, string> = {
  pending: "bg-white/10 text-white",
  verified: "bg-accent text-ink",
  rejected: "bg-red-500/20 text-red-200",
};

const INFO_ROWS: Array<{ label: string; get: (d: RegistrationDetail) => string }> = [
  { label: "Email", get: (d) => d.email },
  { label: "Phone", get: (d) => d.phone },
  { label: "College", get: (d) => d.college },
  { label: "Branch", get: (d) => d.branch },
  { label: "Year", get: (d) => d.year },
  { label: "Workshop", get: (d) => d.workshopTitle },
  { label: "Transaction ID", get: (d) => d.transactionId ?? "—" },
  { label: "Registered", get: (d) => formatDate(d.createdAt) },
  { label: "Last updated", get: (d) => formatDate(d.updatedAt) },
];

/**
 * Slide-in detail panel for a single registration. Shows the full student
 * record, payment screenshot, email/attendance flags and the lifecycle
 * timeline, with the same actions available as the table.
 */
export function RegistrationDrawer({
  registrationId,
  onClose,
  onChanged,
}: {
  registrationId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<RegistrationDetail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  /** Pure fetch — returns the parsed detail or null; never touches state. */
  const fetchDetail = useCallback(
    async (): Promise<RegistrationDetail | null> => {
      const res = await apiFetch(`/api/admin/registrations/${registrationId}`);
      if (!res.ok) return null;
      const data = (await res.json()) as { registration?: RegistrationDetail };
      return data.registration ?? null;
    },
    [registrationId]
  );

  function commitDetail(detail: RegistrationDetail | null) {
    if (detail) {
      setDetail(detail);
      setError("");
    } else {
      setError("Could not load the registration.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchDetail().then((detail) => {
      if (!cancelled) commitDetail(detail);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchDetail]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  async function runAction(
    endpoint: string,
    extra?: Record<string, unknown>
  ): Promise<boolean> {
    setBusy(true);
    setNotice("");
    try {
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: registrationId, ...extra }),
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setNotice(json.error ?? "Action failed.");
        return false;
      }
      if (json.message) setNotice(json.message);
      onChanged();
      const refreshed = await fetchDetail();
      commitDetail(refreshed);
      return true;
    } catch {
      setNotice("Unable to reach the server.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/60" role="dialog" aria-modal="true">
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col overflow-hidden bg-[#0d0d12] text-white shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-display text-xl font-bold leading-tight">
                {detail ? detail.name : "Registration"}
              </h3>
              {detail ? (
                <span
                  className={`inline-flex rounded-full px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.12em] ${
                    statusStyles[detail.paymentStatus] ?? "bg-white/10 text-white"
                  }`}
                >
                  {detail.paymentStatus}
                </span>
              ) : null}
            </div>
            {detail ? (
              <p className="mt-1 text-sm text-white/50">
                #{detail._id.slice(-8)} · {formatDate(detail.createdAt)}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close registration details"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 font-bold text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error ? (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
              {notice}
            </p>
          ) : null}

          {!detail && !error ? (
            <p className="py-12 text-center text-sm text-white/40">Loading…</p>
          ) : null}

          {detail ? (
            <div className="space-y-8">
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                  Student details
                </h4>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {INFO_ROWS.map((row) => (
                    <div key={row.label} className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                        {row.label}
                      </dt>
                      <dd className="mt-0.5 truncate text-sm text-white/85">
                        {row.get(detail)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                  Email & attendance
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Flag
                    ok={detail.emailVerified}
                    label={
                      detail.emailVerified
                        ? "Email verified"
                        : "Email not verified"
                    }
                  />
                  <Flag
                    ok={detail.confirmationMailSent}
                    label={
                      detail.confirmationMailSent
                        ? "Confirmation email sent"
                        : "Confirmation email pending"
                    }
                  />
                  <Flag
                    ok={detail.meetingLinkSent}
                    label={
                      detail.meetingLinkSent
                        ? "Meeting link sent"
                        : "Meeting link pending"
                    }
                  />
                  <Flag
                    ok={detail.attendance}
                    label={detail.attendance ? "Present" : "Absent"}
                  />
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                  Registration timeline
                </h4>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <StatusTimeline detail={detail} />
                </div>
              </div>

              {detail.hasScreenshot && detail.screenshot ? (
                <div>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                    Payment screenshot
                  </h4>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detail.screenshot}
                    alt={`Payment screenshot for ${detail.name}`}
                    className="max-h-[60vh] w-full rounded-2xl border border-white/10 object-contain"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {detail ? (
          <div className="flex flex-wrap gap-2 border-t border-white/10 px-6 py-4">
            {detail.paymentStatus === "pending" ? (
              <>
                <button
                  type="button"
                  onClick={() => runAction("/api/admin/verify")}
                  disabled={busy}
                  className="rounded-full bg-accent px-5 py-2.5 font-heading text-sm font-bold text-ink transition-transform hover:scale-[1.03] disabled:opacity-50"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => runAction("/api/admin/reject")}
                  disabled={busy}
                  className="rounded-full border border-red-300/40 px-5 py-2.5 font-heading text-sm font-bold text-red-200 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            ) : null}
            {detail.paymentStatus === "verified" ? (
              <button
                type="button"
                onClick={() => runAction("/api/admin/send-confirmation")}
                disabled={busy}
                className="rounded-full border border-white/20 px-5 py-2.5 font-heading text-sm font-bold text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                Send Email
              </button>
            ) : null}
            <button
              type="button"
              onClick={() =>
                runAction("/api/admin/attendance", {
                  attendance: !detail.attendance,
                })
              }
              disabled={busy}
              className="rounded-full border border-white/20 px-5 py-2.5 font-heading text-sm font-bold text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Mark {detail.attendance ? "Absent" : "Present"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        ok ? "bg-accent/15 text-accent" : "bg-white/10 text-white/50"
      }`}
    >
      {label}
    </span>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
