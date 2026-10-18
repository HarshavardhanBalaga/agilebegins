import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/middlewares/auth";
import { getProfileCompletion, isEmailVerified } from "@/models/user";
import MatchFinder from "@/components/app/MatchFinder";
import AvailablePartners from "@/components/app/AvailablePartners";

export const metadata: Metadata = {
  title: "Companion Mode",
  description: "Get matched with another student for a live study session.",
};

/**
 * GET /app/find — Companion Mode feature page. Single plain-flow section
 * (badge → heading → description → live matching action) followed by the
 * untouched students-available directory.
 */
export default async function FindPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/find");
  if (!isEmailVerified(user)) redirect("/verify-email");
  if (!getProfileCompletion(user).complete) redirect("/app/profile");

  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-col px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
      {/* Companion Mode — plain section with live matching functionality */}
      <div className="flex flex-col gap-12 sm:gap-14">
        <MatchFinder />
        <div className="border-t border-neutral-200" aria-hidden="true" />
        <section aria-label="Students available now">
          <AvailablePartners />
        </section>
      </div>
    </main>
  );
}
