import type { Metadata } from "next";
import CheckInboxClient from "./CheckInboxClient";

export const metadata: Metadata = {
  title: "Check your inbox",
  description: "Confirm your email to continue to AgileBegins.",
};

export default function CheckInboxPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 pt-16 pb-24 font-[family-name:var(--font-cal-sans)]">
      <div className="rounded-lg border border-neutral-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl text-neutral-900">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          We sent you a verification link. Click it to confirm your email, then
          you can continue to your dashboard.
        </p>
        <CheckInboxClient />
      </div>
    </main>
  );
}
