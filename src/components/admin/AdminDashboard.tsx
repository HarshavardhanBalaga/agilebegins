"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { StatsCards } from "@/components/admin/StatsCards";
import {
  RegistrationsTable,
  type AdminActions,
} from "@/components/admin/RegistrationsTable";
import { ScreenshotModal } from "@/components/admin/ScreenshotModal";
import type { PublicUser } from "@/models/user";
import type { RegistrationView } from "@/models/registration";

interface ListResponse {
  items: RegistrationView[];
  total: number;
  page: number;
  pageSize: number;
  counts: { total: number; pending: number; verified: number; rejected: number };
}

const PAGE_SIZE = 25;

export function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined);
  const [data, setData] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [screenshotId, setScreenshotId] = useState<string | null>(null);

  const loadData = useCallback(async (targetPage: number) => {
    const params = new URLSearchParams({
      page: String(targetPage),
      pageSize: String(PAGE_SIZE),
    });
    const res = await fetch(`/api/admin/registrations?${params.toString()}`);
    if (!res.ok) return;
    const json = (await res.json()) as ListResponse;
    setData(json);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const me = (await meRes.json()) as { user?: PublicUser };
        if (cancelled) return;
        setUser(me.user ?? null);
        if (me.user?.role === "admin") loadData(1);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  function handleAuthSuccess(currentUser: PublicUser) {
    setUser(currentUser);
    if (currentUser.role === "admin") {
      router.replace("/admin");
      loadData(1);
    } else {
      setNotice("This account does not have admin access.");
    }
  }

  async function runAction(
    endpoint: string,
    id: string,
    extra?: Record<string, unknown>
  ): Promise<boolean> {
    setBusyId(id);
    setNotice("");
    try {
      const res = await fetch(endpoint, {
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
      await loadData(page);
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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  }

  if (user === undefined) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
        Checking access…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="font-display text-2xl font-bold text-white">
          Admin access
        </h2>
        <p className="mt-2 mb-8 text-sm text-white/60">
          Log in with an admin account to manage registrations.
        </p>
        <AuthForm initialMode="login" onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Registrations
          </h2>
          <p className="mt-1 text-sm text-white/60">Signed in as {user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Download endpoint — intentionally a plain anchor, not a page link */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/admin/registrations?format=csv"
            className="inline-flex rounded-full border border-white/20 px-6 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Export CSV
          </a>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-white/20 px-6 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </div>

      {notice ? (
        <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
          {notice}
        </div>
      ) : null}

      {data ? (
        <>
          <StatsCards counts={data.counts} />

          <RegistrationsTable
            items={data.items}
            onAction={actions}
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
                    setPage(prev);
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
                    const next = data.page + 1;
                    setPage(next);
                    loadData(next);
                  }}
                  disabled={data.page * PAGE_SIZE >= data.total}
                  className="rounded-full border border-white/20 px-5 py-2 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
          Loading registrations…
        </div>
      )}

      {screenshotId ? (
        <ScreenshotModal
          registrationId={screenshotId}
          onClose={() => setScreenshotId(null)}
        />
      ) : null}
    </div>
  );
}