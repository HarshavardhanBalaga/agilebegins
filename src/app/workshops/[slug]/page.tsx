import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Navbar } from "@/components/landing/Navbar";
import { WorkshopHero } from "@/components/workshop/WorkshopHero";
import { AudienceSection } from "@/components/workshop/AudienceSection";
import { LearnSection } from "@/components/workshop/LearnSection";
import { TimelineSection } from "@/components/workshop/TimelineSection";
import { IncludesSection } from "@/components/workshop/IncludesSection";
import { WhyFeeSection } from "@/components/workshop/WhyFeeSection";
import { FaqSection } from "@/components/workshop/FaqSection";
import { FinalCta } from "@/components/workshop/FinalCta";
import { workshops } from "@/data/workshops";

interface WorkshopPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return workshops.map((workshop) => ({ slug: workshop.slug }));
}

export async function generateMetadata({
  params,
}: WorkshopPageProps): Promise<Metadata> {
  const { slug } = await params;
  const workshop = workshops.find((w) => w.slug === slug);

  if (!workshop) {
    return { title: "Agile Begins" };
  }

  return {
    title: `${workshop.title} — Agile Begins`,
    description: workshop.description,
  };
}

export default async function WorkshopDetailPage({
  params,
}: WorkshopPageProps) {
  const { slug } = await params;
  const workshop = workshops.find((w) => w.slug === slug);

  if (!workshop) notFound();

  const isLive = workshop.status === "live";

  return (
    <>
      <Navbar />
      <main>
        <WorkshopHero workshop={workshop} />
        <AudienceSection workshop={workshop} />
        <LearnSection workshop={workshop} />
        <TimelineSection workshop={workshop} />
        <IncludesSection workshop={workshop} />
        {isLive ? <WhyFeeSection workshop={workshop} /> : null}
        <FaqSection workshop={workshop} />
        {isLive ? <FinalCta /> : null}
      </main>
    </>
  );
}