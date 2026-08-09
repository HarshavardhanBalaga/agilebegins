"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/clientFetch";

type Stage = "request" | "reset" | "done";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-accent focus:bg-white/10";

/**
 * Client-side forgot-password flow. Step 1 asks for the email and requests
 * an OTP; step 2 asks for the code + new password. The response to step 1 is
 * deliberately generic (no account enumeration).
 */
export function ForgotPasswordForm() {
  const [stage, setStage] = useState<Stage>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [tone, setTone] = useState<"ok" | "error">("ok");
  const [pending, setPending] = useState(false);

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setPending(true);
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setTone("error");
        setNotice(data.error ?? "Something went wrong.");
        return;
      }
      setTone("ok");
      setNotice(data.message ?? "Check your inbox for the code.");
      setStage("reset");
    } catch {
      setTone("error");
      setNotice("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setPending(true);
    try {
      const res = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setTone("error");
        setNotice(data.error ?? "Something went wrong.");
        return;
      }
      setTone("ok");
      setNotice(data.message ?? "Password reset. You can log in now.");
      setStage("done");
    } catch {
      setTone("error");
      setNotice("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-8">
      {stage === "request" ? (
        <form onSubmit={requestCode} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
              autoComplete="email"
              required
              className={inputClass}
            />
          </label>

          {notice ? (
            <p
              className={`rounded-xl px-4 py-3 text-sm ${
                tone === "ok"
                  ? "bg-white/10 text-white"
                  : "bg-red-500/10 text-red-200"
              }`}
            >
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent px-8 py-3.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending code…" : "Send reset code"}
          </button>
        </form>
      ) : null}

      {stage === "reset" ? (
        <form onSubmit={resetPassword} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Reset code
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="1234"
              required
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              New password
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              className={inputClass}
            />
          </label>

          <p className="text-xs leading-relaxed text-white/40">
            The code expires in 10 minutes. It was sent to{" "}
            <span className="font-semibold text-white/70">{email}</span>.
          </p>

          {notice ? (
            <p
              className={`rounded-xl px-4 py-3 text-sm ${
                tone === "ok"
                  ? "bg-white/10 text-white"
                  : "bg-red-500/10 text-red-200"
              }`}
            >
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent px-8 py-3.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Resetting…" : "Reset password"}
          </button>

          <button
            type="button"
            onClick={() => setStage("request")}
            className="w-full text-center text-xs font-semibold text-white/60 transition-colors hover:text-white"
          >
            Change email or didn&apos;t get a code?
          </button>
        </form>
      ) : null}

      {stage === "done" ? (
        <div className="space-y-4 text-center">
          {notice ? (
            <p
              className={`rounded-xl px-4 py-3 text-sm ${
                tone === "ok"
                  ? "bg-white/10 text-white"
                  : "bg-red-500/10 text-red-200"
              }`}
            >
              {notice}
            </p>
          ) : null}
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-3.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.02]"
          >
            Go to login
          </Link>
        </div>
      ) : null}
    </div>
  );
}
