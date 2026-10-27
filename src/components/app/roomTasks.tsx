import { useState } from "react";

/**
 * Minimal shared tasks: add → checkbox → done. No subtasks, priorities,
 * or boards — just "Today's focus" with both companions' items visible.
 */
export function TaskList({
  tasks,
  busy,
  onAdd,
  onToggle,
}: {
  tasks: Array<{
    id: string;
    text: string;
    completed: boolean;
    completedByName: string | null;
    createdByName: string;
  }>;
  busy: boolean;
  onAdd: (text: string) => void;
  onToggle: (id: string, completed: boolean) => void;
}) {
  const [draft, setDraft] = useState("");
  const open = tasks.filter((task) => !task.completed);
  const done = tasks.filter((task) => task.completed);
  return (
    <section aria-label="Today's focus">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-xs font-normal tracking-[0.18em] text-neutral-900 uppercase">
          Today&apos;s focus
        </p>
        {tasks.length > 0 ? (
          <p className="text-sm font-normal text-neutral-500">
            {done.length}/{tasks.length} done
          </p>
        ) : null}
      </div>
      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
        <input
          type="text"
          value={draft}
          maxLength={120}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && draft.trim()) {
              onAdd(draft.trim());
              setDraft("");
            }
          }}
          placeholder="Add a shared task…"
          aria-label="Add a shared task"
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={() => {
            onAdd(draft.trim());
            setDraft("");
          }}
          className="shrink-0 cursor-pointer rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 text-sm font-normal text-neutral-900 uppercase transition-colors hover:bg-[#F8F8FC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add
        </button>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed font-normal text-neutral-400">
          No tasks yet. Add the first thing you both want to finish today.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
          {[...open, ...done].map((task) => (
            <li key={task.id}>
              <button
                type="button"
                disabled={busy}
                role="checkbox"
                aria-checked={task.completed}
                onClick={() => onToggle(task.id, !task.completed)}
                className="flex w-full cursor-pointer items-start gap-3 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    task.completed ? "border-neutral-900 bg-neutral-900" : "border-neutral-300 bg-white"
                  }`}
                >
                  {task.completed ? (
                    <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M2 6.5 4.8 9 10 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm leading-relaxed font-normal ${
                      task.completed ? "text-neutral-400 line-through" : "text-neutral-900"
                    }`}
                  >
                    {task.text}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-neutral-400">
                    {task.createdByName}
                    {task.completed && task.completedByName ? ` · done by ${task.completedByName}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

