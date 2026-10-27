import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { APP_SURFACE_HOVER, APP_SURFACE_PAGE } from "@/components/app/appTheme";

/**
 * Room chat panel: plain text + emoji, coordination only. Deliberately not a
 * messaging platform — no threads, replies, or attachments. Sent messages sit
 * right in brand blue; received messages sit left on white. The input footer
 * is a separate white band so the composer reads as part of the same system.
 */
export function RoomChat({
  messages,
  busy,
  onSend,
  onClose,
}: {
  messages: Array<{
    id: string;
    text: string;
    senderName: string;
    self: boolean;
    createdAt: string;
  }>;
  busy: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  function send(): void {
    const clean = draft.trim();
    if (!clean) return;
    onSend(clean);
    setDraft("");
  }

  return (
    <section aria-label="Room chat" className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <p className="text-xs font-normal tracking-[0.18em] text-ink uppercase">Chat</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className={`flex size-8 cursor-pointer items-center justify-center rounded-lg text-neutral-500 transition-colors hover:text-ink ${APP_SURFACE_HOVER}`}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div
        role="log"
        aria-live="polite"
        aria-label="Study room messages"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <p className="text-sm leading-relaxed font-normal text-neutral-500">
            Say hello — coordinate focus blocks, breaks, and what&apos;s next.
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex flex-col ${message.self ? "items-end" : "items-start"}`}>
              <p className="text-xs font-normal text-neutral-500">
                {message.self ? "You" : message.senderName}
              </p>
              <p
                className={`mt-1 max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed font-normal break-words ${
                  message.self
                    ? "rounded-2xl rounded-br-md bg-brand text-white"
                    : "rounded-2xl rounded-bl-md border border-neutral-200 bg-white text-ink"
                }`}
              >
                {message.text}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
      <div className="flex items-center gap-2 border-t border-neutral-200 bg-white p-3">
        <input
          type="text"
          value={draft}
          maxLength={500}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
          placeholder="Message your companion…"
          aria-label="Send a chat message"
          className={`min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-ink outline-none placeholder:text-neutral-500 focus:border-brand focus:ring-2 focus:ring-brand/20 ${APP_SURFACE_PAGE}`}
        />
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={send}
          className="shrink-0 cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-normal text-ink uppercase transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
        >
          Send
        </button>
      </div>
    </section>
  );
}
