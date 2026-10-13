"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/clientFetch";
import { APP_LIME_BADGE } from "@/components/app/appTheme";
import { APP_PRIMARY_BUTTON } from "@/components/app/appTheme";
import { APP_SECONDARY_BUTTON } from "@/components/app/appTheme";

type FinderState =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "searching"; position: number; waitSeconds: number }
  | { kind: "matched"; roomId: string; partnerName: string }
  | { kind: "error"; message: string };

type MatchApiBody = {
  status?: string;
  roomId?: string | null;
  queueEntryId?: string;
  position?: number;
  waitSeconds?: number;
  expiresAt?: string;
  error?: string;
  code?: string;
  fields?: Record<string, string | undefined>;
};

type RoomApiBody = {
  room?: { id: string; partner: { displayName: string } } | null;
};

function roomIdFrom(body: MatchApiBody): string | null {
  if (typeof body.roomId === "string" && body.roomId) return body.roomId;
  const viaFields = body.fields?.roomId;
  return typeof viaFields === "string" && viaFields ? viaFields : null;
}

const POLL_MS = 3000;

function formatWait(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

async function readMatchBody(response: Response): Promise<MatchApiBody> {
  try {
    return (await response.json()) as MatchApiBody;
  } catch {
    return {};
  }
}

function searchingFrom(body: MatchApiBody): FinderState | null {
  if (body.status !== "searching") return null;
  return {
    kind: "searching",
    position: typeof body.position === "number" ? body.position : 1,
    waitSeconds: typeof body.waitSeconds === "number" ? body.waitSeconds : 0,
  };
}
export default function MatchFinder() {
  const [state, setState] = useState<FinderState>({ kind: "idle" });
  const [cancelling, setCancelling] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<FinderState>({ kind: "idle" });
  // Monotonic poll sequence: a stale in-flight /api/match/status response
  // must never overwrite a newer state (invariant 7 — a matched client stays
  // matched, and a fresh searching state wins over an older one).
  const pollSeq = useRef(0);
  // Consecutive "no entry, no room" polls while searching. One miss can be a
  // mid-commit visibility gap — only go idle after two in a row.
  const idleMisses = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(
    () => () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    },
    []
  );

  function schedulePoll(delay: number): void {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = setTimeout(() => {
      void pollOnce();
    }, delay);
  }

  /**
   * Shows the matched card instead of navigating. Nothing on this page moves
   * the student into a room without an explicit click (no auto-connect):
   * opening the room is always a deliberate "Open study room" press.
   */
  async function showMatched(roomId: string): Promise<void> {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    let partnerName = "your study partner";
    const response = await apiFetch(
      `/api/match/room?roomId=${encodeURIComponent(roomId)}`
    ).catch(() => null);
    if (response?.ok) {
      try {
        const body = (await response.json()) as RoomApiBody;
        const name = body.room?.partner.displayName?.trim();
        if (name) partnerName = name;
      } catch {
        // Preview is best-effort; the card works without the name.
      }
    }
    setState({ kind: "matched", roomId, partnerName });
  }

  async function pollOnce(): Promise<void> {
    const seq = ++pollSeq.current;
    const response = await apiFetch("/api/match/status").catch(() => null);
    // Stale response: a newer poll already happened.
    if (seq !== pollSeq.current) return;
    // Never leave the matched card: opening the room is an explicit click,
    // so a late searching response must not overwrite it.
    if (stateRef.current.kind === "matched") return;
    if (!response) return;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "5");
      const wait = Number.isFinite(retryAfter) ? Math.max(1, retryAfter) : 5;
      schedulePoll(wait * 1000);
      return;
    }
    const body = await readMatchBody(response);
    if (!response.ok) {
      if (stateRef.current.kind === "searching") {
        schedulePoll(POLL_MS);
        return;
      }
      setState({
        kind: "error",
        message: body.error ?? "Could not check matching status.",
      });
      return;
    }
    if (body.status === "matched" && body.roomId) {
      await showMatched(body.roomId);
      return;
    }
    const searching = searchingFrom(body);
    if (searching) {
      idleMisses.current = 0;
      setState(searching);
      schedulePoll(POLL_MS);
      return;
    }
    if (stateRef.current.kind === "searching") {
      // No entry found and no room: stay searching on a transient miss
      // (e.g. mid-commit visibility gap) instead of dropping to idle, which
      // would invite a duplicate re-join. Idle only after the server says so
      // twice in a row — and never leave matched.
      idleMisses.current += 1;
      if (idleMisses.current >= 2) setState({ kind: "idle" });
      else schedulePoll(POLL_MS);
    }
  }

  async function startSearching(): Promise<void> {
    setState({ kind: "starting" });
    const response = await apiFetch("/api/match/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => null);
    if (!response) {
      setState({ kind: "error", message: "Could not reach the server." });
      return;
    }
    const body = await readMatchBody(response);
    if (response.status === 409) {
      // Already in a room (ACTIVE_ROOM_EXISTS carries roomId top-level or in
      // fields): show the matched card instead of navigating away.
      const existingRoom = roomIdFrom(body);
      if (existingRoom) {
        await showMatched(existingRoom);
        return;
      }
    }
    if (!response.ok) {
      setState({
        kind: "error",
        message: body.error ?? "Could not start searching.",
      });
      return;
    }
    if (body.status === "matched" && body.roomId) {
      await showMatched(body.roomId);
      return;
    }
    const searching = searchingFrom(body);
    if (searching) {
      setState(searching);
      schedulePoll(POLL_MS);
      return;
    }
    setState({ kind: "error", message: "Unexpected response. Try again." });
  }

  async function cancelSearching(): Promise<void> {
    setCancelling(true);
    try {
      const response = await apiFetch("/api/match/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => null);
      if (pollTimer.current) clearTimeout(pollTimer.current);
      if (!response) {
        setState({ kind: "idle" });
        return;
      }
      const body = await readMatchBody(response);
      if (body.status === "matched" && body.roomId) {
        await showMatched(body.roomId);
        return;
      }
      setState({ kind: "idle" });
    } finally {
      setCancelling(false);
    }
  }

  async function leaveAndReset(): Promise<void> {
    setLeaving(true);
    try {
      await apiFetch("/api/match/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => null);
      setState({ kind: "idle" });
    } finally {
      setLeaving(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const response = await apiFetch("/api/match/status").catch(() => null);
      if (!alive || !response || !response.ok) return;
      const body = await readMatchBody(response);
      if (body.status === "matched" && body.roomId) {
        // Returning visitor with an active room: show the card, do not
        // navigate — opening the room stays an explicit click.
        if (!alive) return;
        await showMatched(body.roomId);
        return;
      }
      const searching = searchingFrom(body);
      if (searching) {
        setState(searching);
        schedulePoll(POLL_MS);
      }
    })();
    return () => {
      alive = false;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (stateRef.current.kind === "searching" && !pollTimer.current) {
        void pollOnce();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl text-neutral-900">Find a Study Partner</h1>
        <span className={APP_LIME_BADGE}>Auto-match</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Enter the queue and we will pair you with the student who has been
        waiting longest. Prefer choosing yourself? Pick someone from the
        available list below instead.
      </p>
      {state.kind === "idle" ? (
        <button type="button" onClick={() => void startSearching()} className={`mt-6 ${APP_PRIMARY_BUTTON}`}>
          Match me automatically
        </button>
      ) : null}
      {state.kind === "starting" ? (
        <p role="status" className="mt-6 text-sm text-neutral-600">Joining the queue…</p>
      ) : null}
      {state.kind === "searching" ? (
        <div className="mt-6 rounded-xl border border-brand/25 bg-brand/5 px-4 py-4">
          <p role="status" className="flex items-center gap-2 text-sm font-medium text-brand">
            <span aria-hidden="true" className="inline-block size-2.5 animate-ping rounded-full bg-brand" />
            Searching for your study partner…
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            Position {state.position} in queue · waiting {formatWait(state.waitSeconds)}
          </p>
          <button
            type="button"
            onClick={() => void cancelSearching()}
            disabled={cancelling}
            className={`mt-4 ${APP_SECONDARY_BUTTON}`}
          >
            {cancelling ? "Cancelling…" : "Cancel search"}
          </button>
        </div>
      ) : null}
      {state.kind === "matched" ? (
        <div className="mt-6 rounded-xl border border-brand/25 bg-brand/5 px-4 py-4">
          <p role="status" className="text-sm font-medium text-brand">
            You&apos;re paired with {state.partnerName}.
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Nothing opened automatically — open your study room when ready, or
            leave it to find someone else.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href={`/app/room/${state.roomId}`} className={APP_PRIMARY_BUTTON}>
              Open study room
            </Link>
            <button
              type="button"
              onClick={() => void leaveAndReset()}
              disabled={leaving}
              className={APP_SECONDARY_BUTTON}
            >
              {leaving ? "Leaving…" : "Leave & find someone else"}
            </button>
          </div>
        </div>
      ) : null}
      {state.kind === "error" ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p role="alert" className="text-sm text-red-700">{state.message}</p>
          <button type="button" onClick={() => void startSearching()} className={`mt-3 ${APP_PRIMARY_BUTTON}`}>
            Try again
          </button>
        </div>
      ) : null}
    </section>
  );
}
