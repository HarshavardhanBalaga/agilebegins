import "server-only";
import { MongoServerError, ObjectId, type ClientSession } from "mongodb";
import { connectDB, withTransaction } from "@/lib/mongodb";
import {
  COLLECTIONS,
  MATCH_QUEUE_STATUS,
  ROLES,
  STUDY_ROOM_STATUS,
} from "@/lib/constants";
import { getProfileCompletion, isEmailVerified } from "@/models/user";
import type { UserDocument, UserProfile } from "@/models/user";
import { sortMemberIds, type StudyRoomDocument } from "@/models/studyRoom";
import type { MatchQueueDocument } from "@/models/matchQueue";
import { matchQueueRepository } from "@/repositories/matchQueueRepository";
import { studyRoomRepository } from "@/repositories/studyRoomRepository";
import { userRepository } from "@/repositories/userRepository";
import { AppError, httpError } from "@/lib/http";

export type MatchJoinResult =
  | {
      outcome: "searching";
      queueEntryId: string;
      position: number;
      waitSeconds: number;
      expiresAt: string;
    }
  | {
      outcome: "matched";
      roomId: string;
      queueEntryId: string;
      expiresAt: string;
    };

export type MatchStatusResult =
  | {
      status: "idle";
      roomId: null;
      profileComplete: boolean;
      missing: Array<keyof UserProfile>;
    }
  | {
      status: "searching";
      queueEntryId: string;
      position: number;
      waitSeconds: number;
      expiresAt: string;
    }
  | { status: "matched"; roomId: string };

export interface RoomPreview {
  id: string;
  status: "active";
  createdAt: string;
  partner: { id: string; displayName: string; avatarUrl?: string };
}

function assertMatchEligible(user: UserDocument): void {
  if (user.role !== ROLES.STUDENT) {
    throw httpError.forbidden("Only students can search for a study partner.");
  }
  if (!isEmailVerified(user)) {
    throw httpError.forbidden(
      "Please verify your email before searching for a study partner."
    );
  }
  const { complete, missing } = getProfileCompletion(user);
  if (!complete) {
    throw new AppError(
      "Complete your profile before searching for a study partner.",
      422,
      { profile: `Missing: ${missing.join(", ")}` },
      "PROFILE_INCOMPLETE"
    );
  }
}

function waitSecondsSince(createdAt: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 1000));
}

function isDuplicateKey(error: unknown): boolean {
  return (
    error instanceof MongoServerError &&
    (error.code === 11000 || error.code === 11001)
  );
}

function isRaceLoss(error: unknown): boolean {
  return (
    error instanceof AppError &&
    error.status === 409 &&
    error.code === "MATCH_RACE_LOST"
  );
}

export const matchService = {
  async join(user: UserDocument): Promise<MatchJoinResult> {
    assertMatchEligible(user);
    const now = new Date();
    const active = await studyRoomRepository.findActiveByMember(user._id);
    if (active) {
      // Self-heal: a room holder must never keep queue entries. A leftover
      // (from a racy join insert) would be claimed by every future match
      // attempt and released back on abort — "repeatedly selected" until the
      // lease expires (invariants 1 and 3).
      await matchQueueRepository.deleteAllForUser(user._id).catch(() => undefined);
      throw httpError.conflict(
        "You already have an active study room.",
        "ACTIVE_ROOM_EXISTS"
      );
    }
    const existing = await matchQueueRepository.findLiveByUser(user._id, now);
    if (existing) {
      if (existing.status === MATCH_QUEUE_STATUS.WAITING) {
        const touched =
          (await matchQueueRepository.touch(existing._id, now)) ?? existing;
        return {
          outcome: "searching",
          queueEntryId: touched._id.toHexString(),
          position: await matchQueueRepository.positionOf(touched, now),
          waitSeconds: waitSecondsSince(touched.createdAt, now),
          expiresAt: touched.expiresAt.toISOString(),
        };
      }
      // Own entry is mid-commit (claimed by a peer's matcher): stay
      // "searching" on the same entry. Inserting again would trip the
      // waiting-unique index path or strand a duplicate.
      return {
        outcome: "searching",
        queueEntryId: existing._id.toHexString(),
        position: await matchQueueRepository.positionOf(existing, now),
        waitSeconds: waitSecondsSince(existing.createdAt, now),
        expiresAt: existing.expiresAt.toISOString(),
      };
    }
    let entry: MatchQueueDocument;
    try {
      entry = await matchQueueRepository.insertWaiting(user._id, now);
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      const winner = await matchQueueRepository.findLiveByUser(user._id, now);
      if (!winner) throw error;
      if (winner.status !== MATCH_QUEUE_STATUS.WAITING) {
        return {
          outcome: "searching",
          queueEntryId: winner._id.toHexString(),
          position: await matchQueueRepository.positionOf(winner, now),
          waitSeconds: waitSecondsSince(winner.createdAt, now),
          expiresAt: winner.expiresAt.toISOString(),
        };
      }
      const touched =
        (await matchQueueRepository.touch(winner._id, now)) ?? winner;
      return {
        outcome: "searching",
        queueEntryId: touched._id.toHexString(),
        position: await matchQueueRepository.positionOf(touched, now),
        waitSeconds: waitSecondsSince(touched.createdAt, now),
        expiresAt: touched.expiresAt.toISOString(),
      };
    }
    const roomId = await tryMatch(entry, now);
    if (roomId) {
      return {
        outcome: "matched",
        roomId: roomId.toHexString(),
        queueEntryId: entry._id.toHexString(),
        expiresAt: entry.expiresAt.toISOString(),
      };
    }
    // Re-check for a room after the match attempt: the active-room check at
    // the top of join can race a concurrent commit that matched this user
    // (second tab / retry / another device). Reporting "searching" would keep
    // the client polling and leave a claimable entry for a matched user.
    const activeAfter = await studyRoomRepository.findActiveByMember(user._id);
    if (activeAfter) {
      await matchQueueRepository.deleteAllForUser(user._id).catch(() => undefined);
      return {
        outcome: "matched",
        roomId: activeAfter._id.toHexString(),
        queueEntryId: entry._id.toHexString(),
        expiresAt: entry.expiresAt.toISOString(),
      };
    }
    return {
      outcome: "searching",
      queueEntryId: entry._id.toHexString(),
      position: await matchQueueRepository.positionOf(entry, now),
      waitSeconds: 0,
      expiresAt: entry.expiresAt.toISOString(),
    };
  },

  async status(user: UserDocument): Promise<MatchStatusResult> {
    const now = new Date();
    const active = await studyRoomRepository.findActiveByMember(user._id);
    if (active) {
      // Self-heal: drop any leftover queue entry the moment a matched user is
      // seen, so they leave the candidate pool immediately (invariant 1).
      await matchQueueRepository.deleteAllForUser(user._id).catch(() => undefined);
      return { status: "matched", roomId: active._id.toHexString() };
    }
    // Claimed-but-not-yet-committed entries are still "searching" for the
    // owner. Reporting idle here makes the client leave the searching state
    // while a room is about to exist (invariant 7).
    const live = await matchQueueRepository.findLiveByUser(user._id, now);
    if (!live) {
      const { complete, missing } = getProfileCompletion(user);
      return { status: "idle", roomId: null, profileComplete: complete, missing };
    }
    if (live.status !== MATCH_QUEUE_STATUS.WAITING) {
      return {
        status: "searching",
        queueEntryId: live._id.toHexString(),
        position: await matchQueueRepository.positionOf(live, now),
        waitSeconds: waitSecondsSince(live.createdAt, now),
        expiresAt: live.expiresAt.toISOString(),
      };
    }
    const entry = live;
    const touched = (await matchQueueRepository.touch(entry._id, now)) ?? entry;
    return {
      status: "searching",
      queueEntryId: touched._id.toHexString(),
      position: await matchQueueRepository.positionOf(touched, now),
      waitSeconds: waitSecondsSince(touched.createdAt, now),
      expiresAt: touched.expiresAt.toISOString(),
    };
  },

  async cancel(user: UserDocument): Promise<MatchStatusResult> {
    await matchQueueRepository.cancelWaiting(user._id);
    const active = await studyRoomRepository.findActiveByMember(user._id);
    if (active) return { status: "matched", roomId: active._id.toHexString() };
    const { complete, missing } = getProfileCompletion(user);
    return { status: "idle", roomId: null, profileComplete: complete, missing };
  },

  async room(
    user: UserDocument,
    roomId?: ObjectId
  ): Promise<{ room: RoomPreview | null }> {
    const active = roomId
      ? await studyRoomRepository.findActiveByIdForMember(roomId, user._id)
      : await studyRoomRepository.findActiveByMember(user._id);
    if (!active) return { room: null };
    const partnerId = active.memberIds.find((id) => !id.equals(user._id));
    if (!partnerId) return { room: null };
    const partner = await userRepository.findById(partnerId);
    if (!partner) return { room: null };
    return {
      room: {
        id: active._id.toHexString(),
        status: "active",
        createdAt: active.createdAt.toISOString(),
        partner: {
          id: partner._id.toHexString(),
          displayName: partner.displayName?.trim() || partner.name,
          ...(partner.avatarUrl ? { avatarUrl: partner.avatarUrl } : {}),
        },
      },
    };
  },
};

/**
 * Upper bound on stale candidates a single match attempt will claim-and-skip.
 * A healthy queue never needs more than one claim; the bound only guards
 * against pathological numbers of leftover entries.
 */
const MAX_CLAIM_CANDIDATES = 5;

async function tryMatch(
  entry: MatchQueueDocument,
  now = new Date()
): Promise<ObjectId | null> {
  for (let attempt = 0; attempt < MAX_CLAIM_CANDIDATES; attempt++) {
    const peer = await matchQueueRepository.claimOldestPeer(
      entry.userId,
      entry.userId,
      now,
      { createdAt: entry.createdAt, _id: entry._id }
    );
    if (!peer) return null;
    // Invariant 3: candidate selection must exclude users whose active-room
    // status changed since they queued. The claim itself is queue-local and
    // can still land on such a leftover entry, so verify before committing —
    // and delete the garbage entry so no future joiner ever claims it again.
    const peerRoom = await studyRoomRepository.findActiveByMember(peer.userId);
    if (peerRoom) {
      await matchQueueRepository
        .deleteAllForUser(peer.userId)
        .catch(() => undefined);
      continue;
    }
    return commitMatch(entry, peer, now);
  }
  return null;
}

/**
 * Abort-path cleanup (invariants 1 and 4). The abort may be caused by either
 * participant already owning an active room: that participant's queue entries
 * can never match again and are deleted; the other participant is returned to
 * plain waiting where applicable. Releasing a room holder's entry back to
 * `waiting` (the old behavior) left it claimable forever — every new joiner
 * selected the same matched user, aborted, and never matched anyone.
 */
async function healAfterAbort(
  entry: MatchQueueDocument,
  peer: MatchQueueDocument
): Promise<void> {
  const [mineRoom, peerRoom] = await Promise.all([
    studyRoomRepository.findActiveByMember(entry.userId),
    studyRoomRepository.findActiveByMember(peer.userId),
  ]);
  if (peerRoom) {
    await matchQueueRepository
      .deleteAllForUser(peer.userId)
      .catch(() => undefined);
  } else {
    await matchQueueRepository
      .releaseClaim(peer._id, entry.userId)
      .catch(() => undefined);
  }
  if (mineRoom) {
    await matchQueueRepository
      .deleteAllForUser(entry.userId)
      .catch(() => undefined);
  }
}

async function commitMatch(
  entry: MatchQueueDocument,
  peer: MatchQueueDocument,
  now = new Date()
): Promise<ObjectId | null> {
  const commit = async (session: ClientSession | undefined) => {
    const db = await connectDB();
    const queue = db.collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE);
    const opts = session ? { session } : {};
    const mine = await queue.findOne({ _id: entry._id }, opts);
    const theirs = await queue.findOne({ _id: peer._id }, opts);
    if (
      !mine ||
      !theirs ||
      mine.status !== MATCH_QUEUE_STATUS.WAITING ||
      theirs.status !== MATCH_QUEUE_STATUS.CLAIMED ||
      mine.expiresAt <= now ||
      theirs.expiresAt <= now
    ) {
      throw httpError.conflict("Match window expired.", "MATCH_RACE_LOST");
    }
    const rooms = db.collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS);
    const [existingMine, existingTheirs] = await Promise.all([
      rooms.findOne(
        { memberIds: entry.userId, status: STUDY_ROOM_STATUS.ACTIVE },
        opts
      ),
      rooms.findOne(
        { memberIds: peer.userId, status: STUDY_ROOM_STATUS.ACTIVE },
        opts
      ),
    ]);
    if (existingMine ?? existingTheirs) {
      throw httpError.conflict("Already in a study room.", "MATCH_RACE_LOST");
    }
    const pair = sortMemberIds(entry.userId, peer.userId);
    const room: StudyRoomDocument = {
      _id: new ObjectId(),
      memberIds: [pair[0], pair[1]],
      status: STUDY_ROOM_STATUS.ACTIVE,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };
    await rooms.insertOne(room, opts);
    await queue.deleteOne({ _id: entry._id }, opts);
    await queue.deleteOne({ _id: peer._id }, opts);
    return room._id;
  };

  try {
    const out = await withTransaction(commit);
    return out.result;
  } catch (error) {
    if (isRaceLoss(error)) {
      await healAfterAbort(entry, peer);
      return null;
    }
    return commitStandalone(entry, peer, now);
  }
}

async function commitStandalone(
  entry: MatchQueueDocument,
  peer: MatchQueueDocument,
  now = new Date()
): Promise<ObjectId | null> {
  const db = await connectDB();
  const queue = db.collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE);
  const rooms = db.collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS);
  const found = await Promise.all([
    queue.findOne({ _id: entry._id }),
    queue.findOne({ _id: peer._id }),
  ]);
  const mine = found[0];
  const theirs = found[1];
  if (
    !mine ||
    !theirs ||
    mine.status !== MATCH_QUEUE_STATUS.WAITING ||
    theirs.status !== MATCH_QUEUE_STATUS.CLAIMED ||
    mine.expiresAt <= now ||
    theirs.expiresAt <= now
  ) {
    await matchQueueRepository
      .releaseClaim(peer._id, entry.userId)
      .catch(() => undefined);
    return null;
  }
  const actives = await Promise.all([
    rooms.findOne({ memberIds: entry.userId, status: STUDY_ROOM_STATUS.ACTIVE }),
    rooms.findOne({ memberIds: peer.userId, status: STUDY_ROOM_STATUS.ACTIVE }),
  ]);
  if (actives[0] ?? actives[1]) {
    // Same heal as the transactional abort path: a room holder's entries are
    // deleted; the other participant goes back to plain waiting.
    if (actives[1]) {
      await matchQueueRepository
        .deleteAllForUser(peer.userId)
        .catch(() => undefined);
    } else {
      await matchQueueRepository
        .releaseClaim(peer._id, entry.userId)
        .catch(() => undefined);
    }
    if (actives[0]) {
      await matchQueueRepository
        .deleteAllForUser(entry.userId)
        .catch(() => undefined);
    }
    return null;
  }
  const pair = sortMemberIds(entry.userId, peer.userId);
  const room: StudyRoomDocument = {
    _id: new ObjectId(),
    memberIds: [pair[0], pair[1]],
    status: STUDY_ROOM_STATUS.ACTIVE,
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
  };
  try {
    await rooms.insertOne(room);
  } catch (error) {
    // A dup key means a concurrent commit already put one of the two into a
    // room (unique active-members index) — heal instead of blindly releasing,
    // so a room holder's entry cannot re-enter the candidate pool.
    await healAfterAbort(entry, peer);
    if (isDuplicateKey(error)) return null;
    throw error;
  }
  let cleaned = false;
  try {
    const deletions = await Promise.all([
      queue.deleteOne({ _id: entry._id }),
      queue.deleteOne({ _id: peer._id }),
    ]);
    cleaned = deletions[0].deletedCount === 1 && deletions[1].deletedCount === 1;
  } catch {
    cleaned = false;
  }
  if (!cleaned) {
    // Compensation must also run when a delete REJECTS (network blip) — a
    // thrown error here used to skip it, leaving the committed room plus two
    // live queue entries behind; both users then stayed match candidates
    // (invariants 1 and 4). Both are now garbage: they have a room.
    await matchQueueRepository.deleteAllForUser(entry.userId).catch(() => undefined);
    await matchQueueRepository.deleteAllForUser(peer.userId).catch(() => undefined);
  }
  return room._id;
}

