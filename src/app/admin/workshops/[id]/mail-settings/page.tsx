import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MailSettingsForm } from "@/components/admin/MailSettingsForm";
import { workshopRepository } from "@/repositories/workshopRepository";
import { isObjectId, toObjectId } from "@/utils/ids";

export const dynamic = "force-dynamic";

interface MailSettingsPageProps {
  params: Promise<{ id: string }>;
}

/**
 * /admin/workshops/[id]/mail-settings — admin configures the per-workshop
 * emails (meeting link, WhatsApp link, subject, custom body) with a live
 * "send test email" preview.
 */
export default async function MailSettingsPage({
  params,
}: MailSettingsPageProps) {
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const workshop = await workshopRepository.findById(toObjectId(id));
  if (!workshop) notFound();

  return (
    <main className="mx-auto w-full max-w-[820px] px-5 py-10 sm:px-8">
      <Link
        href="/admin/workshops"
        className="mb-6 inline-flex items-center gap-2 font-heading text-sm font-bold text-white/60 transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to workshops
      </Link>

      <div className="mb-8">
        <span className="rounded-full bg-white/10 px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
          Workshop {workshop.number}
        </span>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white">
          Mail settings
        </h1>
        <p className="mt-3 max-w-[560px] text-base leading-relaxed text-white/[0.78]">
          {workshop.title} — the links and copy used in the acknowledgement and
          confirmation emails. Leave a field empty to fall back to the default
          value.
        </p>
      </div>

      <MailSettingsForm
        workshop={{
          id: workshop._id.toString(),
          title: workshop.title,
          meetingLink: workshop.meetingLink ?? "",
          whatsappLink: workshop.whatsappLink ?? "",
          emailSubject: workshop.emailSubject ?? "",
          emailBody: workshop.emailBody ?? "",
        }}
      />
    </main>
  );
}
