"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/clientFetch";
import { StatsCards } from "@/components/admin/StatsCards";
import { WorkshopTabs } from "@/components/admin/WorkshopTabs";
import {
  RegistrationsTable,
  type AdminActions,
} from "@/components/admin/RegistrationsTable";
import { ScreenshotModal } from "@/components/admin/ScreenshotModal";
import { RegistrationDrawer } from "@/components/admin/RegistrationDrawer";
import { PAYMENT_STATUS, type PaymentStatus } from "@/lib/constants";
import type { RegistrationView } from "@/models/registration";
import type { AdminWorkshopSummary } from "@/services/registrationService";

export interface AdminListResponse {
  items: RegistrationView[];
  total: number;
  page: number;
  pageSize: number;
  counts: { total: number; pending: number; verified: number; rejected: number };
}

export interface AdminDashboardProps {
  initialData: AdminListResponse;
  initialWorkshops: AdminWorkshopSummary[];
  /** Pre-select a workshop tab (e.g. deep link from /admin/workshops). */
  initialWorkshopId?: string | null;
}

const PAGE_SIZE = 25;

const STATUS_TABS: Array<{ key: PaymentStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: PAYMENT_STATUS.PENDING, label: "Pending" },
  { key: PAYMENT_STATUS.VERIFIED, label: "Verified" },
  { key: PAYMENT_STATUS.REJECTED, label: "Rejected" },
];

/**
 * /admin dashboard. The initial page (list + workshop tabs) is rendered on the
 * server and handed in via props; this component handles the interactive parts:
 * workshop tabs, status filter, debounced search, pagination, actions, and the
 * per-registration detail drawer.
 */
export function AdminDashboard({
  initialData,
  initialWorkshops,
  initialWorkshopId = null,
}: AdminDashboardProps) {
  const [workshops, setWorkshops] =
    useState<AdminWorkshopSummary[]>(initialWorkshops);
  const [data, setData] = useState<AdminListResponse>(initialData);
  const [page, setPage] = useState(initialData.page);
  const [workshopId, setWorkshopId] = useState<string | null>(
    initialWorkshopId
  );
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [screenshotId, setScreenshotId] = useState<string | null>(null);

  /** Pure fetch — returns the parsed page or null; never touches state. */
  const fetchPage = useCallback(
    async (targetPage: number): Promise<AdminListResponse | null> => {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(PAGE_SIZE),
      });
      if (workshopId) params.set("workshopId", workshopId);
      if (status) params.set("status", status);
      if (search) params.set("search", search);

      const res = await apiFetch(`/api/admin/registrations?${params.toString()}`);
      if (!res.ok) return null;
      return (await res.json()) as AdminListResponse;
    },
    [workshopId, status, search]
  );

  function commitPage(json: AdminListResponse | null) {
    if (json) {
      setData(json);
      setPage(json.page);
    }
  }

  const loadData = useCallback(
    (targetPage: number) => fetchPage(targetPage).then(commitPage),
    [fetchPage]
  );

  const refreshWorkshops = useCallback(async () => {
    const res = await apiFetch("/api/admin/workshops");
    if (!res.ok) return;
    const json = (await res.json()) as { workshops: AdminWorkshopSummary[] };
    setWorkshops(json.workshops);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadData(page), refreshWorkshops()]);
  }, [loadData, page, refreshWorkshops]);

  useEffect(() => {
    let cancelled = false;
    fetchPage(1).then((json) => {
      if (!cancelled) commitPage(json);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function runAction(
    endpoint: string,
    id: string,
    extra?: Record<string, unknown>
  ): Promise<boolean> {
    setBusyId(id);
    setNotice("");
    try {
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...extra }),
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setNotice(json.error ?? "Action failed.");
        return false;
      }
      if (json.message) setNotice(json.message);
      await refreshAll();
      return true;
    } catch {
      setNotice("Unable to reach the server.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  const actions: AdminActions = {
    onVerify: (id) => runAction("/api/admin/verify", id),
    onReject: (id) => runAction("/api/admin/reject", id),
    onViewScreenshot: (id) => setScreenshotId(id),
    onResendConfirmation: (id) =>
      runAction("/api/admin/send-confirmation", id),
    onToggleAttendance: (id, attendance) =>
      runAction("/api/admin/attendance", id, { attendance }),
  };

  const csvParams = new URLSearchParams({ format: "csv" });
  if (workshopId) csvParams.set("workshopId", workshopId);
  if (search) csvParams.set("search", search);
  const csvHref = `/api/admin/registrations?${csvParams.toString()}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          All registrations
        </h2>
        <div className="flex items-center gap-3">
          {/* Download endpoint — intentionally a plain anchor, not a page link */}
          <a
            href={csvHref}
            className="inline-flex rounded-full border border-white/20 px-6 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Export CSV
          </a>
        </div>
      </div>

      {notice ? (
        <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
          {notice}
        </div>
      ) : null}

      <WorkshopTabs
        workshops={workshops}
        activeId={workshopId}
        onChange={(id) => setWorkshopId(id)}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => {
            const active =
              (tab.key === "all" && status === null) ||
              (tab.key !== "all" && status === tab.key);
            const count =
              tab.key === "all"
                ? data.counts.total
                : data.counts[tab.key];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatus(tab.key === "all" ? null : tab.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-heading text-sm font-bold transition-colors ${
                  active
                    ? "border-accent bg-accent text-ink"
                    : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                    active ? "bg-ink/15 text-ink" : "bg-white/10 text-white/60"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, email, phone, txn…"
          className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none sm:w-72"
        />
      </div>

      <StatsCards counts={data.counts} />

      <RegistrationsTable
        items={data.items}
        onAction={actions}
        onSelect={setDrawerId}
        busyId={busyId}
      />

      {data.total > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            {data.total} registrations · page {data.page}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                const prev = Math.max(1, data.page - 1);
                loadData(prev);
              }}
              disabled={data.page <= 1}
              className="rounded-full border border-white/20 px-5 py-2 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => {
                loadData(data.page + 1);
              }}
              disabled={data.page * PAGE_SIZE >= data.total}
              className="rounded-full border border-white/20 px-5 py-2 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {drawerId ? (
        <RegistrationDrawer
          registrationId={drawerId}
          onClose={() => setDrawerId(null)}
          onChanged={refreshAll}
        />
      ) : null}

      {screenshotId ? (
        <ScreenshotModal
          registrationId={screenshotId}
          onClose={() => setScreenshotId(null)}
        />
      ) : null}
    </div>
  );
}
