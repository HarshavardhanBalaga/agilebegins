"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/clientFetch";
import { APP_SECONDARY_BUTTON } from "@/components/app/appTheme";
import RollingText from "@/components/RollingText";

type FinderState =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "searching"; position: number; waitSeconds: number }
  | { kind: "matched"; roomId: string }
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
  const router = useRouter();
  const [state, setState] = useState<FinderState>({ kind: "idle" });
  const [cancelling, setCancelling] = useState(false);
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

  function openRoom(roomId: string): void {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    setState({ kind: "matched", roomId });
    router.push(`/app/room/${roomId}`);
  }

  async function pollOnce(): Promise<void> {
    const seq = ++pollSeq.current;
    const response = await apiFetch("/api/match/status").catch(() => null);
    // Stale response: a newer poll (or a match navigation) already happened.
    if (seq !== pollSeq.current) return;
    // Never leave the matched state: navigation to the room is terminal.
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
      openRoom(body.roomId);
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
      // fields): preserve the match instead of showing an error.
      const existingRoom = roomIdFrom(body);
      if (existingRoom) {
        openRoom(existingRoom);
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
      openRoom(body.roomId);
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
        openRoom(body.roomId);
        return;
      }
      setState({ kind: "idle" });
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const response = await apiFetch("/api/match/status").catch(() => null);
      if (!alive || !response || !response.ok) return;
      const body = await readMatchBody(response);
      if (body.status === "matched" && body.roomId) {
        openRoom(body.roomId);
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
  }, [router]);

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
    <section aria-label="Companion Mode">
      
      <h1 className="mt-4 max-w-[20ch] text-4xl leading-[1.05] font-normal text-balance text-neutral-900 sm:text-5xl">
        Companion Mode
      </h1>
      <p className="mt-5 max-w-[62ch] text-base leading-relaxed font-normal text-pretty text-neutral-600 sm:text-lg">
        Get matched with another student for a live study session. Join
        the queue, land in a shared room, and study side by side — with
        focus timers and shared tasks on the way.
      </p>
      {state.kind === "idle" ? (
        <button
          type="button"
          onClick={() => void startSearching()}
          className="group mt-8 inline-flex shrink-0 cursor-pointer items-center gap-3.75 rounded-lg border-2 border-neutral-900 bg-accent py-1.5 pr-2.5 pl-5 shadow-[4px_4px_0_0_#111111] transition-all duration-200 hover:bg-neutral-900 hover:shadow-[0px_0px_0_0_#111111]"
        >
          <span className="leading-none font-normal whitespace-nowrap text-neutral-900 uppercase text-sm transition-colors duration-300 group-hover:text-white">
            <RollingText text="Start Matching" />
          </span>
          <span className="flex size-7.5 items-center justify-center rounded-md bg-neutral-900 transition-colors duration-300 group-hover:bg-accent">
            <ArrowRight
              size={16}
              strokeWidth={2.5}
              aria-hidden="true"
              className="text-white transition-all duration-300 group-hover:-rotate-45 group-hover:text-neutral-900"
            />
          </span>
        </button>
      ) : null}
      {state.kind === "starting" ? (
        <p role="status" className="mt-8 text-sm text-neutral-600">Joining the queue…</p>
      ) : null}
      {state.kind === "searching" ? (
        <div className="mt-8">
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
        <p role="status" className="mt-8 text-sm text-brand">
          Partner found — opening your study room…
        </p>
      ) : null}
      {state.kind === "error" ? (
        <div className="mt-8">
          <p role="alert" className="text-sm text-red-700">{state.message}</p>
          <button type="button" onClick={() => void startSearching()} className="group mt-3 inline-flex shrink-0 cursor-pointer items-center gap-3.75 rounded-lg border-2 border-neutral-900 bg-accent py-1.5 pr-2.5 pl-5 transition-all duration-200 hover:bg-neutral-900">
            <span className="leading-none font-normal whitespace-nowrap text-neutral-900 uppercase text-sm transition-colors duration-300 group-hover:text-white">
              Try again
            </span>
            <span className="flex size-7.5 items-center justify-center rounded-md bg-neutral-900 transition-colors duration-300 group-hover:bg-accent">
              <ArrowRight
                size={16}
                strokeWidth={2.5}
                aria-hidden="true"
                className="text-white transition-all duration-300 group-hover:-rotate-45 group-hover:text-neutral-900"
              />
            </span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
