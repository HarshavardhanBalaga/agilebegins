"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "request" | "reset" | "done";

const PRIMARY_BTN =
  "mt-1 flex w-full items-center justify-center rounded-lg border-2 border-neutral-900 bg-accent px-4 py-2.5 text-sm font-normal tracking-wide text-neutral-900 uppercase shadow-[4px_4px_0_0_#111111] disabled:cursor-not-allowed disabled:opacity-60";
const INPUT_CLS =
  "rounded-lg border border-neutral-900 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-[1px_1px_0_0_#111111] outline-none placeholder:text-neutral-400";

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setMessage(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setFormError(body.error ?? "Could not send the reset code.");
        return;
      }
      setMessage(
        body.message ??
          "If an account exists for that email, a reset code is on its way."
      );
      setStep("reset");
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setMessage(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, code, newPassword }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setFormError(body.error ?? "Could not reset your password.");
        return;
      }
      setMessage(body.message ?? "Your password has been reset.");
      setStep("done");
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mt-6 flex flex-col gap-4">
        {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-lg border-2 border-neutral-900 bg-accent px-4 py-2.5 text-center text-sm font-normal tracking-wide text-neutral-900 uppercase shadow-[4px_4px_0_0_#111111]"
        >
          Back to log in
        </Link>
      </div>
    );
  }
  if (step === "reset") {
    return (
      <form onSubmit={handleReset} className="mt-6 flex flex-col gap-4" noValidate>
        {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="forgot-code" className="text-sm text-neutral-900">
            4-digit code
          </label>
          <input
            id="forgot-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="1234"
            className={INPUT_CLS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="forgot-new-password" className="text-sm text-neutral-900">
            New password
          </label>
          <input
            id="forgot-new-password"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            className={INPUT_CLS}
          />
        </div>
        {formError ? (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className={PRIMARY_BTN}>
          {pending ? "Resetting..." : "Reset password"}
        </button>
        <p className="text-sm text-neutral-600">
          Remembered it?{" "}
          <Link href="/login" className="text-brand underline">
            Back to log in
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequest} className="mt-6 flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-email" className="text-sm text-neutral-900">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className={INPUT_CLS}
        />
      </div>
      {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
      {formError ? (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={PRIMARY_BTN}>
        {pending ? "Sending code..." : "Send reset code"}
      </button>
      <p className="text-sm text-neutral-600">
        Remembered it?{" "}
        <Link href="/login" className="text-brand underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
