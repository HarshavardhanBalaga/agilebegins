import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, GraduationCap, ShoppingBag, Sparkles, Users } from "lucide-react";
import { getSessionUser } from "@/middlewares/auth";
import { getProfileCompletion, isEmailVerified } from "@/models/user";
import RollingText from "@/components/RollingText";

export const metadata: Metadata = {
  title: "Home",
  description: "What are you up to? Pick a mode and keep moving.",
};

/**
 * GET /app — authenticated landing hub.
 *
 * Bold "what are you up to" heading, a spotlight for the renamed
 * partner feature (Companion Mode), then cards for workshops,
 * products, and one non-functional coming-soon slot.
 *
 * Only the main heading is bold — everything else stays normal weight.
 * Design mirrors the public `/` route: Cal Sans, 2px ink borders,
 * hard offset shadows, brand blue (#2F1BFF) + lime (#D6FF00) accents,
 * grid backdrop. Cards are static — no hover effects.
 */
export default async function AppPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app");
  if (!isEmailVerified(user)) redirect("/verify-email");

  const { complete } = getProfileCompletion(user);
  const firstName =
    user.displayName?.trim().split(" ")[0] || user.name.split(" ")[0] || "there";

  return (
    <main className="font-[family-name:var(--font-cal-sans)] antialiased">
      <section className="relative overflow-hidden bg-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_40%,black_30%,transparent_75%)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(17,17,17,0.088) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.088) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-14 pb-10 text-center md:pt-20 md:pb-14">
          <p className="inline-flex items-center gap-2.5 rounded-full border-2 border-neutral-900 bg-white px-4 py-1.5 text-xs tracking-[0.18em] text-neutral-900 uppercase shadow-[3px_3px_0_0_#111111]">
            <span
              aria-hidden="true"
              className="flex size-5 items-center justify-center rounded-full bg-neutral-900 text-base leading-none font-bold text-accent"
            >
              #
            </span>
            Your space to keep moving
          </p>
          <h1 className="mt-8 max-w-3xl text-5xl leading-[1.02] font-normal text-balance text-neutral-900 md:text-7xl">
            What are you up to,{" "}
            <span className="bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 bg-clip-text text-transparent">
              {firstName}
            </span>
            ?
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed font-normal text-neutral-600 md:text-lg">
            Pick a mode below — study with someone, join a workshop, or explore
            what is coming next.
          </p>
          {!complete ? (
            <Link
              href="/app/profile"
              className="group mt-8 flex shrink-0 items-center gap-3.75 rounded-lg border-2 border-neutral-900 bg-brand py-1.5 pr-2.5 pl-5 shadow-[4px_4px_0_0_#111111]"
            >
              <span className="leading-none font-normal whitespace-nowrap text-white uppercase text-sm">
                <RollingText text="Finish profile setup" />
              </span>
              <span className="flex size-7.5 items-center justify-center rounded-md bg-accent">
                <ArrowRight
                  size={16}
                  className="text-neutral-900"
                  strokeWidth={2.5}
                />
              </span>
            </Link>
          ) : null}
        </div>
      </section>

      <section className="bg-white px-4 pb-10 sm:px-6">
        <div className="mx-auto w-full max-w-[1320px]">
          <Link
            href="/app/find"
            className="relative block overflow-hidden rounded-[20px] border-2 border-neutral-900 bg-[#111111] px-6 py-8 shadow-[4px_4px_0_0_#111111] sm:px-10 sm:py-10"
          >
            <div
              aria-hidden="true"
              className="absolute -top-20 -right-20 size-72 rounded-full bg-accent/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-16 size-72 rounded-full bg-brand/25 blur-3xl"
            />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-[52ch]">
                <p className="inline-flex items-center gap-2 rounded-full border border-accent px-3 py-1 text-xs font-normal tracking-[0.18em] text-accent uppercase">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                  Live now
                </p>
                <h2 className="mt-4 text-3xl leading-tight font-normal text-[#F5F5F5] sm:text-4xl">
                  Companion Mode
                </h2>
                <p className="mt-3 text-sm leading-relaxed font-normal text-[#A3A3A3] sm:text-base">
                  Get matched with another student for a live study session.
                  Show up, study together, stay accountable.
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-3 rounded-lg border-2 border-neutral-900 bg-accent py-1.5 pr-2.5 pl-5">
                <span className="leading-none font-normal whitespace-nowrap text-neutral-900 uppercase text-sm">
                  <RollingText text="Find your companion" />
                </span>
                <span className="flex size-7.5 items-center justify-center rounded-md bg-neutral-900">
                  <ArrowRight
                    size={16}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="text-white"
                  />
                </span>
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="bg-white px-4 pb-16 sm:px-6">
        <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
          <CardLink
            href="/app/find"
            icon={<Users size={17} strokeWidth={2.25} className="text-white" />}
            iconBg="bg-brand"
            title="Companion Mode"
            body="Match with a study partner and start a live session."
            cta="Start matching"
          />
          <CardLink
            href="/app/workshops"
            icon={<GraduationCap size={17} strokeWidth={2.25} className="text-white" />}
            iconBg="bg-brand"
            title="Workshops"
            body="Practical live sessions that turn learning into building."
            cta="Browse workshops"
          />
          <CardLink
            href="/app/products"
            icon={<ShoppingBag size={17} strokeWidth={2.25} className="text-white" />}
            iconBg="bg-brand"
            title="Products"
            body="Notes, templates, and kits to move faster on your goals."
            cta="Explore products"
          />
          <div
            aria-disabled="true"
            className="flex min-h-[190px] cursor-not-allowed flex-col justify-between rounded-lg border-2 border-dashed border-[#111111]/40 bg-neutral-100 p-5"
          >
            <span className="flex items-center justify-between">
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-[#111111]/70"
              >
                <Sparkles size={17} strokeWidth={2.25} className="text-white" />
              </span>
              <span className="rounded-full border border-[#111111]/30 px-2.5 py-1 text-[11px] font-normal tracking-[0.14em] text-[#111111]/60 uppercase">
                Coming soon
              </span>
            </span>
            <span className="mt-8 block">
              <span className="block text-lg leading-snug font-normal text-[#111111]/70">
                Something new
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed font-normal text-[#111111]/50">
                A fresh mode is on the way. Check back soon.
              </span>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

function CardLink({
  href,
  icon,
  iconBg,
  title,
  body,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[190px] flex-col justify-between rounded-lg border-2 border-[#111111] bg-white p-5 shadow-[3px_3px_0_0_#111111]"
    >
      <span
        aria-hidden="true"
        className={`flex size-9 items-center justify-center rounded-full ${iconBg}`}
      >
        {icon}
      </span>
      <span className="mt-8 block">
        <span className="block text-lg leading-snug font-normal text-[#111111]">
          {title}
        </span>
        <span className="mt-1.5 block text-sm leading-relaxed font-normal text-[#111111]/70">
          {body}
        </span>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-normal text-brand underline underline-offset-4">
          {cta}
          <ArrowRight
            size={15}
            strokeWidth={2.5}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:-rotate-45"
          />
        </span>
      </span>
    </Link>
  );
}
