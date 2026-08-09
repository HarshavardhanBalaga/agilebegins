import { Navbar } from "@/components/landing/Navbar";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

/**
 * /forgot-password — two-step flow: request a 4-digit code, then enter it
 * with a new password. All state lives client-side in ForgotPasswordForm.
 */
export default function ForgotPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-5.5rem)] items-center justify-center px-5 py-16 sm:px-8">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-10">
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Reset your password
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Enter your account email and we&apos;ll send a 4-digit code to
            reset it.
          </p>
          <ForgotPasswordForm />
        </div>
      </main>
    </>
  );
}
