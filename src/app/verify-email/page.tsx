import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { ResendVerification } from "@/components/auth/ResendVerification";
import { authService } from "@/services/authService";
import { getSessionUser } from "@/middlewares/auth";
import { isEmailVerified } from "@/models/user";

export const dynamic = "force-dynamic";

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * /verify-email — reached by clicking the link in the verification email.
 * The token is verified on the server (SSR); the page then shows the result
 * with a resend option if the token was invalid/expired.
 */
export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = await searchParams;

  let linkStatus: "verified" | "invalid" | "none" = "none";
  if (typeof token === "string" && token) {
    try {
      await authService.verifyEmail(token);
      linkStatus = "verified";
    } catch {
      linkStatus = "invalid";
    }
  }

  // Read the session AFTER verification so the fresh DB state is reflected.
  const user = await getSessionUser();
  const verified =
    linkStatus === "verified" || (user ? isEmailVerified(user) : false);

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-5.5rem)] items-center justify-center px-5 py-16 sm:px-8">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center sm:p-10">
          <div
            className={`mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full ${
              verified ? "bg-accent" : "bg-white/10"
            }`}
          >
            {verified ? (
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
            ) : (
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/60"
              >
                <path d="M21 12a9 9 0 1 1-9-9" />
                <path d="M12 6v6l3 2" />
              </svg>
            )}
          </div>

          {verified ? (
            <>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {linkStatus === "verified"
                  ? "Email verified!"
                  : "Email already verified"}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Your email is confirmed. You can now reserve your seat for any
                workshop.
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-3.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.02]"
              >
                {user ? "Continue to registration" : "Log in to continue"}
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {linkStatus === "invalid"
                  ? "This link is invalid or expired"
                  : "Verify your email"}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {linkStatus === "invalid"
                  ? "Please request a new verification link to continue."
                  : "We couldn't find a link to verify. Please request a new one."}
              </p>
              {user ? (
                <div className="mt-8 text-left">
                  <ResendVerification />
                </div>
              ) : (
                <Link
                  href="/login"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-white/20 px-8 py-3.5 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  Log in to resend
                </Link>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
