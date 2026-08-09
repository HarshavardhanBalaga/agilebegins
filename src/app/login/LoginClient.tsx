"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/Card";
import type { PublicUser } from "@/models/user";

/**
 * Log-in page used by the /admin guard (proxy.ts redirects here) and as a
 * general entry point. On success it forwards to `?next=` or home.
 */
export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [checking, setChecking] = useState(true);

  // If already signed in (e.g. as admin), skip the form.
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: PublicUser } | null) => {
        if (data?.user) router.replace(next);
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, [next, router]);

  function handleSuccess() {
    router.push(next);
  }

  return (
    <Card variant="glass" className="w-full max-w-md p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Log in to continue reserving your seat.
        </p>
      </div>

      {checking ? (
        <p className="text-sm text-white/50">Checking your session…</p>
      ) : (
        <AuthForm initialMode="login" onSuccess={handleSuccess} />
      )}
    </Card>
  );
}