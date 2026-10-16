import { useState } from "react";
import { ArrowRight } from "lucide-react";
import RollingText from "@/components/RollingText";

/**
 * Session goal: one lightweight input ("What are you working on?").
 * Accountability, not project management.
 */
export function GoalEditor({
  initial,
  saving,
  onSave,
}: {
  initial: string;
  saving: boolean;
  onSave: (goal: string) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(initial.trim().length === 0);
  const dirty = draft.trim() !== initial.trim();

  if (!editing) {
    return (
      <section aria-label="Your session goal">
        <p className="text-xs font-normal tracking-[0.18em] text-neutral-900 uppercase">
          Your intention
        </p>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <p className="max-w-[52ch] text-base leading-relaxed font-normal text-neutral-900">
            {initial || "No goal set yet."}
          </p>
          <button
            type="button"
            onClick={() => {
              setDraft(initial);
              setEditing(true);
            }}
            className="cursor-pointer rounded-lg px-2 py-1 text-sm font-normal text-brand underline underline-offset-4 transition-colors hover:text-neutral-900"
          >
            {initial ? "Edit" : "Set a goal"}
          </button>
        </div>
      </section>
    );
  }
  return (
    <section aria-label="Your session goal">
      <label
        htmlFor="room-goal"
        className="text-xs font-normal tracking-[0.18em] text-neutral-900 uppercase"
      >
        What are you working on?
      </label>
      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
        <input
          id="room-goal"
          type="text"
          value={draft}
          maxLength={140}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Finish React authentication implementation"
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={() => {
            onSave(draft.trim());
            setEditing(false);
          }}
          className="group inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-lg border-2 border-neutral-900 bg-accent py-1.5 pr-2.5 pl-4 shadow-[4px_4px_0_0_#111111] transition-all duration-200 hover:bg-neutral-900 hover:shadow-[0px_0px_0_0_#111111] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="leading-none font-normal whitespace-nowrap text-neutral-900 uppercase text-sm transition-colors duration-300 group-hover:text-white">
            <RollingText text={saving ? "Saving…" : "Set goal"} />
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
      </div>
      {initial && (
        <button
          type="button"
          onClick={() => {
            setDraft(initial);
            setEditing(false);
          }}
          className="mt-2 cursor-pointer text-sm font-normal text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-900"
        >
          Cancel
        </button>
      )}
    </section>
  );
}

/**
 * Shared focus timer: prominent MM:SS + phase, Start/Pause/Resume/Finish.
 * Feels shared ("Rahul started focus"), not a personal stopwatch.
 */
export function FocusTimer({
  timer,
  busy,
  onAction,
}: {
  timer: {
    phase: "idle" | "focus" | "break";
    state: "stopped" | "running" | "paused";
    remainingSec: number;
    updatedByName: string | null;
  };
  busy: boolean;
  onAction: (action: "start" | "pause" | "resume" | "finish", phase?: "focus" | "break") => void;
}) {
  const running = timer.state === "running";
  const paused = timer.state === "paused";
  const phaseLabel = timer.phase === "break" ? "Break" : timer.phase === "focus" ? "Focus" : "Ready";
  const minutes = String(Math.floor(Math.max(0, timer.remainingSec) / 60)).padStart(2, "0");
  const seconds = String(Math.max(0, timer.remainingSec) % 60).padStart(2, "0");
  return (
    <section aria-label="Shared focus timer" className="text-center">
      <p className="text-xs font-normal tracking-[0.18em] text-neutral-900 uppercase">
        Shared timer
      </p>
      <p aria-live="polite" className="mt-3 text-6xl leading-none font-normal tabular-nums text-neutral-900 sm:text-7xl">
        {minutes}:{seconds}
      </p>
      <p className="mt-2 inline-flex items-center gap-2 text-xs font-normal tracking-[0.18em] text-brand uppercase">
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full ${running ? "animate-pulse bg-accent ring-1 ring-neutral-900" : "bg-neutral-300"}`}
        />
        {phaseLabel}
        {running || paused ? ` · ${timer.phase === "break" ? "rest" : "study"} together` : ""}
      </p>
      {timer.updatedByName && timer.phase !== "idle" ? (
        <p className="mt-2 text-sm font-normal text-neutral-500">
          {timer.updatedByName}{" "}
          {timer.state === "paused"
            ? "paused"
            : timer.state === "running"
              ? timer.phase === "break"
                ? "started the break"
                : "started focus"
              : "reset"}{" "}
          the timer
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {!running && !paused ? (
          <TimerIdleButtons busy={busy} onAction={onAction} />
        ) : null}
        {running ? <TimerRunningButtons busy={busy} onAction={onAction} /> : null}
        {paused ? <TimerPausedButtons busy={busy} onAction={onAction} /> : null}
      </div>
    </section>
  );
}

function LimeCta({
  busy,
  label,
  onClick,
}: {
  busy: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="group inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-lg border-2 border-neutral-900 bg-accent py-1.5 pr-2.5 pl-4 shadow-[4px_4px_0_0_#111111] transition-all duration-200 hover:bg-neutral-900 hover:shadow-[0px_0px_0_0_#111111] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="leading-none font-normal whitespace-nowrap text-neutral-900 uppercase text-sm transition-colors duration-300 group-hover:text-white">
        <RollingText text={label} />
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
  );
}

function QuietLink({
  busy,
  label,
  onClick,
}: {
  busy: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="cursor-pointer rounded-lg px-3 py-2 text-sm font-normal text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}

function TimerIdleButtons({
  busy,
  onAction,
}: {
  busy: boolean;
  onAction: (action: "start" | "pause" | "resume" | "finish", phase?: "focus" | "break") => void;
}) {
  return (
    <>
      <LimeCta busy={busy} label="Start focus" onClick={() => onAction("start", "focus")} />
      <button
        type="button"
        disabled={busy}
        onClick={() => onAction("start", "break")}
        className="cursor-pointer rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-normal text-neutral-700 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        Take a break
      </button>
    </>
  );
}

function TimerRunningButtons({
  busy,
  onAction,
}: {
  busy: boolean;
  onAction: (action: "start" | "pause" | "resume" | "finish", phase?: "focus" | "break") => void;
}) {
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => onAction("pause")}
        className="cursor-pointer rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 text-sm font-normal text-neutral-900 uppercase transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        Pause
      </button>
      <QuietLink busy={busy} label="Finish session" onClick={() => onAction("finish")} />
    </>
  );
}

function TimerPausedButtons({
  busy,
  onAction,
}: {
  busy: boolean;
  onAction: (action: "start" | "pause" | "resume" | "finish", phase?: "focus" | "break") => void;
}) {
  return (
    <>
      <LimeCta busy={busy} label="Resume" onClick={() => onAction("resume")} />
      <QuietLink busy={busy} label="Finish session" onClick={() => onAction("finish")} />
    </>
  );
}

/**
 * Presence controls: Studying / On a break / Away — one tap, no messages
 * needed for the companion to know you stepped out.
 */
export function PresenceControls({
  current,
  busy,
  onSelect,
}: {
  current: "studying" | "break" | "away";
  busy: boolean;
  onSelect: (presence: "studying" | "break" | "away") => void;
}) {
  const options = [
    { value: "studying", label: "Studying" },
    { value: "break", label: "On a break" },
    { value: "away", label: "Away" },
  ] as const;
  return (
    <section aria-label="Your status">
      <p className="text-xs font-normal tracking-[0.18em] text-neutral-900 uppercase">
        Your status
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = current === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={busy}
              aria-pressed={selected}
              onClick={() => onSelect(option.value)}
              className={
                selected
                  ? "cursor-pointer rounded-lg border-2 border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-normal text-white disabled:cursor-not-allowed disabled:opacity-60"
                  : "cursor-pointer rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-normal text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

