"use client";

import type { RegistrationView } from "@/models/registration";

export interface AdminActions {
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
  onViewScreenshot: (id: string) => void;
  onResendConfirmation: (id: string) => void;
  onToggleAttendance: (id: string, attendance: boolean) => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-white/10 text-white",
  verified: "bg-accent text-ink",
  rejected: "bg-red-500/20 text-red-200",
};

/**
 * Admin registrations table with the actions from the spec: verify, reject,
 * view screenshot, send confirmation email, plus attendance.
 */
export function RegistrationsTable({
  items,
  onAction,
  busyId,
}: {
  items: RegistrationView[];
  onAction: AdminActions;
  busyId: string | null;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
        No registrations yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-white/50">
            <th className="px-5 py-4 font-semibold">Student</th>
            <th className="px-5 py-4 font-semibold">Email</th>
            <th className="px-5 py-4 font-semibold">Phone</th>
            <th className="px-5 py-4 font-semibold">College</th>
            <th className="px-5 py-4 font-semibold">Workshop</th>
            <th className="px-5 py-4 font-semibold">Txn ID</th>
            <th className="px-5 py-4 font-semibold">Status</th>
            <th className="px-5 py-4 font-semibold">Created</th>
            <th className="px-5 py-4 font-semibold">Attendance</th>
            <th className="px-5 py-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((item) => (
            <tr key={item._id} className="align-top">
              <td className="px-5 py-4 font-semibold text-white">{item.name}</td>
              <td className="px-5 py-4 text-white/70">{item.email}</td>
              <td className="px-5 py-4 text-white/70">{item.phone}</td>
              <td className="px-5 py-4 text-white/70">{item.college}</td>
              <td className="px-5 py-4 text-white/70">{item.workshopTitle}</td>
              <td className="px-5 py-4 font-mono text-xs text-white/70">
                {item.transactionId}
              </td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.12em] ${
                    statusStyles[item.paymentStatus] ?? "bg-white/10 text-white"
                  }`}
                >
                  {item.paymentStatus}
                </span>
              </td>
              <td className="px-5 py-4 text-white/60">
                {formatDate(item.createdAt)}
              </td>
              <td className="px-5 py-4">
                <button
                  type="button"
                  onClick={() =>
                    onAction.onToggleAttendance(item._id, !item.attendance)
                  }
                  disabled={busyId === item._id}
                  className={`rounded-full px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                    item.attendance
                      ? "bg-accent text-ink"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {item.attendance ? "Present" : "Absent"}
                </button>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {item.paymentStatus === "pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onAction.onVerify(item._id)}
                        disabled={busyId === item._id}
                        className="rounded-full bg-accent px-3 py-1.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition-transform hover:scale-[1.03] disabled:opacity-50"
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => onAction.onReject(item._id)}
                        disabled={busyId === item._id}
                        className="rounded-full border border-red-300/40 px-3 py-1.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-red-200 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {item.hasScreenshot ? (
                    <button
                      type="button"
                      onClick={() => onAction.onViewScreenshot(item._id)}
                      disabled={busyId === item._id}
                      className="rounded-full border border-white/20 px-3 py-1.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
                    >
                      Screenshot
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onAction.onResendConfirmation(item._id)}
                    disabled={busyId === item._id}
                    className="rounded-full border border-white/20 px-3 py-1.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    Send Email
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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