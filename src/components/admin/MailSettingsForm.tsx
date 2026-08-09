"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/clientFetch";

interface MailSettingsFormProps {
  workshop: {
    id: string;
    title: string;
    meetingLink: string;
    whatsappLink: string;
    emailSubject: string;
    emailBody: string;
  };
}

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-accent focus:bg-white/10";

/**
 * Admin form for per-workshop email settings. "Send test email" previews the
 * confirmation template to the admin's address using the entered values
 * (without saving); "Save settings" persists them.
 */
export function MailSettingsForm({ workshop }: MailSettingsFormProps) {
  const [meetingLink, setMeetingLink] = useState(workshop.meetingLink);
  const [whatsappLink, setWhatsappLink] = useState(workshop.whatsappLink);
  const [emailSubject, setEmailSubject] = useState(workshop.emailSubject);
  const [emailBody, setEmailBody] = useState(workshop.emailBody);

  const [notice, setNotice] = useState("");
  const [tone, setTone] = useState<"ok" | "error">("ok");
  const [pending, setPending] = useState<"save" | "test" | null>(null);

  async function submit(sendTest: boolean) {
    setNotice("");
    setPending(sendTest ? "test" : "save");
    try {
      const res = await apiFetch("/api/admin/workshops/mail-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId: workshop.id,
          meetingLink,
          whatsappLink,
          emailSubject,
          emailBody,
          sendTest,
        }),
      });
      const data = (await res.json()) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setTone("error");
        setNotice(data.error ?? "Something went wrong.");
        return;
      }
      setTone("ok");
      setNotice(data.message ?? (sendTest ? "Test email sent." : "Saved."));
    } catch {
      setTone("error");
      setNotice("Unable to reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      className="rounded-2xl border border-white/10 bg-white/5 p-8"
    >
      <div className="space-y-5">
        <Field label="Meeting link">
          <input
            type="url"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="https://meet.example.com/workshop-001"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-white/40">
            Included in the confirmation email. Empty falls back to the default
            meeting link.
          </p>
        </Field>

        <Field label="WhatsApp community link">
          <input
            type="url"
            value={whatsappLink}
            onChange={(e) => setWhatsappLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/…"
            className={inputClass}
          />
        </Field>

        <Field label="Confirmation email subject">
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder={`You're in! ${workshop.title}`}
            maxLength={120}
            className={inputClass}
          />
        </Field>

        <Field label="Custom message (shown in the confirmation email)">
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="A short personal note for students…"
            className={`${inputClass} resize-y`}
          />
        </Field>
      </div>

      {notice ? (
        <p
          className={`mt-5 rounded-xl px-4 py-3 text-sm ${
            tone === "ok"
              ? "bg-white/10 text-white"
              : "bg-red-500/10 text-red-200"
          }`}
        >
          {notice}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={pending !== null}
          className="rounded-full border border-white/20 px-6 py-3 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {pending === "test" ? "Sending…" : "Send test email"}
        </button>
        <button
          type="submit"
          disabled={pending !== null}
          className="rounded-full bg-accent px-8 py-3 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "save" ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
        {label}
      </span>
      {children}
    </label>
  );
}
