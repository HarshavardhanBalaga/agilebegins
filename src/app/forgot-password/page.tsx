import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { AuthHeader } from "@/app/AuthHeader";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your AgileBegins password with an emailed code.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 pt-8 pb-12 font-[family-name:var(--font-cal-sans)]">
      <AuthHeader />
      <div className="rounded-lg border border-neutral-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl text-neutral-900">Forgot password</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Enter your email to get a 4-digit reset code, then set a new
          password.
        </p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
