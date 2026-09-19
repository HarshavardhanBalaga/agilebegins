import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Info,
  LifeBuoy,
  Mail,
  MessageCircle,
  TriangleAlert,
} from "lucide-react";

import { Navbar } from "@/components/landing/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { env } from "@/lib/env";

/**
 * Shared shell for the informational and legal documents (About us, Contact us,
 * Privacy policy, Terms & conditions, Refund & cancellation).
 *
 * The footer stays a codebase, but these pages deliberately optimise for
 * reading instead: a single comfortable column, numbered section navigation
 * on desktop, and generous vertical rhythm on mobile.
 */

/**
 * Fallback "last updated" date. Change it whenever the copy on a document
 * changes, or set POLICY_LAST_UPDATED in the environment (see .env.example).
 */
const DEFAULT_LAST_UPDATED = "19 September 2026";

export interface DocumentSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface DocumentPageProps {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  sections: DocumentSection[];
  /** Rendered after the final section, before the support block. */
  footnote?: ReactNode;
  /** Extra destinations offered at the end of the document. */
  related?: { href: string; label: string }[];
  /** Set false on pages that already carry their own contact details. */
  showSupport?: boolean;
}

/** A bulleted list that matches the document body typography. */
export function DocumentList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5 pl-5 marker:text-brand">
      {items.map((item, index) => (
        <li key={index} className="list-disc pl-0.5">
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Quiet informational callout. */
export function DocumentNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-brand/15 bg-brand/[0.04] px-5 py-4">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand/60" aria-hidden="true" />
      <div className="space-y-3 text-sm leading-relaxed text-ink/70">{children}</div>
    </div>
  );
}

/**
 * A decision only Agile Begins can make. Shown loudly on purpose: nothing in
 * these documents should look like a settled term until the owner confirms it.
 */
export function DocumentFlag({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand/20 border-l-4 border-l-accent bg-brand/[0.05] px-5 py-4">
      <p className="flex items-center gap-2 font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </p>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/75">
        {children}
      </div>
    </div>
  );
}

/** Bold inline emphasis used inside lists and paragraphs. */
export function DocumentStrong({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-ink">{children}</span>;
}

/** Closing support card — always shows the verified support address. */
function SupportBlock() {
  const email = env.supportEmail();
  const whatsapp = env.whatsappCommunityUrl();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand/15 bg-brand/[0.04] px-6 py-6 sm:px-7">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-accent" />
      <p className="flex items-center gap-2 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
        <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" />
        Questions about this page?
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        Email{" "}
        <a
          href={`mailto:${email}`}
          className="font-semibold text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:text-ink"
        >
          {email}
        </a>{" "}
        and a person will get back to you.{" "}
        <Link
          href="/contact-us"
          className="font-semibold text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:text-ink"
        >
          Contact us
        </Link>{" "}
        explains what to include so we can help faster.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Email support
        </a>
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-brand/25 px-5 py-2.5 font-heading text-sm font-bold text-brand transition-colors duration-300 hover:border-brand/50 hover:bg-brand/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp community
          </a>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Renders one informational or legal document end to end, including the
 * navbar and the codebase footer.
 */
export function DocumentPage({
  eyebrow,
  title,
  intro,
  sections,
  footnote,
  related,
  showSupport = true,
}: DocumentPageProps) {
  const updated = env.policy().lastUpdated ?? DEFAULT_LAST_UPDATED;

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden bg-white text-ink">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-ink/55 transition-colors hover:text-brand"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-ink/30">
                /
              </li>
              <li aria-current="page" className="font-medium text-brand">
                {title}
              </li>
            </ol>
          </nav>

          <header className="mt-10 max-w-[820px]">
            <p className="flex items-center gap-2.5 font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand">
              <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-accent ring-1 ring-ink/10" />
              {eyebrow}
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[0.95] tracking-[-0.03em] text-brand">
              {title}
            </h1>
            <div aria-hidden="true" className="mt-5 h-1.5 w-16 rounded-full bg-accent" />
            <div className="mt-5 space-y-4 text-base leading-relaxed text-ink/75 md:text-lg">
              {intro}
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/45">
              Last updated · {updated}
            </p>
          </header>

          <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-14">
            <nav
              aria-label="On this page"
              className="lg:sticky lg:top-28 lg:self-start"
            >
              <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-5">
                <p className="flex items-center gap-2 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
                  <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-accent ring-1 ring-ink/10" />
                  On this page
                </p>
                <ol className="mt-4 space-y-1 text-sm">
                  {sections.map((section, index) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="flex gap-2.5 rounded-lg border-l-2 border-transparent py-1.5 pl-3 text-ink/65 transition-colors duration-200 hover:border-accent hover:bg-brand/[0.05] hover:text-brand focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/60 focus-visible:outline-none"
                      >
                        <span className="font-mono text-[11px] text-ink/40">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{section.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>

            <div className="min-w-0 max-w-[70ch] space-y-12">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-32">
                  <h2 className="flex items-center gap-3 font-display text-xl font-bold tracking-[-0.01em] text-brand sm:text-2xl">
                    <span aria-hidden="true" className="h-6 w-1.5 shrink-0 rounded-full bg-accent" />
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink/75">
                    {section.body}
                  </div>
                </section>
              ))}

              {footnote ? (
                <div className="space-y-4 text-[15px] leading-relaxed text-ink/75">
                  {footnote}
                </div>
              ) : null}

              {related?.length ? (
                <div className="flex flex-wrap gap-3">
                  {related.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={
                        index === 0
                          ? "inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                          : "inline-flex items-center gap-2 rounded-full border border-brand/25 px-5 py-2.5 font-heading text-sm font-bold text-brand transition-colors duration-300 hover:border-brand/50 hover:bg-brand/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/60 focus-visible:outline-none"
                      }
                    >
                      {link.label}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              ) : null}

              {showSupport ? <SupportBlock /> : null}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}