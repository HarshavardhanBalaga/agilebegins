"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setPending(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody;

      if (!res.ok) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(body.fields ?? {}).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string"
            )
          )
        );
        setFormError(getErrorMessage(body, "Could not create your account."));
        return;
      }

      router.push("/verify-email");
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
        <label htmlFor="signup-name" className="text-sm text-neutral-900">
          Name
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your full name"
          className="rounded-lg border border-neutral-900 bg-white tracking-wide px-3.5 py-2.5 text-sm text-neutral-900 shadow-[1px_1px_0_0_#111111] outline-none placeholder:text-neutral-400"
        />
        {fieldErrors.name ? (
          <p className="text-sm text-red-600">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-email" className="text-sm text-neutral-900">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-lg border border-neutral-900 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-[1px_1px_0_0_#111111] outline-none placeholder:text-neutral-400"
        />
        {fieldErrors.email ? (
          <p className="text-sm text-red-600">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-password" className="text-sm text-neutral-900">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 characters"
          className="rounded-lg border border-neutral-900 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-[1px_1px_0_0_#111111] outline-none placeholder:text-neutral-400"
        />
        {fieldErrors.password ? (
          <p className="text-sm text-red-600">{fieldErrors.password}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-confirm-password"
          className="text-sm text-neutral-900"
        >
          Confirm password
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat your password"
          className="rounded-lg border border-neutral-900 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-[1px_1px_0_0_#111111] outline-none placeholder:text-neutral-400"
        />
        {fieldErrors.confirmPassword ? (
          <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>
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
        className="mt-1 flex w-full items-center justify-center rounded-lg border-2 border-neutral-900 bg-accent px-4 py-2.5 text-sm font-normal tracking-wide text-neutral-900 uppercase shadow-[4px_4px_0_0_#111111] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Sign up"}
      </button>

      <p className="text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="text-brand underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
