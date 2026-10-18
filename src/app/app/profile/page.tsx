import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/middlewares/auth";
import { getProfileCompletion, isEmailVerified } from "@/models/user";
import Avatar from "@/components/app/Avatar";
import { APP_SECONDARY_BUTTON } from "@/components/app/appTheme";
import { STUDY_AVAILABILITY_LABELS } from "@/validators/profile";
import ProfileForm from "@/components/app/ProfileForm";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your AgileBegins Companion Mode profile.",
};

/**
 * GET /app/profile — details-first profile page.
 *
 * - Not filled yet: shows the setup form right here (same form, same rules).
 * - Filled: shows read-only details. Editing is only possible through
 *   Settings → "Edit profile" (?edit=1), which renders the same form.
 */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/profile");
  if (!isEmailVerified(user)) redirect("/verify-email");

  const { complete } = getProfileCompletion(user);
  const params = searchParams ? await searchParams : undefined;
  const editing = params?.edit === "1";

  // Fresh visitors with nothing filled: land on the form, not the details.
  if (!complete && !editing) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
        <ProfileForm
          initial={{
            displayName: user.displayName?.trim() || user.name,
            avatarUrl: user.avatarUrl ?? "",
            learningInterests: user.learningInterests ?? [],
            learningGoals: user.learningGoals ?? "",
            studyAvailability: user.studyAvailability ?? null,
          }}
        />
      </main>
    );
  }

  // Editing is only unlocked from Settings (or the setup flow itself).
  if (editing) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
        <ProfileForm
          mode={complete ? "edit" : "setup"}
          returnTo={complete ? "/app/profile" : "/app"}
          initial={{
            displayName: user.displayName?.trim() || user.name,
            avatarUrl: user.avatarUrl ?? "",
            learningInterests: user.learningInterests ?? [],
            learningGoals: user.learningGoals ?? "",
            studyAvailability: user.studyAvailability ?? null,
          }}
        />
      </main>
    );
  }

  // Filled profile: read-only details only. Changes go via Settings.
  const displayName = user.displayName?.trim() || user.name;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="rounded-full border-2 border-accent p-0.5">
            <Avatar name={displayName} avatarUrl={user.avatarUrl} size={52} />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-neutral-500">Your profile</p>
            <h1 className="truncate text-2xl text-neutral-900">{displayName}</h1>
            <p className="mt-1 truncate text-sm text-neutral-500">{user.email}</p>
          </div>
        </div>
        <dl className="mt-6 space-y-3 border-t border-neutral-100 pt-6 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
            <dt className="w-36 shrink-0 text-neutral-500">Interests</dt>
            <dd className="text-neutral-900">{(user.learningInterests ?? []).join(", ")}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
            <dt className="w-36 shrink-0 text-neutral-500">Goals</dt>
            <dd className="text-neutral-900">{user.learningGoals}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
            <dt className="w-36 shrink-0 text-neutral-500">Availability</dt>
            <dd className="text-neutral-900">
              {user.studyAvailability ? STUDY_AVAILABILITY_LABELS[user.studyAvailability] : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-6 border-t border-neutral-100 pt-6 text-sm leading-relaxed text-neutral-500">
          To change these details, go to{" "}
          <Link href="/app/settings" className="font-medium text-brand underline">
            Settings
          </Link>{" "}
          and choose “Edit profile”.
        </p>
        <Link href="/app/settings" className={`mt-4 inline-block ${APP_SECONDARY_BUTTON}`}>
          Go to settings
        </Link>
      </section>
    </main>
  );
}
