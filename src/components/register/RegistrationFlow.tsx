"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import type { PublicUser } from "@/models/user";

type Step = "loading" | "auth" | "details" | "payment" | "success";

interface WorkshopChoice {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: "LIVE" | "COMING_SOON";
}

const CLIENT_CONFIG = {
  upiId: process.env.NEXT_PUBLIC_UPI_ID ?? "",
  qrSrc: process.env.NEXT_PUBLIC_UPI_QR_SRC ?? "/upi-qr.svg",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL ?? "#",
};

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-accent focus:bg-white/10";

/**
 * The /register flow.
 *
 * 1. loading — checks the session and fetches workshops
 * 2. auth    — logged out: register/login inline; success continues here
 * 3. details — workshop + student details
 * 4. payment — UPI details + maybe a screenshot
 * 5. success — confirmation copy + WhatsApp community link
 */
export function RegistrationFlow() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("loading");

  const [workshops, setWorkshops] = useState<WorkshopChoice[]>([]);
  const [workshopId, setWorkshopId] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const wanted = searchParams.get("workshop");
      try {
        const [meRes, wsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/workshops"),
        ]);

        let currentUser: PublicUser | null = null;
        if (meRes.ok) {
          const me = (await meRes.json()) as { user?: PublicUser };
          currentUser = me.user ?? null;
        }

        let list: WorkshopChoice[] = [];
        if (wsRes.ok) {
          const raw = (await wsRes.json()) as {
            _id: string;
            title: string;
            slug: string;
            price: number;
            status: string;
          }[];
          list = raw.map((w) => ({
            id: w._id,
            title: w.title,
            slug: w.slug,
            price: w.price,
            status: w.status as WorkshopChoice["status"],
          }));
        }

        if (cancelled) return;
        setWorkshops(list);
        const pick =
          list.find((w) => w.slug === wanted) ??
          list.find((w) => w.status === "LIVE") ??
          list[0];
        if (pick) setWorkshopId(pick.id);

        if (currentUser) {
          setName(currentUser.name);
          setEmail(currentUser.email);
        }
        setStep(currentUser ? "details" : "auth");
      } catch {
        if (!cancelled) setStep("auth");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  function handleAuthSuccess(currentUser: PublicUser) {
    setName(currentUser.name);
    setEmail(currentUser.email);
    setError("");
    setStep("details");
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
    if (!transactionId.trim()) {
      setError("Please enter the transaction id you paid with.");
      return;
    }
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
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
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
    <div className="w-full max-w-2xl">
      {step === "loading" ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
          Checking your session…
        </div>
      ) : null}

      {step === "auth" ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-10">
          <h2 className="font-display text-2xl font-bold text-white">
            Create an account to continue
          </h2>
          <p className="mt-2 mb-8 text-sm text-white/60">
            It takes less than a minute. We&apos;ll keep your spot.
          </p>
          <AuthForm initialMode="register" onSuccess={handleAuthSuccess} />
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
          <p className="mt-2 mb-8 text-sm text-white/60">
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
                    disabled={w.status !== "LIVE"}
                    className="bg-ink text-white"
                  >
                    {w.title}
                    {w.status !== "LIVE" ? " (Coming Soon)" : ""}
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
                  className={inputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  className={inputClass}
                />
              </Field>
              <Field label="College">
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="Your college"
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
                  className={inputClass}
                />
              </Field>
              <Field label="Year">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
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
              <Field label="Transaction ID">
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 421815082913"
                  className={inputClass}
                />
              </Field>

              <Field label="Proof Screenshot (optional)">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onScreenshotChange}
                  className={inputClass}
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
            Registration received
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/[0.78]">
            Your registration has been received.
            <br />
            Payment verification usually takes a few hours.
            <br />
            You&apos;ll receive an email once verified.
          </p>
          <a
            href={CLIENT_CONFIG.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-3.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.03]"
          >
            Join our WhatsApp Community
          </a>
        </div>
      ) : null}
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
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
        {label}
      </span>
      {children}
    </label>
  );
}