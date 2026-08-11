import { cookies } from "next/headers";
import { Navbar } from "@/components/landing/Navbar";
import {
  RegistrationFlow,
  type WorkshopChoice,
} from "@/components/register/RegistrationFlow";
import { getSessionUser } from "@/middlewares/auth";
import { workshopRepository } from "@/repositories/workshopRepository";
import { registrationRepository } from "@/repositories/registrationRepository";
import { toObjectId } from "@/utils/ids";
import { toPublicUser } from "@/models/user";
import { COOKIE_NAMES } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface RegisterPageProps {
  searchParams: Promise<{ workshop?: string }>;
}

/**
 * /register — the initial session and workshop list are resolved on the
 * server (SSR) and handed to the client flow as plain props, so there is no
 * loading flash or client round-trip on first paint.
 */
export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const [query, user, list] = await Promise.all([
    searchParams,
    getSessionUser(),
    workshopRepository.listPublic(),
  ]);

  const workshops: WorkshopChoice[] = list.map((w) => ({
    id: w._id,
    title: w.title,
    slug: w.slug,
    price: w.price,
    status: w.status,
  }));

  // Only active workshops can be registered for — Coming Soon ones stay out
  // of the dropdown entirely.
  const liveWorkshops = workshops.filter((w) => w.status === "LIVE");

  const pick =
    liveWorkshops.find((w) => w.slug === query.workshop) ??
    liveWorkshops[0] ??
    null;

  const alreadyRegistered =
    user && pick
      ? Boolean(
          await registrationRepository.findActiveByUserAndWorkshop(
            user._id,
            toObjectId(pick.id)
          )
        )
      : false;

  const store = await cookies();
  const canRefresh = Boolean(store.get(COOKIE_NAMES.REFRESH)?.value);

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mb-12 max-w-[700px] lg:mx-auto lg:text-center">
            <h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white">
              <span className="block">Reserve Your Seat</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/[0.78] md:text-lg">
              Create an account, tell us a little about yourself, pay via UPI,
              and you&apos;re in. Verification usually takes a few hours.
            </p>
          </div>

          <RegistrationFlow
            initialUser={user ? toPublicUser(user) : null}
            initialWorkshops={liveWorkshops}
            defaultWorkshopId={pick?.id ?? ""}
            canRefresh={canRefresh}
            alreadyRegistered={alreadyRegistered}
          />
        </div>
      </main>
    </>
  );
}
