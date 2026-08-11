"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm, type AuthFormHandle } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/Card";
import type { PublicUser } from "@/models/user";

/**
 * Login form for /login. The "already signed in" redirect is handled on the
 * server (SSR); this panel only renders the form and navigates after login.
 * The form adapts in place (no manual tabs): a login with an unknown email
 * switches to registration, and a "New here?" link below does the same so
 * brand-new users can see registration is an option. Admins are sent to
 * `next` (e.g. /admin); students continue their previous flow when `next` is a
 * safe public path, otherwise they go to /register to continue reserving.
 */
export function LoginPanel({
  next,
  initialEmail = "",
}: {
  next: string;
  initialEmail?: string;
}) {
  const router = useRouter();
  const authRef = useRef<AuthFormHandle>(null);
  const [mode, setMode] = useState<"login" | "register">("login");

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
    router.push(safePath ? next : "/register");
  }

  return (
    <Card variant="glass" className="w-full max-w-md p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          {mode === "register" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {mode === "register"
            ? "It takes less than a minute. We'll keep your spot."
            : "Log in to continue reserving your seat."}
        </p>
      </div>

      <AuthForm
        ref={authRef}
        initialMode="login"
        initialEmail={initialEmail}
        hideModeToggle
        onModeChange={setMode}
        onSuccess={handleSuccess}
      />

      <div className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-white/60">
        {mode === "login" ? (
          <>
            New here?{" "}
            <button
              type="button"
              onClick={() => authRef.current?.switchTo("register")}
              className="font-semibold text-accent transition-colors hover:text-white"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => authRef.current?.switchTo("login")}
              className="font-semibold text-accent transition-colors hover:text-white"
            >
              Log in
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
