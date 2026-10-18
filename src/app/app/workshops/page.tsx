import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/middlewares/auth";
import { isEmailVerified } from "@/models/user";
import { workshops } from "@/data/workshops";

export const metadata: Metadata = {
  title: "Workshops",
  description: "Practical live workshops that turn learning into building.",
};

/**
 * GET /app/workshops — authenticated copy of the public /workshops explorer.
 * Lives under the /app layout (AppNavbar + auth gate) and uses the same
 * white card language as the /app landing: 2px ink borders, hard shadows,
 * brand blue accents, no hover effects. Functionality slots in later.
 */
export default async function AppWorkshopsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/workshops");
  if (!isEmailVerified(user)) redirect("/verify-email");

  return (
    <main className="mx-auto flex w-full max-w-[1320px] flex-col px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <p className="text-xs font-normal tracking-[0.22em] text-neutral-500 uppercase">
        Explore
      </p>
      <h1 className="mt-3 max-w-[20ch] text-4xl leading-[1.05] font-bold text-neutral-900 sm:text-5xl">
        Workshops
      </h1>
      <p className="mt-4 max-w-[52ch] text-base leading-relaxed font-normal text-neutral-600">
        Practical live sessions that turn what you learn into what you build.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
        {workshops.map((workshop) => (
          <article
            key={workshop.slug}
            className="flex min-h-[190px] flex-col justify-between rounded-lg border-2 border-[#111111] bg-white p-5 shadow-[3px_3px_0_0_#111111]"
          >
            <div>
              <p className="text-xs font-normal tracking-[0.18em] text-brand uppercase">
                {workshop.number} · {workshop.duration} · {workshop.price}
              </p>
              <h2 className="mt-3 text-xl leading-snug font-normal text-[#111111]">
                {workshop.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed font-normal text-[#111111]/70">
                {workshop.description}
              </p>
            </div>
            {workshop.status === "live" ? (
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-normal text-brand underline underline-offset-4"
              >
                Reserve your seat
                <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            ) : (
              <p className="mt-6 inline-flex self-start rounded-full border border-[#111111]/30 px-2.5 py-1 text-[11px] font-normal tracking-[0.14em] text-[#111111]/60 uppercase">
                Coming soon
              </p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
