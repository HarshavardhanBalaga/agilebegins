import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/middlewares/auth";
import { getProfileCompletion, isEmailVerified } from "@/models/user";
import RoomView from "@/components/app/RoomView";
import { studyRoomRepository } from "@/repositories/studyRoomRepository";
import { userRepository } from "@/repositories/userRepository";

export const metadata: Metadata = {
  title: "Study Room",
  description: "Your matched study room.",
};

/**
 * GET /app/room/[id] — matched room shell. Verifies membership server-side,
 * then hands polling + leave to the client RoomView. Closed/foreign ids go
 * back to /app/find (re-queue entry point); the staying partner learns about
 * a close via RoomView polling without a refresh.
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
      <RoomView
        roomId={id}
        partnerName={partnerName}
        {...(partner?.avatarUrl ? { partnerAvatarUrl: partner.avatarUrl } : {})}
      />
    </main>
  );
}
