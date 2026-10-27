"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/clientFetch";
import { ROOM_POLL_MS } from "@/lib/constants";
import type {
  RoomStateView,
  RoomSummaryView,
} from "@/services/roomService";
import { PartnerPresence } from "@/components/app/roomParts";
import { GoalEditor, FocusTimer, PresenceControls } from "@/components/app/roomFocus";
import { TaskList } from "@/components/app/roomTasks";
import { RoomChat } from "@/components/app/roomChat";
import { SafetyMenu } from "@/components/app/roomSafety";
import { SessionComplete, PartnerLeft } from "@/components/app/roomComplete";
import {
  ROOM_SIDES_HIDDEN,
  RoomEdgeTab,
  RoomSidebar,
  RoomTopBar,
  SessionDetails,
  readSidesSeen,
  writeSidesSeen,
  type RoomSidesSeen,
} from "@/components/app/roomShell";
import { APP_SURFACE_PAGE } from "@/components/app/appTheme";

/** Room text uses the app typeface; the room has no site chrome around it. */
const ROOM_FRAME = "font-[family-name:var(--font-cal-sans)] bg-white text-neutral-900";

type RoomScreen =
  | { kind: "loading" }
  | { kind: "active" }
  | { kind: "complete"; summary: RoomSummaryView }
  | { kind: "partnerLeft" }
  | { kind: "error"; message: string };

type RoomApiBody = {
  roomId?: string;
  status?: string;
  members?: RoomStateView["members"];
  timer?: RoomStateView["timer"];
  tasks?: RoomStateView["tasks"];
  messages?: RoomStateView["messages"];
  elapsedSec?: number;
  createdAt?: string;
  reported?: boolean;
  durationMin?: number;
  focusSec?: number;
  tasksCompleted?: number;
  messagesExchanged?: number;
  closedAt?: string;
  closedBySelf?: boolean;
  error?: string;
};

function isRoomState(body: RoomApiBody): body is RoomApiBody & RoomStateView {
  return (
    typeof body.roomId === "string" &&
    Array.isArray(body.members) &&
    !!body.timer &&
    Array.isArray(body.tasks) &&
    Array.isArray(body.messages)
  );
}

async function readBody(response: Response): Promise<RoomApiBody> {
  try {
    return (await response.json()) as RoomApiBody;
  } catch {
    return {};
  }
}

async function postAction(roomId: string, action: string, payload?: Record<string, unknown>): Promise<Response | null> {
  return apiFetch(`/api/room/${encodeURIComponent(roomId)}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  }).catch(() => null);
}

/**
 * Client shell for the co-study room MVP. Polls `GET /api/room/[id]/state`
 * every 3s (heartbeat + full snapshot) and drives goal / presence / timer /
 * tasks / chat / safety actions. The staying partner learns about a close
 * via the poll; leaving/blocking loads the completion summary.
 */
export default function RoomView({ roomId }: { roomId: string }) {
  const [screen, setScreen] = useState<RoomScreen>({ kind: "loading" });
  const [room, setRoom] = useState<RoomStateView | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidesSeen, setSidesSeen] = useState<RoomSidesSeen>(ROOM_SIDES_HIDDEN);

  // Read the first-visit cues after mount (storage is browser-only).
  useEffect(() => {
    // Syncing from browser storage after mount is the one place this is needed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidesSeen(readSidesSeen());
  }, []);

  /** Opening a side panel retires its cue and the shared hint for good. */
  function markSidesSeen(patch: Partial<RoomSidesSeen>): void {
    setSidesSeen((current) => {
      const next = { ...current, ...patch };
      writeSidesSeen(next);
      return next;
    });
  }
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenRef = useRef<RoomScreen>({ kind: "loading" });
  // Monotonic poll sequence: a stale in-flight state response must never
  // overwrite a newer snapshot (or a completion screen).
  const pollSeq = useRef(0);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

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
    if (screenRef.current.kind !== "active" && screenRef.current.kind !== "loading") return;
    const seq = ++pollSeq.current;
    const response = await apiFetch(`/api/room/${encodeURIComponent(roomId)}/state`).catch(() => null);
    if (seq !== pollSeq.current) return;
    if (screenRef.current.kind !== "active" && screenRef.current.kind !== "loading") return;
    if (!response) {
      schedulePoll(ROOM_POLL_MS);
      return;
    }
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "5");
      const wait = Number.isFinite(retryAfter) ? Math.max(1, retryAfter) : 5;
      schedulePoll(wait * 1000);
      return;
    }
    if (response.status === 404) {
      if (pollTimer.current) clearTimeout(pollTimer.current);
      void showClosed();
      return;
    }
    const body = await readBody(response);
    if (!response.ok || !isRoomState(body)) {
      schedulePoll(ROOM_POLL_MS);
      return;
    }
    setRoom(body as RoomStateView);
    setScreen({ kind: "active" });
    schedulePoll(ROOM_POLL_MS);
  }

  async function showClosed(): Promise<void> {
    const summaryRes = await apiFetch(`/api/room/${encodeURIComponent(roomId)}/summary`).catch(() => null);
    if (summaryRes?.ok) {
      const body = await readBody(summaryRes);
      if (
        typeof body.durationMin === "number" &&
        typeof body.focusSec === "number" &&
        typeof body.tasksCompleted === "number" &&
        typeof body.messagesExchanged === "number" &&
        typeof body.closedAt === "string" &&
        typeof body.closedBySelf === "boolean"
      ) {
        setScreen({
          kind: "complete",
          summary: {
            durationMin: body.durationMin,
            focusSec: body.focusSec,
            tasksCompleted: body.tasksCompleted,
            messagesExchanged: body.messagesExchanged,
            closedAt: body.closedAt,
            closedBySelf: body.closedBySelf,
          },
        });
        return;
      }
    }
    setScreen({ kind: "partnerLeft" });
  }

  useEffect(() => {
    schedulePoll(0);
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  /** Runs a room action, swaps in the fresh state, surfaces errors inline. */
  async function runAction(action: string, payload?: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    setNotice(null);
    const response = await postAction(roomId, action, payload);
    if (!response) {
      setNotice("Could not reach the server. Try again.");
      setBusy(false);
      return false;
    }
    if (response.status === 429) {
      setNotice("Too many requests — slow down and try again.");
      setBusy(false);
      return false;
    }
    const body = await readBody(response);
    if (response.status === 404) {
      if (pollTimer.current) clearTimeout(pollTimer.current);
      await showClosed();
      setBusy(false);
      return false;
    }
    if (!response.ok || !isRoomState(body)) {
      setNotice(body.error ?? "Something went wrong. Try again.");
      setBusy(false);
      return false;
    }
    setRoom(body as RoomStateView);
    setBusy(false);
    return true;
  }

  async function leaveRoom(): Promise<void> {
    if (leaving) return;
    setLeaving(true);
    if (pollTimer.current) clearTimeout(pollTimer.current);
    const response = await apiFetch("/api/match/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    }).catch(() => null);
    if (!response) {
      setNotice("Could not reach the server. Try again.");
      setLeaving(false);
      schedulePoll(ROOM_POLL_MS);
      return;
    }
    if (response.ok || response.status === 404) {
      await showClosed();
      setLeaving(false);
      return;
    }
    const body = await readBody(response);
    setNotice(body.error ?? "Could not leave the room. Try again.");
    setLeaving(false);
    schedulePoll(ROOM_POLL_MS);
  }

  async function blockCompanion(): Promise<void> {
    setBusy(true);
    const response = await postAction(roomId, "block");
    if (!response) {
      setNotice("Could not reach the server. Try again.");
      setBusy(false);
      return;
    }
    if (response.ok || response.status === 404) {
      await showClosed();
      setBusy(false);
      return;
    }
    const body = await readBody(response);
    setNotice(body.error ?? "Could not block. Try again.");
    setBusy(false);
  }

  if (screen.kind === "loading") {
    return (
      <main className={`flex min-h-dvh flex-col items-center justify-center px-4 py-16 sm:px-6 ${ROOM_FRAME}`}>
        <p className="inline-flex items-center gap-2 text-xs font-normal tracking-[0.18em] text-brand uppercase">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent ring-1 ring-neutral-900" />
          Live together
        </p>
        <h1 className="mt-4 max-w-[20ch] text-4xl leading-[1.05] font-normal text-balance text-neutral-900 sm:text-5xl">
          Study Room
        </h1>
        <p role="status" className="mt-5 flex items-center gap-2.5 text-base leading-relaxed text-neutral-500">
          <span aria-hidden="true" className="inline-block size-2 animate-ping rounded-full bg-brand" />
          Opening your study room…
        </p>
      </main>
    );
  }

  if (screen.kind === "error") {
    return (
      <main className={`flex min-h-dvh flex-col items-center justify-center px-4 py-16 sm:px-6 ${ROOM_FRAME}`}>
        <p role="alert" className="text-base leading-relaxed text-red-700">
          {screen.message}
        </p>
      </main>
    );
  }

  if (screen.kind === "complete") {
    return (
      <main className={`flex min-h-dvh flex-col items-center justify-center px-4 py-16 sm:px-6 ${ROOM_FRAME}`}>
        <SessionComplete summary={screen.summary} />
      </main>
    );
  }

  if (screen.kind === "partnerLeft") {
    return (
      <main className={`flex min-h-dvh flex-col items-center justify-center px-4 py-16 sm:px-6 ${ROOM_FRAME}`}>
        <PartnerLeft />
      </main>
    );
  }

  const self = room?.members.find((member) => member.self) ?? null;
  const partner = room?.members.find((member) => !member.self) ?? null;
  const elapsedSec = room?.elapsedSec ?? 0;

  return (
    <div className={`flex h-dvh flex-col overflow-hidden ${ROOM_FRAME}`}>
      <RoomTopBar
        partner={partner}
        self={self}
        elapsedSec={elapsedSec}
        leaving={leaving}
        onLeave={() => void leaveRoom()}
        safety={
          <SafetyMenu
            busy={busy || leaving}
            onReport={(reason) => void runAction("report", { reason })}
            onBlock={() => void blockCompanion()}
            onLeave={() => void leaveRoom()}
          />
        }
      />

      {notice ? (
        <p role="alert" className="shrink-0 border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700">
          {notice}
        </p>
      ) : null}

      <div className="relative flex min-h-0 flex-1">
        <RoomEdgeTab
          side="left"
          label="Tools"
          hint={!sidesSeen.tools}
          open={toolsOpen}
          onToggle={() => {
            if (!toolsOpen) markSidesSeen({ tools: true, hint: true });
            setToolsOpen((value) => !value);
          }}
        />
        <RoomSidebar
          open={toolsOpen}
          onClose={() => setToolsOpen(false)}
          panels={{
            tasks: (
              <TaskList
                tasks={room?.tasks ?? []}
                busy={busy}
                onAdd={(text) => void runAction("tasks", { text })}
                onToggle={(id, completed) => void toggleTask(id, completed)}
              />
            ),
            goals: (
              <GoalEditor
                key={self?.goal ?? ""}
                initial={self?.goal ?? ""}
                saving={busy}
                onSave={(goal) => void runAction("goal", { goal })}
              />
            ),
            participants: (
              <div className="flex flex-col gap-10">
                <PartnerPresence partner={partner} />
                <PresenceControls
                  current={self?.presence ?? "studying"}
                  busy={busy}
                  onSelect={(presence) => void runAction("status", { presence })}
                />
              </div>
            ),
            session: <SessionDetails elapsedSec={elapsedSec} self={self} partner={partner} />,
          }}
        />

        <section
          aria-label="Study session"
          className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12"
        >
          {room ? (
            <FocusTimer
              timer={room.timer}
              busy={busy}
              onAction={(action, phase) =>
                void runAction("timer", phase ? { action, phase } : { action })
              }
              onSetDuration={(durationSec) => void runAction("timer", { action: "set", durationSec })}
            />
          ) : null}
          {!sidesSeen.hint ? (
            <div
              role="note"
              className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-3 text-xs font-normal text-neutral-500"
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent ring-1 ring-ink" />
              <span>Tools and chat are available on the sides.</span>
              <button
                type="button"
                onClick={() => markSidesSeen({ hint: true })}
                className="cursor-pointer underline underline-offset-4 transition-colors hover:text-ink"
              >
                Got it
              </button>
            </div>
          ) : null}
        </section>

        {chatOpen ? (
          <aside
            aria-label="Chat panel"
            className={`absolute inset-y-0 right-11 z-30 flex w-80 max-w-[calc(100%-2.75rem)] flex-col border-l border-neutral-200 ${APP_SURFACE_PAGE} lg:static lg:z-auto`}
          >
            <RoomChat
              messages={room?.messages ?? []}
              busy={busy}
              onSend={(text) => void runAction("messages", { text })}
              onClose={() => setChatOpen(false)}
            />
          </aside>
        ) : null}

        <RoomEdgeTab
          side="right"
          label="Chat"
          hint={!sidesSeen.chat}
          open={chatOpen}
          onToggle={() => {
            if (!chatOpen) markSidesSeen({ chat: true, hint: true });
            setChatOpen((value) => !value);
          }}
        />
      </div>
    </div>
  );

  async function toggleTask(id: string, completed: boolean): Promise<void> {
    setBusy(true);
    setNotice(null);
    const response = await apiFetch(
      `/api/room/${encodeURIComponent(roomId)}/tasks/toggle`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: id, completed }),
      }
    ).catch(() => null);
    if (!response) {
      setNotice("Could not reach the server. Try again.");
      setBusy(false);
      return;
    }
    const body = await readBody(response);
    if (!response.ok || !isRoomState(body)) {
      setNotice(body.error ?? "Could not update the task. Try again.");
      setBusy(false);
      return;
    }
    setRoom(body as RoomStateView);
    setBusy(false);
  }
}
