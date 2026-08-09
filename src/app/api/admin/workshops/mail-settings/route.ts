import type { NextRequest } from "next/server";
import { run, ok, fail, httpError, AppError, readJson } from "@/lib/http";
import { requireAdmin } from "@/middlewares/auth";
import { workshopRepository } from "@/repositories/workshopRepository";
import { emailService } from "@/services/emailService";
import { workshopMailSettingsSchema } from "@/validators/workshop";
import { toObjectId } from "@/utils/ids";
import type { WorkshopDocument } from "@/types/workshop";

export const dynamic = "force-dynamic";

/** Converts an empty string to null so overrides clear and env fallbacks apply. */
function emptyToNull(value: string | undefined): string | null {
  return value == null || value === "" ? null : value;
}

/**
 * POST /api/admin/workshops/mail-settings
 * Admin-only. Saves the per-workshop email settings (meeting link, WhatsApp
 * link, subject, custom body) used by the acknowledgement/confirmation
 * emails. With `sendTest`, instead sends a preview email to the admin's own
 * address using the entered (unsaved) settings.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    const admin = await requireAdmin(request);

    const body = await readJson(request);
    const parsed = workshopMailSettingsSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    const { workshopId, sendTest, ...settings } = parsed.data;

    if (sendTest) {
      const workshop = await workshopRepository.findById(toObjectId(workshopId));
      if (!workshop) {
        throw httpError.notFound("Workshop not found.");
      }
      // Preview with the entered (unsaved) values.
      const preview: WorkshopDocument = {
        ...workshop,
        meetingLink: emptyToNull(settings.meetingLink),
        whatsappLink: emptyToNull(settings.whatsappLink),
        emailSubject: settings.emailSubject ?? null,
        emailBody: settings.emailBody ?? null,
      };
      try {
        await emailService.sendTestEmail({
          to: admin.email,
          name: admin.name,
          workshop: preview,
        });
      } catch (error) {
        console.error("Test email failed:", error);
        throw new AppError(
          "Test email could not be sent. Check your SMTP configuration and try again.",
          502
        );
      }
      return ok({
        testEmailSent: true,
        message: "Test email sent. Check your inbox.",
      });
    }

    const workshop = await workshopRepository.findById(toObjectId(workshopId));
    if (!workshop) {
      throw httpError.notFound("Workshop not found.");
    }

    await workshopRepository.updateEmailSettings(toObjectId(workshopId), {
      meetingLink: emptyToNull(settings.meetingLink),
      whatsappLink: emptyToNull(settings.whatsappLink),
      emailSubject: settings.emailSubject ?? null,
      emailBody: settings.emailBody ?? null,
    });

    return ok({ saved: true, message: "Mail settings saved." });
  });
}
