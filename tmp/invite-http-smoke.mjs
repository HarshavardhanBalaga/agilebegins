// Live HTTP smoke: pick-from-list invite flow + guards.
// Run against `npm run start -- --port 3100`. Cleans up all test records.
import fs from "node:fs";
import { MongoClient } from "mongodb";

const BASE = "http://localhost:3100";
const TAG = `pick${Date.now().toString(36)}`;

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = loadEnv();
const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db(env.DB_NAME);

let failures = 0;
function check(name, cond, extra = "") {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra && !cond ? ` :: ${extra}` : ""}`);
  if (!cond) failures += 1;
}

function jarOf(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  return raw
    .map((c) => c.split(";")[0])
    .filter((c) => c.startsWith("access_token=") || c.startsWith("refresh_token="))
    .join("; ");
}

async function req(method, path, { jar = "", body, raw } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(jar ? { Cookie: jar } : {}),
      ...(body !== undefined || raw !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });
  let parsed = {};
  try {
    parsed = await res.json();
  } catch {}
  return { status: res.status, body: parsed, jar: jarOf(res) };
}

const email = (t) => `${TAG}+${t}@example.com`;
const PASS = "SmokePass123!";
const jars = {};

async function register(t) {
  const r = await req("POST", "/api/auth/register", {
    body: { name: `Pick ${t}`, email: email(t), password: PASS, confirmPassword: PASS },
  });
  check(`register ${t}`, r.status === 200, JSON.stringify(r.body).slice(0, 200));
  if (r.jar) jars[t] = r.jar;
  return r;
}

async function makeEligible(t) {
  await db.collection("users").updateOne(
    { email: email(t) },
    {
      $set: {
        emailVerified: true,
        displayName: `Picker ${t.toUpperCase()}`,
        learningInterests: ["Web development"],
        learningGoals: "Become a disciplined full-stack developer.",
        studyAvailability: "flexible",
      },
    }
  );
}

const userIdOf = async (t) =>
  (await db.collection("users").findOne({ email: email(t) }))?._id;

// ---------- A & B: full invite flow ----------
await register("a");
await makeEligible("a");
await register("b");
await makeEligible("b");
const idA = await userIdOf("a");
const idB = await userIdOf("b");

let r = await req("POST", "/api/match/join", { jar: jars.a, body: {} });
check("A join → searching", r.status === 200 && r.body.status === "searching" && !!r.body.queueEntryId, JSON.stringify(r.body).slice(0, 200));
const qA = r.body.queueEntryId;

r = await req("POST", "/api/match/join", { jar: jars.a, body: {} });
check("A re-join idempotent (same entry)", r.status === 200 && r.body.queueEntryId === qA, JSON.stringify(r.body).slice(0, 200));

r = await req("GET", "/api/match/available", { jar: jars.b });
const seenA = (r.body.users ?? []).find((u) => u.id === idA.toHexString());
check("B directory lists A", r.status === 200 && !!seenA, JSON.stringify(r.body).slice(0, 300));
check("directory leaks no email", r.status === 200 && !JSON.stringify(r.body.users ?? []).includes("example.com"), "email leaked!");

r = await req("POST", "/api/match/invite", { jar: jars.b, body: { toUserId: idA.toHexString() } });
check("B invites A → pending", r.status === 200 && r.body.invite?.status === "pending", JSON.stringify(r.body).slice(0, 300));
const invId = r.body.invite?.id;

r = await req("POST", "/api/match/invite", { jar: jars.b, body: { toUserId: idA.toHexString() } });
check("duplicate invite idempotent", r.status === 200 && r.body.invite?.id === invId, JSON.stringify(r.body).slice(0, 200));

r = await req("POST", "/api/match/invite", { jar: jars.a, body: { toUserId: idB.toHexString() } });
check("reverse invite → 409 PENDING_INVITE_EXISTS", r.status === 409 && r.body.code === "PENDING_INVITE_EXISTS", JSON.stringify(r.body).slice(0, 200));

r = await req("GET", "/api/match/invites", { jar: jars.a });
check(
  "A inbox has incoming",
  r.status === 200 && (r.body.invites ?? []).some((i) => i.id === invId && i.direction === "incoming"),
  JSON.stringify(r.body).slice(0, 300)
);

r = await req("POST", `/api/match/invites/${invId}/respond`, { jar: jars.a, body: { action: "accept" } });
check("A accepts → room", r.status === 200 && r.body.status === "accepted" && !!r.body.roomId, JSON.stringify(r.body).slice(0, 200));
const roomId = r.body.roomId;

const sA = await req("GET", "/api/match/status", { jar: jars.a });
const sB = await req("GET", "/api/match/status", { jar: jars.b });
check("both matched, same room", sA.body.roomId === roomId && sB.body.roomId === roomId, `${JSON.stringify(sA.body)} ${JSON.stringify(sB.body)}`);

r = await req("GET", `/api/match/room?roomId=${roomId}`, { jar: jars.a });
check(
  "room preview minimal (partner=B, no email)",
  r.status === 200 && r.body.room?.partner?.id === idB.toHexString() && !JSON.stringify(r.body).includes("example.com"),
  JSON.stringify(r.body).slice(0, 300)
);

r = await req("POST", `/api/match/invites/${invId}/respond`, { jar: jars.a, body: { action: "accept" } });
check("accept retry → same room", r.status === 200 && r.body.roomId === roomId, JSON.stringify(r.body).slice(0, 200));

r = await req("POST", "/api/match/join", { jar: jars.a, body: {} });
check("join while in room → 409 + roomId", r.status === 409 && (r.body.roomId === roomId || r.body.fields?.roomId === roomId), JSON.stringify(r.body).slice(0, 200));

// ---------- C: outsider ----------
await register("c");
r = await req("GET", `/api/match/room?roomId=${roomId}`, { jar: jars.c });
check("outsider roomId → 404", r.status === 404, JSON.stringify(r.body).slice(0, 200));
r = await req("GET", "/api/match/room", { jar: jars.c });
check("outsider bare room → null", r.status === 200 && r.body.room === null, JSON.stringify(r.body).slice(0, 200));

// ---------- leave + requeue ----------
r = await req("POST", "/api/match/leave", { jar: jars.a, body: {} });
check("A leave → idle + roomId", r.status === 200 && r.body.status === "idle" && r.body.roomId === roomId, JSON.stringify(r.body).slice(0, 200));
r = await req("GET", "/api/match/status", { jar: jars.b });
check("B status → idle after A left", r.status === 200 && r.body.status === "idle", JSON.stringify(r.body).slice(0, 200));
r = await req("POST", "/api/match/join", { jar: jars.b, body: {} });
check("B re-queues after close", r.status === 200 && r.body.status === "searching", JSON.stringify(r.body).slice(0, 200));
await req("POST", "/api/match/cancel", { jar: jars.b, body: {} });

// ---------- D & E: decline + cancel + re-invite ----------
await register("d");
await makeEligible("d");
await register("e");
await makeEligible("e");
const idD = await userIdOf("d");
await req("POST", "/api/match/join", { jar: jars.d, body: {} });
r = await req("POST", "/api/match/invite", { jar: jars.e, body: { toUserId: idD.toHexString() } });
const invDE = r.body.invite?.id;
check("E invites D → pending", r.status === 200 && !!invDE, JSON.stringify(r.body).slice(0, 200));
r = await req("POST", `/api/match/invites/${invDE}/respond`, { jar: jars.d, body: { action: "decline" } });
check("D declines", r.status === 200 && r.body.status === "declined", JSON.stringify(r.body).slice(0, 200));
r = await req("POST", "/api/match/invite", { jar: jars.e, body: { toUserId: idD.toHexString() } });
const invDE2 = r.body.invite?.id;
check("re-invite after decline allowed", r.status === 200 && !!invDE2 && invDE2 !== invDE, JSON.stringify(r.body).slice(0, 200));
r = await req("DELETE", `/api/match/invites/${invDE2}`, { jar: jars.e });
check("sender cancels invite", r.status === 200 && r.body.status === "cancelled", JSON.stringify(r.body).slice(0, 200));
await req("POST", "/api/match/cancel", { jar: jars.d, body: {} });

// ---------- guards ----------
r = await req("POST", "/api/match/join", { body: {} });
check("no cookie → 401", r.status === 401, JSON.stringify(r.body).slice(0, 160));
r = await req("GET", "/api/match/available", {});
check("available no cookie → 401", r.status === 401, JSON.stringify(r.body).slice(0, 160));

await register("u"); // unverified
r = await req("POST", "/api/match/join", { jar: jars.u, body: {} });
check("unverified → 403 EMAIL_NOT_VERIFIED", r.status === 403 && r.body.code === "EMAIL_NOT_VERIFIED", JSON.stringify(r.body).slice(0, 200));

await register("i");
await db.collection("users").updateOne({ email: email("i") }, { $set: { emailVerified: true } });
r = await req("POST", "/api/match/join", { jar: jars.i, body: {} });
check("incomplete → 422 PROFILE_INCOMPLETE", r.status === 422 && r.body.code === "PROFILE_INCOMPLETE" && !!(r.body.fields?.missing ?? r.body.fields?.profile), JSON.stringify(r.body).slice(0, 300));
r = await req("GET", "/api/match/status", { jar: jars.i });
check("incomplete status → idle", r.status === 200 && r.body.status === "idle" && r.body.profileComplete === false, JSON.stringify(r.body).slice(0, 200));

const adminLogin = await req("POST", "/api/auth/login", {
  body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
});
if (adminLogin.status === 200 && adminLogin.jar) {
  r = await req("POST", "/api/match/join", { jar: adminLogin.jar, body: {} });
  check("admin → 403 NOT_STUDENT", r.status === 403 && r.body.code === "NOT_STUDENT", JSON.stringify(r.body).slice(0, 200));
} else {
  check("admin login (skipped — no admin creds)", true, "no ADMIN_EMAIL/PASSWORD");
}

r = await req("POST", "/api/match/invite", { jar: jars.a, body: { toUserId: idA.toHexString() } });
check("self-invite → 400", r.status === 400, JSON.stringify(r.body).slice(0, 160));
r = await req("POST", "/api/match/invite", { jar: jars.a, body: { toUserId: "000000000000000000000000" } });
check("unknown user invite → 404", r.status === 404, JSON.stringify(r.body).slice(0, 160));
r = await req("POST", "/api/match/join", { jar: jars.a, raw: "{bad json" });
check("malformed JSON → 400", r.status === 400, JSON.stringify(r.body).slice(0, 160));
r = await req("POST", "/api/match/join", { jar: jars.a, body: { surprise: 1 } });
check("unknown field → 400", r.status === 400, JSON.stringify(r.body).slice(0, 160));

// ---------- cleanup (only TAG test records) ----------
const testUsers = await db.collection("users").find({ email: new RegExp(`^${TAG}\\+`) }).project({ _id: 1 }).toArray();
const testIds = testUsers.map((u) => u._id);
await db.collection("match_queue").deleteMany({ userId: { $in: testIds } });
await db.collection("study_rooms").deleteMany({ memberIds: { $in: testIds } });
await db.collection("match_invites").deleteMany({ $or: [{ fromUserId: { $in: testIds } }, { toUserId: { $in: testIds } }] });
await db.collection("refreshTokens").deleteMany({ userId: { $in: testIds } });
await db.collection("users").deleteMany({ _id: { $in: testIds } });
const leftovers =
  (await db.collection("match_queue").countDocuments({ userId: { $in: testIds } })) +
  (await db.collection("study_rooms").countDocuments({ memberIds: { $in: testIds } })) +
  (await db.collection("match_invites").countDocuments({ $or: [{ fromUserId: { $in: testIds } }, { toUserId: { $in: testIds } }] }));
check("test data cleaned", leftovers === 0, `leftovers=${leftovers}`);

await client.close();
console.log(failures === 0 ? "ALL HTTP SMOKE CHECKS PASSED" : `${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
