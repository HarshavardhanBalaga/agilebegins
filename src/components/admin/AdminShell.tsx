"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  GraduationCap,
  LogOut,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import type { PublicUser } from "@/models/user";
import { emitAuthChanged } from "@/lib/authEvents";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}> = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
  { href: "/admin/workshops", label: "Workshops", icon: GraduationCap },
];

/**
 * Admin portal shell: sidebar navigation (desktop) / top bar (mobile) around
 * the routed admin pages. Requires an authenticated admin — enforced in the
 * server layout that wraps this component.
 */
export function AdminShell({
  user,
  children,
}: {
  user: PublicUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    emitAuthChanged();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-brand text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-black/10 lg:flex">
        <Link
          href="/admin"
          className="flex items-center gap-2 px-6 py-6 font-display text-xl font-bold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-display text-sm font-bold text-ink">
            A
          </span>
          Admin
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-heading text-sm font-semibold transition-colors ${
                  active
                    ? "bg-accent text-ink"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold uppercase">
              {user.name.slice(0, 2) || "A"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-white/50">{user.email}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              View site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-brand px-5 py-4 lg:hidden">
          <Link href="/admin" className="font-display text-lg font-bold tracking-tight">
            Admin
          </Link>
          <div className="flex items-center gap-2 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-4 py-2 font-heading text-sm font-bold ${
                    active ? "bg-accent text-ink" : "bg-white/10 text-white/70"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 text-white/70 transition-colors hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
