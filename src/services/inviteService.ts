import "server-only";
import { MongoServerError, ObjectId, type ClientSession } from "mongodb";
import { connectDB, withTransaction } from "@/lib/mongodb";
import {
  COLLECTIONS,
  MATCH_AVAILABLE_LIMIT,
  MATCH_INVITE_STATUS,
  ROLES,
  STUDY_ROOM_STATUS,
} from "@/lib/constants";
import { getProfileCompletion, isEmailVerified } from "@/models/user";
import type { UserDocument } from "@/models/user";
import { sortMemberIds, type StudyRoomDocument } from "@/models/studyRoom";
import type { MatchQueueDocument } from "@/models/matchQueue";
import type { MatchInviteDocument } from "@/models/matchInvite";
import { matchInviteRepository } from "@/repositories/matchInviteRepository";
import { matchQueueRepository } from "@/repositories/matchQueueRepository";
import { studyRoomRepository } from "@/repositories/studyRoomRepository";
import { userRepository } from "@/repositories/userRepository";
import { AppError } from "@/lib/http";
import { assertMatchEligible } from "@/services/matchService";

export interface AvailableStudent {
  id: string;
  displayName: string;
  avatarUrl?: string;
  waitSeconds: number;
}

export type InviteDirection = "incoming" | "outgoing";

export interface InvitePreview {
  id: string;
  status: "pending" | "accepted" | "declined";
  direction: InviteDirection;
  counterpart: { id: string; displayName: string; avatarUrl?: string };
  createdAt: string;
  expiresAt: string;
  roomId?: string;
}

function unavailable(): AppError {
  return new AppError(
    "That student is no longer available. Pick someone else or try auto-match.",
    409,
    undefined,
    "INVITE_UNAVAILABLE"
  );
}

function previewFor(user: UserDocument): {
  id: string;
  displayName: string;
  avatarUrl?: string;
} {
  return {
    id: user._id.toHexString(),
    displayName: user.displayName?.trim() || user.name,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
  };
}

function toPreview(
  doc: MatchInviteDocument,
  caller: ObjectId,
  counterpart: UserDocument
): InvitePreview {
  const outgoing = doc.fromUserId.equals(caller);
  return {
    id: doc._id.toHexString(),
    status: doc.status,
    direction: outgoing ? "outgoing" : "incoming",
    counterpart: previewFor(counterpart),
    createdAt: doc.createdAt.toISOString(),
    expiresAt: doc.expiresAt.toISOString(),
    ...(doc.roomId ? { roomId: doc.roomId.toHexString() } : {}),
  };
}

function peerAvailable(peer: UserDocument | null): peer is UserDocument {
  if (!peer || peer.role !== ROLES.STUDENT) return false;
  if (!isEmailVerified(peer)) return false;
  return getProfileCompletion(peer).complete;
}

export const inviteService = {
  /**
   * Directory of currently-searching students (minimal preview only).
   * Only live waiting entries; room-holders and ineligible accounts are
   * skipped. The viewer must be match-eligible (same gate as join).
   */
  async listAvailable(
    viewer: UserDocument,
    limit?: number
  ): Promise<{ users: AvailableStudent[] }> {
    assertMatchEligible(viewer);
    const now = new Date();
    const take = Math.min(
      Math.max(limit ?? MATCH_AVAILABLE_LIMIT, 1),
      MATCH_AVAILABLE_LIMIT
    );
    const db = await connectDB();
    // Over-fetch slightly: stale room-holder leftovers are filtered below
    // (self-heal keeps them rare) so the page stays full.
    const entries = await db
      .collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE)
      .find({
        userId: { $ne: viewer._id },
        status: "waiting",
        expiresAt: { $gt: now },
      })
      .sort({ createdAt: 1 })
      .limit(Math.min(take * 2, 40))
      .toArray();
    const users: AvailableStudent[] = [];
    for (const entry of entries) {
      if (users.length >= take) break;
      const [room, candidate] = await Promise.all([
        studyRoomRepository.findActiveByMember(entry.userId),
        userRepository.findById(entry.userId),
      ]);
      if (room || !peerAvailable(candidate)) continue;
      const preview = previewFor(candidate);
      users.push({
        ...preview,
        waitSeconds: Math.max(
          0,
          Math.floor((now.getTime() - entry.createdAt.getTime()) / 1000)
        ),
      });
    }
    return { users };
  },

  /**
   * Picks a student: creates a pending invite (idempotent per pair).
   * A reverse pending invite (they picked you first) surfaces as 409
   * PENDING_INVITE_EXISTS so the client can offer Accept instead.
   */
  async sendInvite(
    sender: UserDocument,
    toUserId: ObjectId
  ): Promise<{ invite: InvitePreview }> {
    assertMatchEligible(sender);
    if (sender._id.equals(toUserId)) {
      throw new AppError("You cannot invite yourself.", 400);
    }
    const now = new Date();
    const peer = await userRepository.findById(toUserId);
    if (!peerAvailable(peer)) {
      // Non-revealing: unknown, non-student, unverified, or incomplete peers
      // all look the same as "not available".
      throw new AppError("That student is not available.", 404);
    }
    const senderRoom = await studyRoomRepository.findActiveByMember(sender._id);
    if (senderRoom) {
      await matchQueueRepository.deleteAllForUser(sender._id).catch(() => undefined);
      const roomId = senderRoom._id.toHexString();
      throw new AppError(
        "You already have an active study room.",
        409,
        { roomId },
        "ACTIVE_ROOM_EXISTS"
      );
    }
    // Pending-pair check comes before the waiting check: a reverse invite
    // (they picked you first) must surface 409 PENDING_INVITE_EXISTS even
    // when the other side already left the queue — accepting still works
    // because the accept commit does not require either party to be queued.
    const existing = await matchInviteRepository.findPendingBetween(
      sender._id,
      peer._id,
      now
    );
    if (existing) {
      if (existing.fromUserId.equals(sender._id)) {
        return {
          invite: toPreview(existing, sender._id, peer),
        };
      }
      throw new AppError(
        "That student already invited you — accept their invite instead.",
        409,
        { inviteId: existing._id.toHexString() },
        "PENDING_INVITE_EXISTS"
      );
    }
    const [peerRoom, peerWaiting] = await Promise.all([
      studyRoomRepository.findActiveByMember(peer._id),
      matchQueueRepository.findWaitingByUser(peer._id, now),
    ]);
    if (peerRoom || !peerWaiting) {
      throw new AppError("That student is not available.", 404);
    }
    try {
      const created = await matchInviteRepository.createPending(
        sender._id,
        peer._id,
        now
      );
      return { invite: toPreview(created, sender._id, peer) };
    } catch (error) {
      if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
      // Lost a same-pair insert race: return the winner (idempotent).
      const winner = await matchInviteRepository.findPendingBetween(
        sender._id,
        peer._id,
        now
      );
      if (!winner) throw error;
      if (winner.fromUserId.equals(sender._id)) {
        return { invite: toPreview(winner, sender._id, peer) };
      }
      throw new AppError(
        "That student already invited you — accept their invite instead.",
        409,
        { inviteId: winner._id.toHexString() },
        "PENDING_INVITE_EXISTS"
      );
    }
  },

  /** Pending inbox (incoming + outgoing) for the caller. */
  async listInvites(
    caller: UserDocument
  ): Promise<{ invites: InvitePreview[] }> {
    assertMatchEligible(caller);
    const now = new Date();
    const docs = await matchInviteRepository.listPendingForUser(caller._id, now);
    const invites: InvitePreview[] = [];
    for (const doc of docs) {
      const otherId = doc.fromUserId.equals(caller._id) ? doc.toUserId : doc.fromUserId;
      const other = await userRepository.findById(otherId);
      if (!other) continue;
      invites.push(toPreview(doc, caller._id, other));
    }
    return { invites };
  },

  /**
   * Accepts (transactional room commit) or declines an invite.
   * Accept re-validates everything the FIFO commit checks: invite still
   * pending + live, caller eligible, peer eligible, neither in an active
   * room. Any loss surfaces 409/404 — never a half-room (no claim step, so
   * aborts need no healing; the invite simply stays pending or the client
   * sees the room that won).
   */
  async respond(
    caller: UserDocument,
    inviteId: ObjectId,
    action: "accept" | "decline"
  ): Promise<
    | { status: "accepted"; roomId: string }
    | { status: "declined" }
  > {
    const now = new Date();
    const invite = await matchInviteRepository.findPendingById(inviteId, now);
    if (!invite) return resolveFinishedInvite(inviteId);
    const isSender = invite.fromUserId.equals(caller._id);
    const isRecipient = invite.toUserId.equals(caller._id);
    if (!isSender && !isRecipient) {
      throw new AppError("Invitation not found.", 404);
    }
    if (action === "decline") {
      if (!isRecipient) {
        throw new AppError(
          "Only the invited student can decline. Cancel your outgoing invite instead.",
          400
        );
      }
      const declined = await matchInviteRepository.markDeclined(inviteId, new Date());
      if (!declined) return resolveFinishedInvite(inviteId);
      return { status: "declined" };
    }
    if (!isRecipient) {
      throw new AppError("Only the invited student can accept.", 403);
    }
    assertMatchEligible(caller);
    const peer = await userRepository.findById(invite.fromUserId);
    if (!peerAvailable(peer)) throw unavailable();
    const callerRoom = await studyRoomRepository.findActiveByMember(caller._id);
    if (callerRoom) {
      await matchQueueRepository.deleteAllForUser(caller._id).catch(() => undefined);
      const roomId = callerRoom._id.toHexString();
      throw new AppError(
        "You already have an active study room.",
        409,
        { roomId },
        "ACTIVE_ROOM_EXISTS"
      );
    }
    const peerRoom = await studyRoomRepository.findActiveByMember(peer._id);
    if (peerRoom) throw unavailable();
    const roomId = await commitInviteAccept(invite, caller, peer, now);
    return { status: "accepted", roomId: roomId.toHexString() };
  },

  /**
   * Sender-only cancel of a pending invite. Accepted invites are returned
   * (never undone); declined/missing ones resolve to their terminal state.
   */
  async cancelInvite(
    caller: UserDocument,
    inviteId: ObjectId
  ): Promise<
    | { status: "cancelled" }
    | { status: "accepted"; roomId: string }
    | { status: "declined" }
  > {
    assertMatchEligible(caller);
    const invite = await matchInviteRepository.findById(inviteId);
    if (!invite || !invite.fromUserId.equals(caller._id)) {
      // Non-revealing: foreign and unknown ids look identical.
      throw new AppError("Invitation not found.", 404);
    }
    if (invite.status === MATCH_INVITE_STATUS.ACCEPTED) {
      if (!invite.roomId) throw new AppError("Invitation not found.", 404);
      return { status: "accepted", roomId: invite.roomId.toHexString() };
    }
    if (invite.status === MATCH_INVITE_STATUS.DECLINED) {
      return { status: "declined" };
    }
    const removed = await matchInviteRepository.deletePendingBySender(
      inviteId,
      caller._id
    );
    if (removed) return { status: "cancelled" };
    // Raced a resolve: report the terminal state instead of failing.
    return resolveFinishedInvite(inviteId);
  },
};

/** Maps a non-pending invite id to its terminal response (idempotent retries). */
async function resolveFinishedInvite(
  inviteId: ObjectId
): Promise<{ status: "accepted"; roomId: string } | { status: "declined" }> {
  const doc = await matchInviteRepository.findById(inviteId);
  if (doc?.status === MATCH_INVITE_STATUS.ACCEPTED && doc.roomId) {
    return { status: "accepted", roomId: doc.roomId.toHexString() };
  }
  if (doc?.status === MATCH_INVITE_STATUS.DECLINED) {
    return { status: "declined" };
  }
  throw new AppError("Invitation not found.", 404);
}

function isDuplicateKey(error: unknown): boolean {
  return (
    error instanceof MongoServerError &&
    (error.code === 11000 || error.code === 11001)
  );
}

/**
 * Transactional accept: invite still pending+live, neither party in an
 * active room, one room doc, both queue entries removed, invite marked
 * accepted with roomId — atomically. On standalone MongoDB the same work
 * runs without a session; a crash between writes self-heals via the
 * room-holder queue cleanup (join/status) and ACTIVE_ROOM_EXISTS on retry.
 */
async function commitInviteAccept(
  invite: MatchInviteDocument,
  caller: UserDocument,
  peer: UserDocument,
  now: Date
): Promise<ObjectId> {
  const commit = async (session: ClientSession | undefined) => {
    const db = await connectDB();
    const opts = session ? { session } : {};
    const invites = db.collection<MatchInviteDocument>(COLLECTIONS.MATCH_INVITES);
    const live = await invites.findOne(
      {
        _id: invite._id,
        status: MATCH_INVITE_STATUS.PENDING,
        expiresAt: { $gt: now },
      },
      opts
    );
    if (!live) throw unavailable();
    const rooms = db.collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS);
    const [mineRoom, peerRoom] = await Promise.all([
      rooms.findOne(
        { memberIds: caller._id, status: STUDY_ROOM_STATUS.ACTIVE },
        opts
      ),
      rooms.findOne(
        { memberIds: peer._id, status: STUDY_ROOM_STATUS.ACTIVE },
        opts
      ),
    ]);
    if (mineRoom) {
      const roomId = mineRoom._id.toHexString();
      throw new AppError(
        "You already have an active study room.",
        409,
        { roomId },
        "ACTIVE_ROOM_EXISTS"
      );
    }
    if (peerRoom) throw unavailable();
    const pair = sortMemberIds(caller._id, peer._id);
    const room: StudyRoomDocument = {
      _id: new ObjectId(),
      memberIds: [pair[0], pair[1]],
      status: STUDY_ROOM_STATUS.ACTIVE,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };
    try {
      await rooms.insertOne(room, opts);
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      // A concurrent commit put someone in a room: report whose.
      const [m2, p2] = await Promise.all([
        rooms.findOne(
          { memberIds: caller._id, status: STUDY_ROOM_STATUS.ACTIVE },
          opts
        ),
        rooms.findOne(
          { memberIds: peer._id, status: STUDY_ROOM_STATUS.ACTIVE },
          opts
        ),
      ]);
      if (m2) {
        const roomId = m2._id.toHexString();
        throw new AppError(
          "You already have an active study room.",
          409,
          { roomId },
          "ACTIVE_ROOM_EXISTS"
        );
      }
      void p2;
      throw unavailable();
    }
    const queue = db.collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE);
    await queue.deleteMany({ userId: caller._id }, opts);
    await queue.deleteMany({ userId: peer._id }, opts);
    await invites.updateOne(
      { _id: invite._id },
      {
        $set: {
          status: MATCH_INVITE_STATUS.ACCEPTED,
          roomId: room._id,
          updatedAt: now,
        },
      },
      opts
    );
    return room._id;
  };

  const out = await withTransaction(commit);
  return out.result;
}
