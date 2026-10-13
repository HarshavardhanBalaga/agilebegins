import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/middlewares/auth";
import { getProfileCompletion, isEmailVerified } from "@/models/user";
import MatchFinder from "@/components/app/MatchFinder";
import AvailablePartners from "@/components/app/AvailablePartners";

export const metadata: Metadata = {
  title: "Find a Study Partner",
  description: "Get matched with another student for a live study session.",
};

/**
 * GET /app/find — searching surface. Incomplete profiles are sent back to
 * setup because matching requires a complete profile. Auto-match
 * (MatchFinder) and pick-from-list (AvailablePartners) share the page and
 * funnel into the same study rooms.
 */
export default async function FindPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/find");
  if (!isEmailVerified(user)) redirect("/check-inbox");
  if (!getProfileCompletion(user).complete) redirect("/app/profile");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <MatchFinder />
      <AvailablePartners />
    </main>
  );
}
