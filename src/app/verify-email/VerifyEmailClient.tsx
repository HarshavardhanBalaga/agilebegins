"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [message, setMessage] = useState<string | null>(
    token ? null : "This verification link is missing its token."
  );

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
        <Link
          href="/app"
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-center text-sm text-white"
        >
          Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <p role="alert" className="text-sm leading-relaxed text-red-600">
        {message}
      </p>
      <Link
        href="/check-inbox"
        className="rounded-lg bg-neutral-900 px-4 py-2.5 text-center text-sm text-white"
      >
        Request a new link
      </Link>
    </div>
  );
}
