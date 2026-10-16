import { useEffect, useRef, useState } from "react";

/**
 * Minimal room chat: plain text + emoji, coordination only. Deliberately
 * not a messaging platform — no threads, replies, or attachments.
 */
export function RoomChat({
  messages,
  busy,
  onSend,
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
    <section aria-label="Room chat">
      <p className="text-xs font-normal tracking-[0.18em] text-neutral-900 uppercase">
        Chat
      </p>
      <div
        role="log"
        aria-live="polite"
        aria-label="Study room messages"
        className="mt-3 flex max-h-72 flex-col gap-3 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-4"
      >
        {messages.length === 0 ? (
          <p className="text-sm leading-relaxed font-normal text-neutral-400">
            Say hello — coordinate focus blocks, breaks, and what&apos;s next.
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex flex-col ${message.self ? "items-end" : "items-start"}`}>
              <p className="text-xs font-normal text-neutral-400">
                {message.self ? "You" : message.senderName}
              </p>
              <p
                className={`mt-1 max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed font-normal break-words ${
                  message.self ? "bg-neutral-900 text-white" : "bg-[#F8F8FC] text-neutral-900"
                }`}
              >
                {message.text}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
      <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
        <input
          type="text"
          value={draft}
          maxLength={500}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
          placeholder="Starting my focus session…"
          aria-label="Send a chat message"
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={send}
          className="shrink-0 cursor-pointer rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 text-sm font-normal text-neutral-900 uppercase transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </section>
  );
}

