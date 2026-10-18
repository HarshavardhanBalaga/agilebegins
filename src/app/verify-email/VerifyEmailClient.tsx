"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoutLink } from "@/app/LogoutLink";

type Status = "inbox" | "verifying" | "success" | "error";

const PRIMARY_BTN =
  "flex w-full items-center justify-center rounded-lg border-2 border-neutral-900 bg-accent px-4 py-2.5 text-center text-sm font-normal tracking-wide text-neutral-900 uppercase shadow-[4px_4px_0_0_#111111] disabled:cursor-not-allowed disabled:opacity-60";
const SECONDARY_BTN =
  "flex w-full items-center justify-center rounded-lg border-2 border-neutral-900 bg-white px-4 py-2.5 text-center text-sm font-normal tracking-wide text-neutral-900 uppercase shadow-[4px_4px_0_0_#111111] disabled:cursor-not-allowed disabled:opacity-60";

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<Status>(token ? "verifying" : "inbox");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ token }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          setMessage(
            body.error ??
              "This verification link is invalid or has expired. Please request a new one."
          );
          return;
        }
        setStatus("success");
        router.refresh();
        window.setTimeout(() => {
          if (!cancelled) router.push("/app");
        }, 1500);
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Network error. Please try again.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  async function handleResend() {
    setMessage(null);
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
        setMessage(body.error ?? "Could not resend the email.");
        return;
      }
      setMessage(body.message ?? "Verification email sent. Check your inbox.");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleContinue() {
    setMessage(null);
    setChecking(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      const body = (await res.json().catch(() => ({}))) as {
        user?: { emailVerified?: boolean };
      };
      if (!res.ok || !body.user) {
        setMessage("You are not signed in. Please log in again.");
        return;
      }
      if (!body.user.emailVerified) {
        setMessage("Your email is not verified yet. Click the link in your inbox.");
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  if (status === "verifying") {
    return (
      <p className="mt-4 text-sm leading-relaxed text-neutral-600">
        Verifying your email...
      </p>
    );
  }

  if (status === "success") {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-neutral-600">
          Your email is verified. Taking you to your dashboard...
        </p>
        <Link href="/app" className={PRIMARY_BTN}>
          Continue
        </Link>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <p role="alert" className="text-sm leading-relaxed text-red-600">
          {message}
        </p>
        <button type="button" onClick={handleResend} disabled={pending} className={SECONDARY_BTN}>
          {pending ? "Sending..." : "Request a new link"}
        </button>
        <p className="text-sm text-neutral-600">
          Used the wrong email? <LogoutLink label="Log out and use another email" />
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
      <button type="button" onClick={handleResend} disabled={pending} className={SECONDARY_BTN}>
        {pending ? "Sending..." : "Resend verification email"}
      </button>
      <button type="button" onClick={handleContinue} disabled={checking} className={PRIMARY_BTN}>
        {checking ? "Checking..." : "I've verified — continue"}
      </button>
      <p className="text-sm text-neutral-600">
        Used the wrong email? <LogoutLink label="Log out and use another email" />
      </p>
    </div>
  );
}
