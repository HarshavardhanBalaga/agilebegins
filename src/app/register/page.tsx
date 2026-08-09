import { Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { RegistrationFlow } from "@/components/register/RegistrationFlow";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mb-12 max-w-[700px]">
            <h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white">
              <span className="block">Reserve Your Seat</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/[0.78] md:text-lg">
              Create an account, tell us a little about yourself, pay via UPI,
              and you&apos;re in. Verification usually takes a few hours.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
                Loading…
              </div>
            }
          >
            <RegistrationFlow />
          </Suspense>
        </div>
      </main>
    </>
  );
}