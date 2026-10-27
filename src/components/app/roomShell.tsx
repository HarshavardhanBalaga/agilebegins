"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import type { RoomMemberView } from "@/services/roomService";
import { formatElapsed, presenceLabel } from "@/components/app/roomParts";
import { APP_SURFACE_HOVER, APP_SURFACE_PAGE } from "@/components/app/appTheme";
import { ROOM_SIDES_HINT_STORAGE_KEY } from "@/lib/constants";

/**
 * Room chrome. The header carries only session information and Leave Room.
 * Tools (left) and Chat (right) open from matching edge tabs so the centre
 * stays clear for the timer. Panels sit on the light surface token with a
 * white header and content area for depth; brand marks the selected tool.
 */

/** Which first-visit side-tab cues this browser has already dismissed. */
export type RoomSidesSeen = { tools: boolean; chat: boolean; hint: boolean };

/** Used as the initial state so nothing flashes before storage is read on mount. */
export const ROOM_SIDES_HIDDEN: RoomSidesSeen = { tools: true, chat: true, hint: true };

/** Storage is optional and per browser: if it fails, the cues simply show again. */
export function readSidesSeen(): RoomSidesSeen {
  const fresh: RoomSidesSeen = { tools: false, chat: false, hint: false };
  try {
    const raw = window.localStorage.getItem(ROOM_SIDES_HINT_STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<RoomSidesSeen>;
    return { tools: parsed.tools === true, chat: parsed.chat === true, hint: parsed.hint === true };
  } catch {
    return fresh;
  }
}

export function writeSidesSeen(value: RoomSidesSeen): void {
  try {
    window.localStorage.setItem(ROOM_SIDES_HINT_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage unavailable (private window, blocked site data): cues show next visit.
  }
}

export function RoomTopBar({
  partner,
  self,
  elapsedSec,
  leaving,
  onLeave,
  safety,
}: {
  partner: RoomMemberView | null;
  self: RoomMemberView | null;
  elapsedSec: number;
  leaving: boolean;
  onLeave: () => void;
  safety: ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-3 sm:px-5">
      <button
        type="button"
        onClick={onLeave}
        disabled={leaving}
        className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-normal text-ink transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${APP_SURFACE_HOVER}`}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {leaving ? "Leaving…" : "Leave room"}
      </button>
      <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-neutral-200 sm:block" />
      <p className="min-w-0 truncate text-sm font-normal text-neutral-500">
        {partner ? (
          <>
            In room with <span className="text-brand">{partner.displayName}</span>
          </>
        ) : (
          "Waiting for your companion…"
        )}
      </p>
      <div className="ml-auto flex shrink-0 items-center gap-3 text-sm font-normal text-neutral-500 sm:gap-4">
        <span className="hidden items-center gap-2 sm:inline-flex">
          <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
          Live
          <span aria-hidden="true" className="text-neutral-300">·</span>
          <span className="text-ink">{self ? presenceLabel(self.presence) : "Studying"}</span>
        </span>
        <span aria-label="Session duration" className="tabular-nums text-ink">
          {formatElapsed(elapsedSec)}
        </span>
        {safety}
      </div>
    </header>
  );
}

/** Narrow full-height tab on a viewport edge. Same treatment on both sides. */
export function RoomEdgeTab({
  side,
  label,
  open,
  hint,
  onToggle,
}: {
  side: "left" | "right";
  label: string;
  open: boolean;
  /** First-visit cue: a single small lime dot until the panel is opened once. */
  hint: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`relative flex w-11 shrink-0 cursor-pointer items-center justify-center border-neutral-200 text-xs font-normal tracking-[0.18em] uppercase transition-colors hover:text-ink ${
        side === "left" ? "border-r" : "border-l"
      } ${open ? `${APP_SURFACE_PAGE} text-ink` : `bg-white text-neutral-500 ${APP_SURFACE_HOVER}`}`}
    >
      {open ? (
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 w-0.5 bg-ink ${side === "left" ? "right-0" : "left-0"}`}
        />
      ) : null}
      {hint ? (
        <span
          aria-hidden="true"
          className="absolute top-3 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-accent ring-1 ring-ink"
        />
      ) : null}
      <span className="[writing-mode:vertical-rl]">{label}</span>
    </button>
  );
}

export type RoomToolTab = "goals" | "tasks" | "participants" | "session";

const TOOL_TABS: Array<{ id: RoomToolTab; label: string }> = [
  { id: "goals", label: "Goals" },
  { id: "tasks", label: "Tasks" },
  { id: "participants", label: "Participants" },
  { id: "session", label: "Session" },
];

/**
 * Left workspace drawer. A quiet vertical list picks the tool; the selected
 * tool shows as a white row with a brand marker. Its content sits on white
 * below the list, so navigation and content read as two levels.
 */
export function RoomSidebar({
  open,
  onClose,
  panels,
}: {
  open: boolean;
  onClose: () => void;
  panels: Record<RoomToolTab, ReactNode>;
}) {
  const [tab, setTab] = useState<RoomToolTab>("tasks");
  if (!open) return null;
  return (
    <aside
      aria-label="Tools"
      className={`absolute inset-y-0 left-11 z-30 flex w-72 max-w-[calc(100%-2.75rem)] flex-col border-r border-neutral-200 ${APP_SURFACE_PAGE} lg:static lg:z-auto`}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 bg-white pr-2 pl-4">
        <p className="text-xs font-normal tracking-[0.18em] text-ink uppercase">Tools</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tools"
          className={`flex size-8 cursor-pointer items-center justify-center rounded-lg text-neutral-500 transition-colors hover:text-ink ${APP_SURFACE_HOVER}`}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <nav aria-label="Room tools" className="flex shrink-0 flex-col gap-0.5 border-b border-neutral-200 p-2">
        {TOOL_TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setTab(item.id)}
              className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selected
                  ? "border border-neutral-200 bg-white font-medium text-ink"
                  : "border border-transparent font-normal text-neutral-500 hover:text-ink"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-4 w-0.5 rounded-full ${selected ? "bg-brand" : "bg-transparent"}`}
              />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4">{panels[tab]}</div>
    </aside>
  );
}

/** Session tab content: room-level facts at a glance. */
export function SessionDetails({
  elapsedSec,
  self,
  partner,
}: {
  elapsedSec: number;
  self: RoomMemberView | null;
  partner: RoomMemberView | null;
}) {
  const rows = [
    { label: "Status", value: "Live" },
    { label: "Time in room", value: formatElapsed(elapsedSec) },
    { label: "Your status", value: self ? presenceLabel(self.presence) : "—" },
    {
      label: "Companion",
      value: partner ? (partner.online ? presenceLabel(partner.presence) : "Offline") : "Waiting",
    },
  ];
  return (
    <section aria-label="Session details">
      <p className="text-xs font-normal tracking-[0.18em] text-ink uppercase">Session</p>
      <dl className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3 text-sm">
            <dt className="text-neutral-500">{row.label}</dt>
            <dd className="text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
