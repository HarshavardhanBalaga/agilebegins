"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/clientFetch";
import Avatar from "@/components/app/Avatar";
import {
  APP_LIME_BADGE,
  APP_PRIMARY_BUTTON,
  APP_SECONDARY_BUTTON,
} from "@/components/app/appTheme";

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
  const [readyRoomId, setReadyRoomId] = useState<string | null>(null);
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
            // Your invite was accepted elsewhere: offer the room explicitly
            // instead of navigating on your behalf (no auto-connect).
            if (statusBody.status === "matched" && statusBody.roomId) {
              setReadyRoomId(statusBody.roomId);
              setNotice("Your invitation was accepted.");
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
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl text-neutral-900">Available now</h2>
        <span className={APP_LIME_BADGE}>Pick a partner</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        These students are searching right now. Send an invitation — if they
        accept, you both land in the same study room.
      </p>

      {incoming.length > 0 ? (
        <div className="mt-5 rounded-xl border border-brand/25 bg-brand/5 px-4 py-4">
          <p className="text-sm font-medium text-brand">
            Invitations for you ({incoming.length})
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {incoming.map((row) => (
              <li key={row.id} className="flex items-center gap-3">
                <Avatar
                  name={row.counterpart.displayName}
                  avatarUrl={row.counterpart.avatarUrl}
                  size={36}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-neutral-900">
                  {row.counterpart.displayName}
                </span>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => void respondTo(row.id, "accept")}
                  className={APP_PRIMARY_BUTTON}
                >
                  {busyId === `accept:${row.id}` ? "Joining…" : "Accept"}
                </button>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => void respondTo(row.id, "decline")}
                  className={APP_SECONDARY_BUTTON}
                >
                  Decline
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {outgoing.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-neutral-900">
            Waiting for reply ({outgoing.length})
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {outgoing.map((row) => (
              <li key={row.id} className="flex items-center gap-3 text-sm">
                <Avatar
                  name={row.counterpart.displayName}
                  avatarUrl={row.counterpart.avatarUrl}
                  size={32}
                />
                <span className="min-w-0 flex-1 truncate text-neutral-600">
                  {row.counterpart.displayName}
                </span>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => void cancelInvite(row.id)}
                  className={APP_SECONDARY_BUTTON}
                >
                  {busyId === `cancel:${row.id}` ? "Cancelling…" : "Undo"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5">
        {!loaded ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No one else is searching right now. Stay in auto-match above and
            you&apos;ll pair automatically when someone arrives.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {users.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2.5"
              >
                <Avatar
                  name={person.displayName}
                  avatarUrl={person.avatarUrl}
                  size={36}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-neutral-900">
                    {person.displayName}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    waiting {formatWait(person.waitSeconds)}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => void sendInvite(person.id)}
                  className={APP_SECONDARY_BUTTON}
                >
                  {busyId === `invite:${person.id}` ? "Sending…" : "Invite"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {notice ? (
        <p role="status" className="mt-4 text-sm text-brand">
          {notice}
        </p>
      ) : null}
      {readyRoomId ? (
        <div className="mt-4">
          <Link href={`/app/room/${readyRoomId}`} className={APP_PRIMARY_BUTTON}>
            Open study room
          </Link>
        </div>
      ) : null}
    </section>
  );
}
