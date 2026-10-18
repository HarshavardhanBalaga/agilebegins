import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/middlewares/auth";
import { getProfileCompletion, isEmailVerified } from "@/models/user";
import Avatar from "@/components/app/Avatar";
import { APP_PRIMARY_BUTTON, APP_SECONDARY_BUTTON } from "@/components/app/appTheme";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your AgileBegins account settings.",
};

/**
 * GET /app/settings — minimal account settings. Profile editing lives at
 * /app/profile; this page shows account identity and links onward so the
 * navbar's Settings entry has a real destination without scope creep.
 */
export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/settings");
  if (!isEmailVerified(user)) redirect("/verify-email");

  const displayName = user.displayName?.trim() || user.name;
  const { complete } = getProfileCompletion(user);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl text-neutral-900">Settings</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Manage your account and Companion Mode profile.
        </p>
        <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-6">
          <Avatar name={displayName} avatarUrl={user.avatarUrl} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">{displayName}</p>
            <p className="truncate text-xs text-neutral-500">{user.email}</p>
          </div>
        </div>
        <div className="mt-6 space-y-2.5 border-t border-neutral-100 pt-6">
          <Link
            href={complete ? "/app/profile?edit=1" : "/app/profile"}
            className={`block text-center ${complete ? APP_SECONDARY_BUTTON : APP_PRIMARY_BUTTON}`}
          >
            {complete ? "Edit profile" : "Fill in your details"}
          </Link>
          {!complete ? (
            <p className="text-xs leading-relaxed text-amber-700">
              Your profile is incomplete. Fill in your details to unlock Companion Mode.
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-neutral-400">
            Signed in as {user.email}. Password changes and notification
            preferences are coming soon.
          </p>
        </div>
      </section>
    </main>
  );
}
