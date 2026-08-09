"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { PublicUser } from "@/models/user";
import { emitAuthChanged } from "@/lib/authEvents";

interface AuthFormProps {
  onSuccess: (user: PublicUser) => void;
  initialMode?: "login" | "register";
}

type Mode = "login" | "register";

interface FieldErrorMap {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

/**
 * Login / register form used on /login and on /register (when logged out).
 * Success hands the user back to the caller who decides the next step — for
 * the registration flow that means continuing to the payment form without
 * the student re-clicking "Reserve Your Seat".
 */
export function AuthForm({ onSuccess, initialMode = "login" }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrorMap>({});
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
      };

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
  };

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/60 outline-none transition-colors focus:border-accent focus:bg-white/10";

  return (
    <div className="w-full">
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

      <form onSubmit={handleSubmit} className="space-y-4">
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