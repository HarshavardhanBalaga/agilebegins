"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/clientFetch";

/**
 * "Resend verification email" control used on /verify-email and the register
 * flow. Uses the signed-in session, so no email needs to be typed.
 */
export function ResendVerification() {
  const [notice, setNotice] = useState("");
  const [tone, setTone] = useState<"ok" | "error">("ok");
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    setPending(true);
    setNotice("");
    try {
      const res = await apiFetch("/api/auth/resend-verification", {
        method: "POST",
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setTone("error");
        setNotice(data.error ?? "Could not send the email. Try again shortly.");
        return;
      }
      setTone("ok");
      setNotice(data.message ?? "Verification email sent.");
      setCooldown(60);
    } catch {
      setTone("error");
      setNotice("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }, []);

  return (
    <div className="space-y-3">
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
        type="button"
        onClick={handleResend}
        disabled={pending || cooldown > 0}
        className="w-full rounded-full border border-white/20 px-6 py-3 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        {cooldown > 0
          ? `Resend in ${cooldown}s`
          : pending
            ? "Sending…"
            : "Resend verification email"}
      </button>
    </div>
  );
}
