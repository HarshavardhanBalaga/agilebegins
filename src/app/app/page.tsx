import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSessionUser } from "@/middlewares/auth";
import { getProfileCompletion, isEmailVerified } from "@/models/user";
import Avatar from "@/components/app/Avatar";
import {
  APP_LIME_BADGE,
  APP_PRIMARY_BUTTON_INLINE,
  APP_SECONDARY_BUTTON,
} from "@/components/app/appTheme";
import { STUDY_AVAILABILITY_LABELS } from "@/validators/profile";

export const metadata: Metadata = {
  title: "Home",
  description: "Your AgileBegins Companion Mode home.",
};

/**
 * GET /app — authenticated home. Shows a focused onboarding prompt when the
 * profile is incomplete and the updated profile status once complete.
 * Returning users with complete profiles never see onboarding again.
 */
export default async function AppPage({
  searchParams,
}: {
  searchParams?: Promise<{ welcome?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app");
  if (!isEmailVerified(user)) redirect("/check-inbox");

  const { complete, missing } = getProfileCompletion(user);
  const params = searchParams ? await searchParams : undefined;
  const justCompleted = params?.welcome === "profile-complete" && complete;
  const displayName = user.displayName?.trim() || user.name;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      {justCompleted ? (
        <p role="status" className="rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-brand">
          Profile saved. You are ready for Companion Mode.{" "}
          <span className={`ml-1 inline-block align-middle ${APP_LIME_BADGE}`}>Ready</span>
        </p>
      ) : null}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <Avatar name={displayName} avatarUrl={user.avatarUrl} size={52} />
          <div className="min-w-0">
            <p className="text-sm text-neutral-500">{complete ? "Welcome back," : "Welcome,"}</p>
            <h1 className="truncate text-2xl text-neutral-900">{displayName}</h1>
            <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
          </div>
        </div>
        {complete ? <CompleteBody user={user} /> : <OnboardingBody hasStarted={missing.length < 4} />}
      </section>
    </main>
  );
}

function CompleteBody({ user }: { user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>> }) {
  return (
    <div className="mt-6 border-t border-neutral-100 pt-6">
      <h2 className="text-base font-medium text-neutral-900">Your Companion Mode profile</h2>
      <dl className="mt-4 space-y-3 text-sm">
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
      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link href="/app/profile" className={APP_SECONDARY_BUTTON}>
          View profile
        </Link>
        <Link href="/app/progress" className={APP_SECONDARY_BUTTON}>
          View progress
        </Link>
      </div>
    </div>
  );
}

function OnboardingBody({ hasStarted }: { hasStarted: boolean }) {
  return (
    <div className="mt-6 border-t border-neutral-100 pt-6">
      <h2 className="text-base font-medium text-neutral-900">Set up your profile to unlock Companion Mode</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
        Tell us what you are learning and when you study so we can match you
        with the right companions. It takes about a minute.
      </p>
      <p className="mt-4 text-sm leading-relaxed font-medium text-amber-700">
        Complete your profile to unlock Companion Mode.
      </p>
      <Link href="/app/profile" className={`mt-4 inline-flex items-center gap-2 ${APP_PRIMARY_BUTTON_INLINE}`}>
        {hasStarted ? "Continue setup" : "Start profile setup"}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
