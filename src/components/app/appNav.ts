import type { LucideIcon } from "lucide-react";
import { Bell, Home, Settings, TrendingUp, UserRound, Users } from "lucide-react";
import type { PublicUser } from "@/models/user";

/**
 * Extendable navigation + profile-action config for the authenticated app
 * navbar. Add future Companion Mode destinations here without touching
 * `AppNavbar.tsx`.
 */

export interface AppNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Exact match for /app, prefix match for nested routes. */
  match: "exact" | "prefix";
  badge?: string;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { label: "Home", href: "/app", icon: Home, match: "exact" },
  { label: "Find a Partner", href: "/app/find", icon: Users, match: "prefix" },
  {
    label: "Progress",
    href: "/app/progress",
    icon: TrendingUp,
    match: "prefix",
    badge: "Soon",
  },
];

export interface ProfileMenuAction {
  label: string;
  href?: string;
  icon: LucideIcon;
  hint?: string;
  action?: "logout";
}

export const PROFILE_MENU_ACTIONS: ProfileMenuAction[] = [
  { label: "My profile", href: "/app/profile", icon: UserRound },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export const NOTIFICATIONS_ICON = Bell;

export type AppNavbarUser = Pick<
  PublicUser,
  "name" | "email" | "displayName" | "avatarUrl" | "profileComplete" | "missingProfileFields"
>;

export function displayNameFor(user: AppNavbarUser): string {
  return user.displayName?.trim() || user.name;
}
