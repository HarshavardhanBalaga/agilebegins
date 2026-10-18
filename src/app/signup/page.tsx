import type { Metadata } from "next";
import SignupForm from "./SignupForm";
import { GoogleSignInButton } from "@/app/GoogleSignInButton";
import { AuthHeader } from "@/app/AuthHeader";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your AgileBegins student account.",
};

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 pt-8 pb-12 font-[family-name:var(--font-cal-sans)]">
      <AuthHeader />
      <div className="rounded-lg border border-neutral-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl text-neutral-900">Create account</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Sign up with Google or with your name, email, and a password.
        </p>
        <div className="mt-6">
          <GoogleSignInButton />
        </div>
        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs text-neutral-500">or</span>
          <span className="h-px flex-1 bg-neutral-200" />
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
