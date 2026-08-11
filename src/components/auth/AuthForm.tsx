"use client";

import { useImperativeHandle, useState, type FormEvent, type Ref } from "react";
import Link from "next/link";
import type { PublicUser } from "@/models/user";
import { emitAuthChanged } from "@/lib/authEvents";

type Mode = "login" | "register";

export interface AuthFormHandle {
  switchTo: (mode: Mode) => void;
}

interface AuthFormProps {
  onSuccess: (user: PublicUser) => void;
  initialMode?: "login" | "register";
  /** Pre-fills the email field (e.g. when arriving at /login?email=…). */
  initialEmail?: string;
  /**
   * Hides the manual Log in / Register toggle. The form then adapts
   * automatically: a login attempt with an unknown email switches to
   * registration in place.
   */
  hideModeToggle?: boolean;
  /** Fires whenever the active mode changes (tab switch or adaptive switch). */
  onModeChange?: (mode: Mode) => void;
  /** Imperative handle so a parent can switch modes (e.g. a "New here?" link). */
  ref?: Ref<AuthFormHandle>;
}

interface FieldErrorMap {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

/**
 * Login / register form used on /login and on /register (when logged out).
 * The form adapts in place: a register attempt with an email that already has
 * an account switches to login, and a login attempt with an email that has no
 * account switches to registration — so new and returning students both stay
 * in the flow they started. Success hands the user back to the caller who
 * decides the next step — for the registration flow that means continuing to
 * the payment form without the student re-clicking "Reserve Your Seat".
 */
export function AuthForm({
  onSuccess,
  initialMode = "login",
  initialEmail = "",
  hideModeToggle = false,
  onModeChange,
  ref,
}: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setPending(true);

    try {
      const endpoint =
        mode === "register"
          ? "/api/auth/register"
          : "/api/auth/login";

      const payload =
        mode === "register"
          ? { name, email, password, confirmPassword }
          : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        user?: PublicUser;
        error?: string;
        fields?: Record<string, string | undefined>;
        code?: string;
      };

      // A register attempt with an email that already has an account is a
      // login scenario — morph the form into login in place so the student
      // can log in and continue the same flow.
      if (
        mode === "register" &&
        response.status === 409 &&
        data.code === "EMAIL_EXISTS"
      ) {
        setMode("login");
        setNotice(
          `An account with ${email} already exists. Log in to continue.`
        );
        onModeChange?.("login");
        return;
      }

      // A login attempt with an email that has no account is a sign-up
      // scenario — morph the form into registration in place so the student
      // can create the account and continue the same flow.
      if (
        mode === "login" &&
        response.status === 401 &&
        data.code === "EMAIL_NOT_FOUND"
      ) {
        setMode("register");
        setNotice(
          `No account found with ${email}. Create one below to continue.`
        );
        onModeChange?.("register");
        return;
      }

      if (!response.ok) {
        setErrors({
          form: data.error ?? "Something went wrong. Please try again.",
          ...(data.fields ?? {}),
        });
        return;
      }

      if (data.user) {
        emitAuthChanged();
        onSuccess(data.user);
      }
    } catch {
      setErrors({ form: "Unable to reach the server. Please try again." });
    } finally {
      setPending(false);
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setNotice("");
    onModeChange?.(next);
  };

  useImperativeHandle(ref, () => ({
    switchTo: switchMode,
  }));

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/60 outline-none transition-colors focus:border-accent focus:bg-white/10";

  return (
    <div className="w-full">
      {!hideModeToggle ? (
        <div className="mb-8 grid grid-cols-2 gap-2 rounded-full border border-white/15 p-1">
          {(["login", "register"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => switchMode(tab)}
              className={`rounded-full px-4 py-2.5 font-heading text-sm font-bold uppercase tracking-[0.12em] transition-colors ${
                mode === tab
                  ? "bg-accent text-ink"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {tab === "login" ? "Log in" : "Register"}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {notice ? (
          <p className="rounded-xl bg-accent/15 px-4 py-3 text-sm text-accent">
            {notice}
          </p>
        ) : null}
        {mode === "register" ? (
          <div>
            <label
              htmlFor="auth-name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/80"
            >
              Full Name
            </label>
            <input
              id="auth-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
              className={inputClass}
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-red-300">{errors.name}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="auth-email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/80"
          >
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
            autoComplete="email"
            required
            className={inputClass}
          />
          {errors.email ? (
            <p className="mt-1 text-xs text-red-300">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/80"
          >
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              mode === "register" ? "At least 8 characters" : "Your password"
            }
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            required
            className={inputClass}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-300">{errors.password}</p>
          ) : null}
        </div>

        {mode === "login" ? (
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-white/60 transition-colors hover:text-accent"
            >
              Forgot password?
            </Link>
          </div>
        ) : null}

        {mode === "register" ? (
          <div>
            <label
              htmlFor="auth-confirm"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/80"
            >
              Confirm Password
            </label>
            <input
              id="auth-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              className={inputClass}
            />
            {errors.confirmPassword ? (
              <p className="mt-1 text-xs text-red-300">{errors.confirmPassword}</p>
            ) : null}
          </div>
        ) : null}

        {errors.form ? (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errors.form}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-accent px-8 py-3.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? mode === "register"
              ? "Creating account…"
              : "Signing you in…"
            : mode === "register"
              ? "Create Account"
              : "Log in"}
        </button>
      </form>
    </div>
  );
}