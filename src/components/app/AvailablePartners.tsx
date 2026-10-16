"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/clientFetch";
import Avatar from "@/components/app/Avatar";
import RollingText from "@/components/RollingText";
import { APP_LIME_BADGE } from "@/components/app/appTheme";

interface DirectoryUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  waitSeconds: number;
}

interface InviteRow {
  id: string;
  status: string;
  direction: "incoming" | "outgoing";
  counterpart: { id: string; displayName: string; avatarUrl?: string };
}

type ApiBody = {
  users?: DirectoryUser[];
  invites?: InviteRow[];
  invite?: InviteRow;
  status?: string;
  roomId?: string | null;
  error?: string;
  code?: string;
  fields?: Record<string, string | undefined>;
};

const AVAIL_POLL_MS = 5000;

function formatWait(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

async function readBody(response: Response): Promise<ApiBody> {
  try {
    return (await response.json()) as ApiBody;
  } catch {
    return {};
  }
}

async function postJson(url: string, payload: Record<string, string>) {
  return apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);
}

/**
 * Pick-from-list directory: live searching students + invite inbox.
 * Complements auto-match (MatchFinder) — both funnel into the same rooms.
 * An idle viewer who sends an invite learns about the accept via a one-shot
 * status check when their outgoing invite resolves.
 */
export default function AvailablePartners() {
  const router = useRouter();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollSeq = useRef(0);
  const outgoingSeen = useRef<Set<string>>(new Set());

  const schedule = useCallback((delay: number) => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = setTimeout(() => {
      void refresh();
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh(): Promise<void> {
    const seq = ++pollSeq.current;
    const [availRes, inboxRes] = await Promise.all([
      apiFetch("/api/match/available").catch(() => null),
      apiFetch("/api/match/invites").catch(() => null),
    ]);
    if (seq !== pollSeq.current) return;
    let backoff: number | null = null;
    for (const res of [availRes, inboxRes]) {
      if (res?.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After") ?? "10");
        backoff = Math.max(
          backoff ?? 0,
          Number.isFinite(retryAfter) ? Math.max(1, retryAfter) : 10
        );
      }
    }
    if (backoff !== null) {
      schedule(backoff * 1000);
      return;
    }
    if (availRes?.ok) {
      const body = await readBody(availRes);
      if (Array.isArray(body.users)) setUsers(body.users);
    }
    if (inboxRes?.ok) {
      const body = await readBody(inboxRes);
      if (Array.isArray(body.invites)) {
        const next = body.invites.filter(
          (row) => row.direction === "incoming" || row.direction === "outgoing"
        );
        setInvites(next);
        // An outgoing invite that resolved elsewhere (peer accepted while we
        // were idle): one-shot status check — a new room navigates us there.
        const nextOutgoing = new Set(
          next.filter((row) => row.direction === "outgoing").map((row) => row.id)
        );
        const resolved = [...outgoingSeen.current].some((id) => !nextOutgoing.has(id));
        outgoingSeen.current = nextOutgoing;
        if (resolved) {
          const statusRes = await apiFetch("/api/match/status").catch(() => null);
          if (seq !== pollSeq.current) return;
          if (statusRes?.ok) {
            const statusBody = await readBody(statusRes);
            if (statusBody.status === "matched" && statusBody.roomId) {
              router.push(`/app/room/${statusBody.roomId}`);
              return;
            }
          }
        }
      }
    }
    setLoaded(true);
    schedule(AVAIL_POLL_MS);
  }

  useEffect(() => {
    void refresh();
    return () => {
      pollSeq.current += 1;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendInvite(toUserId: string): Promise<void> {
    setBusyId(`invite:${toUserId}`);
    setNotice(null);
    try {
      const response = await postJson("/api/match/invite", { toUserId });
      if (!response) {
        setNotice("Could not reach the server. Try again.");
        return;
      }
      const body = await readBody(response);
      if (response.ok) {
        setNotice("Invitation sent.");
        await refresh();
        return;
      }
      if (response.status === 409 && body.code === "PENDING_INVITE_EXISTS") {
        setNotice("They already invited you — accept it below.");
        await refresh();
        return;
      }
      if (response.status === 409 && (body.roomId ?? body.fields?.roomId)) {
        router.push(`/app/room/${body.roomId ?? body.fields?.roomId}`);
        return;
      }
      setNotice(body.error ?? "Could not send the invitation.");
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function respondTo(inviteId: string, action: "accept" | "decline"): Promise<void> {
    setBusyId(`${action}:${inviteId}`);
    setNotice(null);
    try {
      const response = await postJson(`/api/match/invites/${inviteId}/respond`, {
        action,
      });
      if (!response) {
        setNotice("Could not reach the server. Try again.");
        return;
      }
      const body = await readBody(response);
      if (response.ok) {
        if (body.status === "accepted" && body.roomId) {
          router.push(`/app/room/${body.roomId}`);
          return;
        }
        await refresh();
        return;
      }
      if (response.status === 409 && (body.roomId ?? body.fields?.roomId)) {
        router.push(`/app/room/${body.roomId ?? body.fields?.roomId}`);
        return;
      }
      setNotice(body.error ?? "That invitation is no longer available.");
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function cancelInvite(inviteId: string): Promise<void> {
    setBusyId(`cancel:${inviteId}`);
    try {
      const response = await apiFetch(`/api/match/invites/${inviteId}`, {
        method: "DELETE",
      }).catch(() => null);
      if (response?.ok) {
        const body = await readBody(response);
        if (body.status === "accepted" && body.roomId) {
          router.push(`/app/room/${body.roomId}`);
          return;
        }
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  const incoming = invites.filter((row) => row.direction === "incoming");
  const outgoing = invites.filter((row) => row.direction === "outgoing");

  return (
    <section aria-label="Students available now">
      <p className="inline-flex items-center gap-2 text-xs font-normal tracking-[0.18em] text-brand uppercase">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent ring-1 ring-neutral-900" />
        Study queue
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h2 className="max-w-[20ch] text-4xl leading-[1.05] font-normal text-balance text-neutral-900 sm:text-5xl">
          Students available now
        </h2>
        {loaded && users.length > 0 ? (
          <span className={APP_LIME_BADGE}>
            {users.length} online
          </span>
        ) : null}
      </div>
      <p className="mt-5 max-w-[62ch] text-base leading-relaxed font-normal text-pretty text-neutral-600 sm:text-lg">
        These students are searching right now. Send an invitation — if they
        accept, you both land in the same study room.
      </p>

      {incoming.length > 0 ? (
        <div className="mt-10">
          <p className="text-xs font-normal tracking-[0.18em] text-neutral-900 uppercase">
            Invitations for you · {incoming.length}
          </p>
          <ul className="mt-4 flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
            {incoming.map((row) => (
              <li key={row.id} className="flex items-center gap-4 py-4">
                <span className="relative shrink-0">
                  <Avatar
                    name={row.counterpart.displayName}
                    avatarUrl={row.counterpart.avatarUrl}
                    size={44}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-accent ring-2 ring-white"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-normal text-neutral-900">
                    {row.counterpart.displayName}
                  </span>
                  <span className="mt-0.5 block text-sm font-normal text-neutral-500">
                    Wants to study with you
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void respondTo(row.id, "accept")}
                    className="group inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-lg border-2 border-neutral-900 bg-accent py-1.5 pr-2.5 pl-4 shadow-[4px_4px_0_0_#111111] transition-all duration-200 hover:bg-neutral-900 hover:shadow-[0px_0px_0_0_#111111] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="leading-none font-normal whitespace-nowrap text-neutral-900 uppercase text-sm transition-colors duration-300 group-hover:text-white">
                      <RollingText text={busyId === `accept:${row.id}` ? "Joining…" : "Accept"} />
                    </span>
                    <span className="flex size-7 items-center justify-center rounded-md bg-neutral-900 transition-colors duration-300 group-hover:bg-accent">
                      <ArrowRight
                        size={15}
                        strokeWidth={2.5}
                        aria-hidden="true"
                        className="text-white transition-all duration-300 group-hover:-rotate-45 group-hover:text-neutral-900"
                      />
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void respondTo(row.id, "decline")}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm font-normal text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {outgoing.length > 0 ? (
        <div className="mt-10">
          <p className="text-xs font-normal tracking-[0.18em] text-neutral-900 uppercase">
            Waiting for reply · {outgoing.length}
          </p>
          <ul className="mt-4 flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
            {outgoing.map((row) => (
              <li key={row.id} className="flex items-center gap-4 py-4">
                <span className="relative shrink-0">
                  <Avatar
                    name={row.counterpart.displayName}
                    avatarUrl={row.counterpart.avatarUrl}
                    size={44}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-brand ring-2 ring-white"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-normal text-neutral-900">
                    {row.counterpart.displayName}
                  </span>
                  <span className="mt-0.5 block text-sm font-normal text-neutral-500">
                    Invitation sent — waiting
                  </span>
                </span>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => void cancelInvite(row.id)}
                  className="shrink-0 cursor-pointer rounded-lg px-3 py-2 text-sm font-normal text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyId === `cancel:${row.id}` ? "Cancelling…" : "Undo"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-10">
        {!loaded ? (
          <p role="status" className="flex items-center gap-2.5 text-base leading-relaxed text-neutral-500">
            <span aria-hidden="true" className="inline-block size-2 animate-ping rounded-full bg-brand" />
            Finding students who are online…
          </p>
        ) : users.length === 0 ? (
          <p className="max-w-[62ch] text-base leading-relaxed text-neutral-500">
            No one else is searching right now. Stay in auto-match above and
            you&apos;ll pair automatically when someone arrives.
          </p>
        ) : (
          <>
            <p className="text-xs font-normal tracking-[0.18em] text-neutral-900 uppercase">
              Online now · {users.length}
            </p>
            <ul className="mt-4 flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
              {users.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center gap-4 py-4 transition-colors hover:bg-[#F8F8FC] sm:px-3"
                >
                  <span className="relative shrink-0">
                    <Avatar
                      name={person.displayName}
                      avatarUrl={person.avatarUrl}
                      size={44}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-accent ring-2 ring-white"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-normal text-neutral-900">
                      {person.displayName}
                    </span>
                    <span className="mt-0.5 block text-sm font-normal text-neutral-500">
                      Searching · waiting {formatWait(person.waitSeconds)}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void sendInvite(person.id)}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-normal text-brand underline underline-offset-4 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyId === `invite:${person.id}` ? "Sending…" : "Invite"}
                    <ArrowRight
                      size={15}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {notice ? (
        <p role="status" className="mt-6 text-sm text-brand">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
