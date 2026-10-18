"use client";

import { Suspense } from "react";
import { FcGoogle } from "react-icons/fc";
import { useSearchParams } from "next/navigation";

function GoogleButton({ label }: { label: string }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const href =
    next && next.startsWith("/") && !next.startsWith("//")
      ? `/api/auth/google/start?next=${encodeURIComponent(next)}`
      : "/api/auth/google/start";
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2.5 rounded-lg border-2 border-neutral-900 bg-white px-4 py-2.5 text-sm font-normal text-neutral-900 shadow-[4px_4px_0_0_#111111]"
    >
      <FcGoogle size={18} aria-hidden="true" />
      {label}
    </a>
  );
}

export function GoogleSignInButton() {
  return (
    <Suspense>
      <GoogleButton label="Continue with Google" />
    </Suspense>
  );
}