import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/middlewares/auth";
import { getProfileCompletion, isEmailVerified } from "@/models/user";
import Avatar from "@/components/app/Avatar";
import { APP_LIME_BADGE, APP_SECONDARY_BUTTON } from "@/components/app/appTheme";
import { studyRoomRepository } from "@/repositories/studyRoomRepository";
import { userRepository } from "@/repositories/userRepository";

export const metadata: Metadata = {
  title: "Study Room",
  description: "Your matched study room.",
};

/**
 * GET /app/room/[id] — matched room shell (v1). Verifies membership
 * server-side; chat/tasks/sessions land here next.
 */
export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/find");
  if (!isEmailVerified(user)) redirect("/check-inbox");
  if (!getProfileCompletion(user).complete) redirect("/app/profile");

  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) redirect("/app/find");

  const { ObjectId } = await import("mongodb");
  const room = await studyRoomRepository.findActiveByIdForMember(
    new ObjectId(id),
    user._id
  );
  if (!room) redirect("/app/find");

  const partnerId = room.memberIds.find((memberId) => !memberId.equals(user._id));
  const partner = partnerId ? await userRepository.findById(partnerId) : null;
  const partnerName = partner
    ? partner.displayName?.trim() || partner.name
    : "Study partner";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl text-neutral-900">Study Room</h1>
          <span className={APP_LIME_BADGE}>Matched</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          You are paired with {partnerName}. Real-time chat, shared tasks, and
          study sessions will live here next.
        </p>
        <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-6">
          <Avatar
            name={partnerName}
            avatarUrl={partner?.avatarUrl}
            size={48}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">{partnerName}</p>
            <p className="text-xs text-neutral-500">Your accountability partner</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5 border-t border-neutral-100 pt-6">
          <Link href="/app/find" className={APP_SECONDARY_BUTTON}>
            Find another partner
          </Link>
          <Link href="/app" className={APP_SECONDARY_BUTTON}>
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
