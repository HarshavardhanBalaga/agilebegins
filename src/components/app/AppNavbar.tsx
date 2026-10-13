"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import Avatar from "@/components/app/Avatar";
import {
  APP_LINK_BRAND,
  APP_LIME_BADGE,
  APP_NAV_ACTIVE,
  APP_NAV_INACTIVE,
  APP_NAV_MOBILE_ACTIVE,
  APP_NAV_MOBILE_INACTIVE,
  APP_SURFACE_HOVER,
  APP_UNREAD_DOT,
} from "@/components/app/appTheme";
import {
  APP_NAV_ITEMS,
  NOTIFICATIONS_ICON,
  PROFILE_MENU_ACTIONS,
  displayNameFor,
  type AppNavbarUser,
} from "@/components/app/appNav";

const BellIcon = NOTIFICATIONS_ICON;

function isActive(pathname: string, href: string, match: "exact" | "prefix"): boolean {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Authenticated app navbar for /app. Logo + nav, a progress link (wired to
 * /app/progress, backed by real completion data later), a notifications bell
 * with an unread dot, and a profile dropdown with details, setup status,
 * settings, and logout. Fully responsive with a mobile menu.
 */
export default function AppNavbar({
  user,
  hasUnreadNotifications = false,
}: {
  user: AppNavbarUser;
  hasUnreadNotifications?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = displayNameFor(user);
  const profileIncomplete = !user.profileComplete;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Menus close via onClick on each link (see closeMenus) rather than a
  // pathname effect, keeping navigation state reset declarative.
  function closeMenus() {
    setMenuOpen(false);
    setMobileOpen(false);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // Logout clears cookies server-side; even on network failure we
      // navigate to login so a stale session is never shown as active.
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between gap-3 px-3 sm:px-4">
        <Link href="/app" className="flex shrink-0 items-center gap-2" aria-label="AgileBegins app home">
          <Image
            src="/logos/logo_exact_black_transparent_64px.png"
            alt="AgileBegins"
            width={32}
            height={32}
            priority
            className="h-8 w-8"
          />
          <span className="text-lg leading-none text-neutral-900">AgileBegins</span>
        </Link>
        <nav aria-label="App" className="hidden items-center gap-1 md:flex">
          {APP_NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, item.match);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenus}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? APP_NAV_ACTIVE : APP_NAV_INACTIVE
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
                {item.badge ? (
                  <span className={`${APP_LIME_BADGE} ${active ? "ring-1 ring-white/60" : ""}`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link
            href="/app/progress"
            onClick={closeMenus}
            aria-label="Notifications"
            className={`relative flex size-9 items-center justify-center rounded-lg text-neutral-600 transition-colors ${APP_SURFACE_HOVER} hover:text-brand`}
          >
            <BellIcon size={18} aria-hidden="true" />
            {hasUnreadNotifications ? (
              <span aria-label="Unread notifications" className={APP_UNREAD_DOT} />
            ) : null}
          </Link>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Profile menu"
              className={`relative flex items-center gap-2 rounded-full p-1 transition-colors ${APP_SURFACE_HOVER}`}>
              <span
                className={`rounded-full p-0.5 ${
                  profileIncomplete
                    ? "border-2 border-dashed border-amber-500"
                    : "border-2 border-accent"
                }`}
              >
                <Avatar name={displayName} avatarUrl={user.avatarUrl} size={32} />
              </span>
              {profileIncomplete ? (
                <span
                  role="img"
                  aria-label="Profile setup incomplete"
                  title="Profile setup incomplete"
                  className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-ink ring-2 ring-white"
                >
                  !
                </span>
              ) : null}
            </button>
            {menuOpen ? (
              <div role="menu" className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
                <div className="flex items-center gap-3 border-b border-neutral-100 p-4">
                  <Avatar name={displayName} avatarUrl={user.avatarUrl} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">{displayName}</p>
                    <p className="truncate text-xs text-neutral-500">{user.email}</p>
                  </div>
                </div>
                <div className="border-b border-neutral-100 p-4">
                  {user.profileComplete ? (
                    <p className="text-xs leading-relaxed text-neutral-600">
                      <span className="font-medium text-brand">Profile complete.</span> You are ready for Companion Mode.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs leading-relaxed text-neutral-600">
                        <span className="font-medium text-amber-700">Profile setup incomplete.</span> Finish filling in your details to unlock Companion Mode.
                      </p>
                      <Link href="/app/profile" onClick={closeMenus} className={`mt-2.5 inline-block text-xs ${APP_LINK_BRAND}`}>
                        Finish setup
                      </Link>
                    </>
                  )}
                </div>
                <div className="p-1.5">
                  {PROFILE_MENU_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.label} href={action.href ?? "/app"} role="menuitem" onClick={closeMenus} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors ${APP_SURFACE_HOVER}`}>
                        <Icon size={16} aria-hidden="true" className="text-brand/70" />
                        {action.label}
                      </Link>
                    );
                  })}
                  <button type="button" role="menuitem" onClick={handleLogout} disabled={loggingOut} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 transition-colors ${APP_SURFACE_HOVER} disabled:opacity-60`}>
                    <LogOut size={16} aria-hidden="true" className="text-brand/70" />
                    {loggingOut ? "Logging out…" : "Log out"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <button type="button" onClick={() => setMobileOpen((v) => !v)} aria-expanded={mobileOpen} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} className={`flex size-9 items-center justify-center rounded-lg text-neutral-700 transition-colors ${APP_SURFACE_HOVER} md:hidden`}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {mobileOpen ? (
        <nav aria-label="App mobile" className="border-t border-neutral-100 px-4 py-2 md:hidden">
          {APP_NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, item.match);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={closeMenus} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? APP_NAV_MOBILE_ACTIVE : APP_NAV_MOBILE_INACTIVE}`}>
                <Icon size={17} aria-hidden="true" />
                {item.label}
                {item.badge ? (
                  <span className={`ml-auto ${APP_LIME_BADGE}`}>{item.badge}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}

