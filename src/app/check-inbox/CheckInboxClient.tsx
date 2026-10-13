"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckInboxClient() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleResend() {
    setStatus(null);
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(body.error ?? "Could not resend the email.");
        return;
      }
      setStatus(body.message ?? "Verification email sent. Check your inbox.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleContinue() {
    setError(null);
    setChecking(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      const body = (await res.json().catch(() => ({}))) as {
        user?: { emailVerified?: boolean };
      };
      if (!res.ok || !body.user) {
        setError("You are not signed in. Please log in again.");
        return;
      }
      if (!body.user.emailVerified) {
        setError("Your email is not verified yet. Click the link in your inbox.");
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {status ? <p className="text-sm text-neutral-600">{status}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleResend}
        disabled={pending}
        className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending..." : "Resend verification email"}
      </button>
      <button
        type="button"
        onClick={handleContinue}
        disabled={checking}
        className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {checking ? "Checking..." : "I've verified — continue"}
      </button>
    </div>
  );
}
