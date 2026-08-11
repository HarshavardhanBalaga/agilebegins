"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { AuthForm, type AuthFormHandle } from "@/components/auth/AuthForm";
import { ResendVerification } from "@/components/auth/ResendVerification";
import { apiFetch } from "@/lib/clientFetch";
import type { PublicUser } from "@/models/user";

export interface WorkshopChoice {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: "LIVE" | "COMING_SOON";
}

interface RegistrationFlowProps {
  initialUser: PublicUser | null;
  initialWorkshops: WorkshopChoice[];
  defaultWorkshopId: string;
  /** True when a refresh cookie exists, so the client can silently heal an expired access token. */
  canRefresh: boolean;
  /** True when the user already has a registration for the default workshop — skip the form. */
  alreadyRegistered: boolean;
}

type Step =
  | "checking"
  | "auth"
  | "verify-email"
  | "details"
  | "payment"
  | "success"
  | "already-registered";

const CLIENT_CONFIG = {
  upiId: process.env.NEXT_PUBLIC_UPI_ID ?? "",
  qrSrc: process.env.NEXT_PUBLIC_UPI_QR_SRC ?? "/upi-qr.svg",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL ?? "#",
};

const inputClass =
  "w-full rounded-xl border border-white/50 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/60 outline-none transition-colors focus:border-accent focus:bg-white/10";

/**
 * The /register flow. Initial session + workshop data is resolved on the
 * server (SSR) and passed in as props; this component only handles the
 * interactive steps.
 *
 * 0. checking — access token expired but a refresh cookie exists; brief heal
 * 1. auth    — logged out: register/login inline; success continues here
 * 2. details — workshop + student details
 * 3. payment — UPI details + maybe a screenshot
 * 4. success — confirmation copy + WhatsApp community link
 * 5. already-registered — friendly screen when the seat is already booked
 */
export function RegistrationFlow({
  initialUser,
  initialWorkshops,
  defaultWorkshopId,
  canRefresh,
  alreadyRegistered,
}: RegistrationFlowProps) {
  const [step, setStep] = useState<Step>(
    alreadyRegistered
      ? "already-registered"
      : initialUser
        ? initialUser.emailVerified
          ? "details"
          : "verify-email"
        : canRefresh
          ? "checking"
          : "auth"
  );

  const workshops = initialWorkshops;
  const [workshopId, setWorkshopId] = useState(defaultWorkshopId);

  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const authFormRef = useRef<AuthFormHandle>(null);

  const [name, setName] = useState(initialUser?.name ?? "");
  const [email, setEmail] = useState(initialUser?.email ?? "");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");

  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const selectedWorkshop = useMemo(
    () => workshops.find((w) => w.id === workshopId),
    [workshops, workshopId]
  );

  // Silent session heal: the access token can expire while the refresh token
  // is still valid. The server couldn't resolve the user (or detect an existing
  // registration), so refresh once and reload — the SSR re-runs with the fresh
  // cookies and lands on the correct step (details or already-registered).
  useEffect(() => {
    if (initialUser || alreadyRegistered || !canRefresh) return;
    let cancelled = false;
    apiFetch("/api/auth/refresh", { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: PublicUser } | null) => {
        if (!cancelled && data?.user) {
          window.location.reload();
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [initialUser, alreadyRegistered, canRefresh]);

  function handleAuthSuccess(currentUser: PublicUser) {
    setName(currentUser.name);
    setEmail(currentUser.email);
    setError("");
    setStep(currentUser.emailVerified ? "details" : "verify-email");
  }

  function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!workshopId) {
      setError("Please choose a workshop.");
      return;
    }
    setStep("payment");
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const payload = {
        workshopId,
        name,
        email,
        phone,
        college,
        branch,
        year,
        transactionId,
        screenshot,
      };
      const response = await apiFetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
        code?: string;
        fields?: Record<string, string | undefined>;
      };
      if (response.status === 401) {
        setError(
          "Your session expired. Please refresh the page and log in again to continue."
        );
        return;
      }
      if (response.status === 429) {
        setError(
          "Too many attempts. Please wait a few minutes before trying again."
        );
        return;
      }
      if (response.status === 409 && data.code === "ALREADY_REGISTERED") {
        setStep("already-registered");
        return;
      }
      if (response.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
        setStep("verify-email");
        return;
      }
      if (!response.ok) {
        const firstFieldError = data.fields
          ? Object.values(data.fields)[0]
          : undefined;
        setError(firstFieldError ?? data.error ?? "Registration failed. Please try again.");
        return;
      }
      setStep("success");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function onScreenshotChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setScreenshot(null);
      return;
    }
    if (file.size > 1.8 * 1024 * 1024) {
      setError("Screenshot must be under 1.8 MB. Please compress it.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {step === "checking" ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
          Checking your session…
        </div>
      ) : null}

      {step === "auth" ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-10">
          <h2 className="font-display text-2xl font-bold text-white">
            {authMode === "register"
              ? "Create an account to continue"
              : "Welcome back"}
          </h2>
          <p className="mt-2 mb-8 text-sm text-white/60">
            {authMode === "register"
              ? "It takes less than a minute. We&apos;ll keep your spot."
              : "Log in to continue reserving your seat."}
          </p>
          <AuthForm
            ref={authFormRef}
            initialMode="register"
            hideModeToggle
            onModeChange={setAuthMode}
            onSuccess={handleAuthSuccess}
          />
          <div className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-white/60">
            {authMode === "register" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => authFormRef.current?.switchTo("login")}
                  className="font-semibold text-accent transition-colors hover:text-white"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => authFormRef.current?.switchTo("register")}
                  className="font-semibold text-accent transition-colors hover:text-white"
                >
                  Create an account
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {step === "verify-email" ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center sm:p-10">
          <h2 className="font-display text-2xl font-bold text-white">
            Verify your email
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
            We sent a verification link to{" "}
            <span className="font-semibold text-white">{email}</span>. Click it
            to confirm your address before booking your seat.
          </p>
          <div className="mx-auto mt-8 max-w-sm text-left">
            <ResendVerification />
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 w-full max-w-sm rounded-full border border-white/20 px-6 py-3.5 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            I&apos;ve verified — continue
          </button>
        </div>
      ) : null}

      {step === "details" ? (
        <form
          onSubmit={handleDetailsSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-10"
        >
          <h2 className="font-display text-2xl font-bold text-white">
            Tell us a little about you
          </h2>
          <p className="mt-2 mb-8 text-sm text-white/70">
            Next we&apos;ll show you the payment details.
          </p>

          <div className="space-y-4">
            <Field label="Workshop">
              <select
                value={workshopId}
                onChange={(e) => {
                  setWorkshopId(e.target.value);
                  setError("");
                }}
                required
                className={inputClass}
              >
                {workshops.length === 0 ? (
                  <option value="" className="bg-ink text-white">
                    No workshops available yet
                  </option>
                ) : null}
                {workshops.map((w) => (
                  <option
                    key={w.id}
                    value={w.id}
                    className="bg-ink text-white"
                  >
                    {w.title}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  required
                  className={inputClass}
                />
                <span className="mt-1.5 block text-xs text-white/60">
                  10-digit Indian mobile, with or without +91.
                </span>
              </Field>
              <Field label="College">
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="Your college"
                  required
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Branch">
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Year">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="" className="bg-ink text-white">
                    Select your year
                  </option>
                  {["1st", "2nd", "3rd", "4th", "5th"].map((y) => (
                    <option key={y} value={y} className="bg-ink text-white">
                      {y} year
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {error ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-full bg-accent px-6 py-3.5 font-heading text-base font-bold text-ink transition-transform duration-300 hover:scale-[1.02]"
            >
              Continue to Payment
            </button>
          </div>
        </form>
      ) : null}

      {step === "payment" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <PaymentBrief
            upiId={CLIENT_CONFIG.upiId}
            qrSrc={CLIENT_CONFIG.qrSrc}
            amount={selectedWorkshop?.price}
          />
          <form
            onSubmit={handlePaymentSubmit}
            className="rounded-2xl border border-white/10 bg-white/5 p-8"
          >
            <h2 className="font-display text-xl font-bold text-white">
              Payment verification
            </h2>
            <p className="mt-2 mb-6 text-sm text-white/60">
              Pay the amount to the UPI id shown, then enter your transaction
              id. Our team verifies it within a few hours.
            </p>

            <div className="space-y-4">
              <Field label="Transaction ID (optional)">
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 421815082913"
                  className={inputClass}
                />
              </Field>

              <Field label="Proof Screenshot">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onScreenshotChange}
                  className={inputClass}
                  required
                />
                {screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={screenshot}
                    alt="Payment screenshot preview"
                    className="mt-3 max-h-40 rounded-xl object-cover"
                  />
                ) : null}
              </Field>

              {error ? (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-accent px-6 py-3.5 font-heading text-base font-bold text-ink transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Submitting…" : "Submit Registration"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {step === "success" ? (
        <CompletePanel
          title="Registration received"
          message={
            <>
              Your registration has been received.
              <br />
              Payment verification usually takes a few hours.
              <br />
              You&apos;ll receive an email once verified.
            </>
          }
          ctaHref={CLIENT_CONFIG.whatsapp}
          ctaLabel="Join our WhatsApp Community"
        />
      ) : null}

      {step === "already-registered" ? (
        <CompletePanel
          title="You're already in!"
          message={
            <>
              You&apos;ve already registered for this workshop.
              <br />
              Join our WhatsApp Community for further updates.
            </>
          }
          ctaHref={CLIENT_CONFIG.whatsapp}
          ctaLabel="Join our WhatsApp Community"
        />
      ) : null}
    </div>
  );
}

function CompletePanel({
  title,
  message,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  message: ReactNode;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center sm:p-12">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-accent">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
        {title}
      </h2>
      <div className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/[0.78]">
        {message}
      </div>
      <a
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-3.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.03]"
      >
        {ctaLabel}
      </a>
    </div>
  );
}

function PaymentBrief({
  upiId,
  qrSrc,
  amount,
}: {
  upiId: string;
  qrSrc: string;
  amount: number | undefined;
}) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-white/5 p-8">
      <h2 className="font-display text-xl font-bold text-white">
        Pay via UPI
      </h2>
      <div className="mt-6 flex flex-col items-center gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt="UPI payment QR code"
          width={220}
          height={220}
          className="rounded-xl bg-white p-3"
        />
        <div className="w-full rounded-xl bg-white/[0.07] px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
            Amount
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-accent">
            ₹{amount ?? "—"}
          </p>
        </div>
        <div className="w-full rounded-xl bg-white/[0.07] px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
            UPI ID
          </p>
          <p className="mt-1 break-all font-heading text-sm font-bold text-white">
            {upiId || "upi details coming soon"}
          </p>
        </div>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
        {label}
      </span>
      {children}
    </label>
  );
}
