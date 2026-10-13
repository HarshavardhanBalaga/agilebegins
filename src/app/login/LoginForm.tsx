"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface ApiErrorBody {
  error?: string;
  fields?: Record<string, string | undefined>;
}

function getErrorMessage(body: ApiErrorBody, fallback: string): string {
  if (body.error) return body.error;
  const firstField = body.fields
    ? Object.values(body.fields).find(Boolean)
    : undefined;
  return firstField ?? fallback;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setPending(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody & {
        user?: { role?: string; emailVerified?: boolean };
      };

      if (!res.ok) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(body.fields ?? {}).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string"
            )
          )
        );
        setFormError(getErrorMessage(body, "Could not log you in."));
        return;
      }

      const next = searchParams.get("next");
      const verified = body.user?.emailVerified !== false;
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        router.push(verified ? next : "/check-inbox");
      } else if (body.user?.role === "admin") {
        router.push("/admin");
      } else if (!verified) {
        router.push("/check-inbox");
      } else {
        router.push("/app");
      }
      router.refresh();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-sm text-neutral-900">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
        />
        {fieldErrors.email ? (
          <p className="text-sm text-red-600">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-sm text-neutral-900">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
        />
        {fieldErrors.password ? (
          <p className="text-sm text-red-600">{fieldErrors.password}</p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Logging in..." : "Log in"}
      </button>

      <p className="text-sm text-neutral-600">
        No account yet?{" "}
        <Link href="/signup" className="text-neutral-900 underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
