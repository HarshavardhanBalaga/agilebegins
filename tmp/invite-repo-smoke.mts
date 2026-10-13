/* eslint-disable no-console */
// Repo-level smoke: match_invites persistence, pair uniqueness, expiry,
// validators. No server-only imports (service is HTTP-tested separately).
import { ObjectId } from "mongodb";
import { loadEnv } from "@/scripts/loadEnv";
loadEnv();
import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import { invitePairKey } from "@/models/matchInvite";
import { matchInviteRepository as repo } from "@/repositories/matchInviteRepository";
import {
  matchInviteSchema,
  matchInviteRespondSchema,
  matchAvailableQuerySchema,
} from "@/validators/match";

let failures = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}`);
  if (!cond) failures += 1;
}

const a = new ObjectId();
const b = new ObjectId();
const outsider = new ObjectId();

// pairKey direction-free
check("pairKey symmetric", invitePairKey(a, b) === invitePairKey(b, a));

// create + read
const created = await repo.createPending(a, b);
check("create pending", !!created._id);
check(
  "findPendingById",
  (await repo.findPendingById(created._id))?._id.equals(created._id) === true
);
check(
  "findPendingBetween reverse",
  (await repo.findPendingBetween(b, a))?._id.equals(created._id) === true
);
check(
  "outsider pair → null",
  (await repo.findPendingBetween(a, outsider)) === null
);

// duplicate same direction → dup key; reverse → dup key (pairKey unique)
let dupSame = false;
try {
  await repo.createPending(a, b);
} catch (e) {
  dupSame = (e as { code?: number }).code === 11000;
}
check("duplicate same-direction → 11000", dupSame);
let dupReverse = false;
try {
  await repo.createPending(b, a);
} catch (e) {
  dupReverse = (e as { code?: number }).code === 11000;
}
check("duplicate reverse-direction → 11000", dupReverse);

// inbox
const inboxA = await repo.listPendingForUser(a);
const inboxB = await repo.listPendingForUser(b);
check("inbox A has 1", inboxA.length === 1);
check("inbox B has 1", inboxB.length === 1);
check(
  "inbox outsider empty",
  (await repo.listPendingForUser(outsider)).length === 0
);

// decline + re-invite allowed (unique only while pending)
const declined = await repo.markDeclined(created._id);
check("decline returns declined", declined?.status === "declined");
check("pending lookup null after decline", (await repo.findPendingById(created._id)) === null);
const second = await repo.createPending(a, b);
check("re-invite after decline allowed", !!second._id);

// sender cancel
check(
  "cancel by non-sender → false",
  (await repo.deletePendingBySender(second._id, b)) === false
);
check(
  "cancel by sender → true",
  (await repo.deletePendingBySender(second._id, a)) === true
);
check(
  "double cancel → false",
  (await repo.deletePendingBySender(second._id, a)) === false
);

// expired pending invisible
const db = await connectDB();
const expiredId = new ObjectId();
await db.collection(COLLECTIONS.MATCH_INVITES).insertOne({
  _id: expiredId,
  fromUserId: a,
  toUserId: outsider,
  pairKey: invitePairKey(a, outsider),
  status: "pending",
  createdAt: new Date(Date.now() - 10 * 60 * 1000),
  updatedAt: new Date(Date.now() - 10 * 60 * 1000),
  expiresAt: new Date(Date.now() - 5 * 60 * 1000),
});
check("expired findPendingById → null", (await repo.findPendingById(expiredId)) === null);
check("expired findPendingBetween → null", (await repo.findPendingBetween(a, outsider)) === null);
check("expired excluded from inbox", (await repo.listPendingForUser(a)).length === 0);

// validators
check("invite schema ok", matchInviteSchema.safeParse({ toUserId: b.toHexString() }).success);
check("invite self-shape ok (service rejects self)", matchInviteSchema.safeParse({ toUserId: a.toHexString() }).success);
check("invite bad id rejected", !matchInviteSchema.safeParse({ toUserId: "zzz" }).success);
check("invite unknown field rejected", !matchInviteSchema.safeParse({ toUserId: b.toHexString(), x: 1 }).success);
check("respond accept ok", matchInviteRespondSchema.safeParse({ action: "accept" }).success);
check("respond bad action rejected", !matchInviteRespondSchema.safeParse({ action: "maybe" }).success);
check("available limit coerce", matchAvailableQuerySchema.safeParse({ limit: "5" }).data?.limit === 5);
check("available limit overflow rejected", !matchAvailableQuerySchema.safeParse({ limit: "99" }).success);

// cleanup
await db.collection(COLLECTIONS.MATCH_INVITES).deleteMany({
  $or: [{ fromUserId: a }, { toUserId: a }, { fromUserId: b }, { toUserId: b }],
});
await db.collection(COLLECTIONS.MATCH_INVITES).deleteOne({ _id: expiredId });
console.log(failures === 0 ? "ALL INVITE REPO CHECKS PASSED" : `${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
