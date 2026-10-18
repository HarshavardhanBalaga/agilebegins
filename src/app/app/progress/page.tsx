import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/middlewares/auth";
import { getProfileCompletion, isEmailVerified } from "@/models/user";
import { APP_PRIMARY_BUTTON } from "@/components/app/appTheme";

export const metadata: Metadata = {
  title: "Progress",
  description: "Your onboarding and learning progress.",
};

/**
 * GET /app/progress — progress hub. Today it reflects real profile-setup
 * progress (the only progress signal that exists); learning progress slots
 * in here later without renaming the route the navbar already points to.
 */
export default async function ProgressPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/progress");
  if (!isEmailVerified(user)) redirect("/verify-email");

  const { complete } = getProfileCompletion(user);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl text-neutral-900">Progress</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {complete
            ? "Your profile setup is complete. Learning progress will appear here as Companion Mode grows."
            : "Finish your profile setup to unlock Companion Mode. Learning progress will appear here next."}
        </p>
        <div className="mt-6 border-t border-neutral-100 pt-6">
          {complete ? (
            <p className="text-sm text-brand">Profile complete — nice work.</p>
          ) : (
            <>
              <p className="text-sm leading-relaxed font-medium text-amber-700">
                Complete your profile to unlock Companion Mode.
              </p>
              <Link
                href="/app/profile"
                className={`mt-4 inline-block ${APP_PRIMARY_BUTTON}`}
              >
                Continue setup
              </Link>
            </>
          )}
        </div>
        <div className="mt-6 border-t border-neutral-100 pt-6">
          <p className="text-sm font-medium text-neutral-900">Learning progress</p>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
            No learning activity yet. Once Companion Mode matching and sessions
            launch, your streaks and milestones will show up here.
          </p>
        </div>
      </section>
    </main>
  );
}
