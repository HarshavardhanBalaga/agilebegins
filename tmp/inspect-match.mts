/* eslint-disable no-console */
// READ-ONLY inspection: queue/room/user state to diagnose phantom auto-match.
import { loadEnv } from "@/scripts/loadEnv";
loadEnv();
import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";

const db = await connectDB();
const now = new Date();

const qTotal = await db.collection(COLLECTIONS.MATCH_QUEUE).countDocuments();
const qLive = await db.collection(COLLECTIONS.MATCH_QUEUE).countDocuments({
  status: "waiting",
  expiresAt: { $gt: now },
});
const qByStatus = await db
  .collection(COLLECTIONS.MATCH_QUEUE)
  .aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }])
  .toArray();
const rTotal = await db.collection(COLLECTIONS.STUDY_ROOMS).countDocuments();
const rByStatus = await db
  .collection(COLLECTIONS.STUDY_ROOMS)
  .aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }])
  .toArray();
console.log(`queue total=${qTotal} live_waiting=${qLive} byStatus=${JSON.stringify(qByStatus)}`);
console.log(`rooms total=${rTotal} byStatus=${JSON.stringify(rByStatus)}`);

const queueDocs = await db
  .collection(COLLECTIONS.MATCH_QUEUE)
  .find({})
  .sort({ createdAt: -1 })
  .limit(20)
  .toArray();
for (const q of queueDocs) {
  const owner = await db.collection(COLLECTIONS.USERS).findOne({ _id: q.userId });
  console.log(
    `queue _id=${q._id} user=${q.userId} status=${q.status} created=${q.createdAt.toISOString()} expires=${q.expiresAt.toISOString()} live=${q.expiresAt > now} owner=${owner ? owner.email : "MISSING!"}`
  );
}

const roomDocs = await db
  .collection(COLLECTIONS.STUDY_ROOMS)
  .find({})
  .sort({ createdAt: -1 })
  .limit(20)
  .toArray();
for (const r of roomDocs) {
  const members = await db
    .collection(COLLECTIONS.USERS)
    .find({ _id: { $in: r.memberIds } })
    .project({ email: 1 })
    .toArray();
  console.log(
    `room _id=${r._id} status=${r.status} created=${r.createdAt.toISOString()} members=${r.memberIds.join(",")} emails=[${members.map((m) => m.email).join("|")}]`
  );
}
process.exit(0);
