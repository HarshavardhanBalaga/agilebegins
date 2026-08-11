"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/Card";
import type { PublicUser } from "@/models/user";

/**
 * Login form for /login. The "already signed in" redirect is handled on the
 * server (SSR); this panel only renders the form and navigates after login.
 * Admins are sent to `next` (e.g. /admin); students continue their previous
 * flow when `next` is a safe public path (e.g. /register), otherwise they go
 * to /workshop so a student can never be bounced between /admin and /login.
 */
export function LoginPanel({
  next,
  initialEmail = "",
}: {
  next: string;
  initialEmail?: string;
}) {
  const router = useRouter();

  function handleSuccess(user: PublicUser) {
    if (user.role === "admin") {
      router.push(next);
      return;
    }
    const safePath =
      next.startsWith("/") &&
      !next.startsWith("//") &&
      !next.startsWith("/admin") &&
      next !== "/";
    router.push(safePath ? next : "/workshop");
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

      <AuthForm initialMode="login" initialEmail={initialEmail} onSuccess={handleSuccess} />
    </Card>
  );
}
