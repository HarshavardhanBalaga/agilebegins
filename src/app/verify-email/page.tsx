import { Suspense } from "react";
import type { Metadata } from "next";
import VerifyEmailClient from "./VerifyEmailClient";
import { AuthHeader } from "@/app/AuthHeader";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm your AgileBegins email address.",
};

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 pt-8 pb-12 font-[family-name:var(--font-cal-sans)]">
      <AuthHeader />
      <div className="rounded-lg border border-neutral-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl text-neutral-900">Verify your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          We sent you a verification link. Click it to confirm your email,
          then continue.
        </p>
        <Suspense>
          <VerifyEmailClient />
        </Suspense>
      </div>
    </main>
  );
}
