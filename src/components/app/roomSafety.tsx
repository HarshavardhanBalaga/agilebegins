import { useEffect, useRef, useState } from "react";

/**
 * Subtle secondary safety menu: Report / Block / Leave. Quiet by design —
 * a small "More" disclosure, never dominating the room UI.
 */
export function SafetyMenu({
  busy,
  onReport,
  onBlock,
  onLeave,
}: {
  busy: boolean;
  onReport: (reason: string) => void;
  onBlock: () => void;
  onLeave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [reason, setReason] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        setReporting(false);
        setConfirmingBlock(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open ]);

  function close(): void {
    setOpen(false);
    setReporting(false);
    setConfirmingBlock(false);
    setReason("");
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="cursor-pointer rounded-lg px-3 py-2 text-sm font-normal text-neutral-400 underline underline-offset-4 transition-colors hover:text-neutral-900"
      >
        More
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Room safety options"
          className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-[4px_4px_0_0_#111111]"
        >
          {!reporting && !confirmingBlock ? (
            <>
              <MenuItem
                label="Report companion"
                hint="Flag behaviour for review"
                disabled={busy}
                onClick={() => setReporting(true)}
              />
              <MenuItem
                label="Block companion"
                hint="Never match again · leaves room"
                disabled={busy}
                onClick={() => setConfirmingBlock(true)}
              />
              <MenuItem
                label="Leave room"
                hint="End this session"
                disabled={busy}
                onClick={() => {
                  close();
                  onLeave();
                }}
              />
            </>
          ) : null}
          {reporting ? (
            <ReportForm
              busy={busy}
              reason={reason}
              onChange={setReason}
              onBack={() => {
                setReporting(false);
                setReason("");
              }}
              onSubmit={() => {
                onReport(reason.trim());
                close();
              }}
            />
          ) : null}
          {confirmingBlock ? (
            <BlockConfirm
              busy={busy}
              onCancel={() => setConfirmingBlock(false)}
              onConfirm={() => {
                close();
                onBlock();
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  label,
  hint,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#F8F8FC] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="block text-sm font-normal text-neutral-900">{label}</span>
      <span className="mt-0.5 block text-xs font-normal text-neutral-400">{hint}</span>
    </button>
  );
}

function ReportForm({
  busy,
  reason,
  onChange,
  onBack,
  onSubmit,
}: {
  busy: boolean;
  reason: string;
  onChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="p-2">
      <p className="text-sm font-normal text-neutral-900">Report companion</p>
      <p className="mt-1 text-xs leading-relaxed font-normal text-neutral-500">
        Tell us what happened. The room stays open.
      </p>
      <textarea
        value={reason}
        maxLength={500}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Optional — what happened?"
        className="mt-2.5 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <div className="mt-2.5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-normal text-neutral-500 transition-colors hover:text-neutral-900"
        >
          Back
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSubmit}
          className="cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-normal text-white transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send report"}
        </button>
      </div>
    </div>
  );
}

function BlockConfirm({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="p-2">
      <p className="text-sm font-normal text-neutral-900">Block companion?</p>
      <p className="mt-1 text-xs leading-relaxed font-normal text-neutral-500">
        You will leave this room and never be matched with them again.
      </p>
      <div className="mt-2.5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-normal text-neutral-500 transition-colors hover:text-neutral-900"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-normal text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Blocking…" : "Block & leave"}
        </button>
      </div>
    </div>
  );
}

