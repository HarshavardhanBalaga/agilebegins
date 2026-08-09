import { jwtVerify, SignJWT } from "jose";

const access = process.argv[2];
const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);

try {
  const { payload, protectedHeader } = await jwtVerify(access, secret, {
    algorithms: ["HS256"],
  });
  console.log(
    "verify: OK | headerAlg=" + protectedHeader.alg + " sub=" + payload.sub
  );
} catch (e) {
  console.log("verify: FAILED | " + e.name + " " + (e.code ?? "") + " " + e.message);
}

const signed = await new SignJWT({ role: "student" })
  .setProtectedHeader({ alg: "HS256" })
  .setSubject("test-user")
  .setIssuedAt()
  .setExpirationTime("15m")
  .sign(secret);
const again = await jwtVerify(signed, secret, { algorithms: ["HS256"] });
console.log("self round-trip OK sub=" + again.payload.sub);