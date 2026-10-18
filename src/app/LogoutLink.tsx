"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { emitAuthChanged } from "@/lib/authEvents";

export function LogoutLink({ label }: { label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Cookies clear server-side; still send the user to login.
    } finally {
      emitAuthChanged();
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="text-brand underline disabled:opacity-60"
    >
      {pending ? "Logging out..." : label}
    </button>
  );
}
