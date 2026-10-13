"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/clientFetch";
import Avatar from "@/components/app/Avatar";
import {
  APP_LIME_BADGE,
  APP_PRIMARY_BUTTON,
  APP_SECONDARY_BUTTON,
} from "@/components/app/appTheme";

type RoomViewState =
  | { kind: "active" }
  | { kind: "leaving" }
  | { kind: "closed" }
  | { kind: "error"; message: string };

type RoomApiBody = {
  room?: { id: string; status: string } | null;
  closedRoomId?: string | null;
  error?: string;
};

const POLL_MS = 3000;

async function readRoomBody(response: Response): Promise<RoomApiBody> {
  try {
    return (await response.json()) as RoomApiBody;
  } catch {
    return {};
  }
}

/**
 * Client shell for an active study room: polls `GET /api/match/room?roomId=`
 * so the staying partner learns the room was closed, and owns the
 * leave-and-find-new action (`POST /api/match/leave` then `/app/find`).
 */
export default function RoomView({
  roomId,
  partnerName,
  partnerAvatarUrl,
}: {
  roomId: string;
  partnerName: string;
  partnerAvatarUrl?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<RoomViewState>({ kind: "active" });
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<RoomViewState>({ kind: "active" });

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

  async function pollOnce(): Promise<void> {
    if (stateRef.current.kind !== "active") return;
    const response = await apiFetch(
      `/api/match/room?roomId=${encodeURIComponent(roomId)}`
    ).catch(() => null);
    if (stateRef.current.kind !== "active") return;
    if (!response) {
      schedulePoll(POLL_MS);
      return;
    }
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "5");
      const wait = Number.isFinite(retryAfter) ? Math.max(1, retryAfter) : 5;
      schedulePoll(wait * 1000);
      return;
    }
    const body = await readRoomBody(response);
    if (!response.ok) {
      // Transient error: stay active and keep polling (never kick on a blip).
      schedulePoll(POLL_MS);
      return;
    }
    if (body.room && body.room.id === roomId) {
      schedulePoll(POLL_MS);
      return;
    }
    if (body.closedRoomId) {
      if (pollTimer.current) clearTimeout(pollTimer.current);
      setState({ kind: "closed" });
      return;
    }
    // Null/null (unknown/transient): stay active, keep polling. Only an
    // explicit closedRoomId moves the UI to closed.
    schedulePoll(POLL_MS);
  }

  useEffect(() => {
    schedulePoll(POLL_MS);
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function leaveAndFindNew(): Promise<void> {
    if (stateRef.current.kind === "leaving") return;
    setState({ kind: "leaving" });
    if (pollTimer.current) clearTimeout(pollTimer.current);
    const response = await apiFetch("/api/match/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    }).catch(() => null);
    if (!response) {
      setState({
        kind: "error",
        message: "Could not reach the server. Try again.",
      });
      return;
    }
    if (response.ok || response.status === 404) {
      // 404 here means "not your active room" (already closed elsewhere) —
      // either way the caller is free to re-queue.
      router.push("/app/find");
      return;
    }
    const body = await readRoomBody(response);
    setState({
      kind: "error",
      message: body.error ?? "Could not leave the room. Try again.",
    });
  }

  if (state.kind === "closed") {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl text-neutral-900">Room closed</h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          This study room is closed. You can find another partner whenever
          you&apos;re ready.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5 border-t border-neutral-100 pt-6">
          <Link href="/app/find" className={APP_PRIMARY_BUTTON}>
            Find another partner
          </Link>
          <Link href="/app" className={APP_SECONDARY_BUTTON}>
            Back home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl text-neutral-900">Study Room</h1>
        <span className={APP_LIME_BADGE}>Matched</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        You are paired with {partnerName}. Real-time chat, shared tasks, and
        study sessions will live here next.
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-6">
        <Avatar name={partnerName} avatarUrl={partnerAvatarUrl} size={48} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-900">
            {partnerName}
          </p>
          <p className="text-xs text-neutral-500">Your accountability partner</p>
        </div>
      </div>
      {state.kind === "error" ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2.5 border-t border-neutral-100 pt-6">
        <button
          type="button"
          onClick={() => void leaveAndFindNew()}
          disabled={state.kind === "leaving"}
          className={APP_PRIMARY_BUTTON}
        >
          {state.kind === "leaving"
            ? "Leaving…"
            : "Leave & find another partner"}
        </button>
        <Link href="/app" className={APP_SECONDARY_BUTTON}>
          Back home
        </Link>
      </div>
    </section>
  );
}
