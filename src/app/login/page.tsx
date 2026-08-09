import { Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-5.5rem)] items-center justify-center px-5 py-16 sm:px-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/50">
              Loading…
            </div>
          }
        >
          <LoginClient />
        </Suspense>
      </main>
    </>
  );
}