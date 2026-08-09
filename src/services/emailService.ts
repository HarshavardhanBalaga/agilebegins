import { sendEmailSafe } from "@/lib/nodemailer";
import { env } from "@/lib/env";
import { MEETING_LINK_ENV } from "@/lib/constants";
import type { WorkshopDocument } from "@/types/workshop";

/**
 * All outgoing transactional email for Agile Begins, built on nodemailer.
 * Sending is best-effort: failures are logged, never thrown to the caller.
 */
export const emailService = {
  /**
   * Confirmation email sent once an admin verifies payment. Includes the
   * workshop's date, time, platform, meeting link and support address.
   */
  async sendConfirmationEmail(registration: {
    email: string;
    name: string;
    workshop: WorkshopDocument;
  }): Promise<void> {
    const meetingLink = process.env[MEETING_LINK_ENV];
    const html = confirmationTemplate(registration, meetingLink);

    await sendEmailSafe({
      to: registration.email,
      subject: `You're in! ${registration.workshop.title}`,
      html,
      text: confirmationPlainText(registration, meetingLink),
    });
  },
};

function confirmationTemplate(
  registration: { name: string; workshop: WorkshopDocument },
  meetingLink?: string
): string {
  const workshop = registration.workshop;
  const support = env.supportEmail();
  const rows = [
    ["Workshop", workshop.title],
    ["Date", workshop.date || "To be announced"],
    ["Time", workshop.time || "To be announced"],
    ["Platform", workshop.meetingPlatform || workshop.platform || "To be announced"],
    ["Duration", workshop.duration || "—"],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:10px 0;font-size:14px;color:#666;">${label}</td>
          <td style="padding:10px 0 10px 20px;font-size:14px;font-weight:600;color:#111;">${escapeHtml(
            value
          )}</td>
        </tr>`
    )
    .join("");

  const meetingHtml = meetingLink
    ? `<p style="margin:18px 0 6px;font-size:14px;color:#111;">
         <strong>Join the session:</strong>
         <a href="${meetingLink}" style="color:#2f1bff;">${meetingLink}</a>
       </p>`
    : "";

  return `
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;">
      <div style="background:#2f1bff;padding:28px 32px;">
        <h1 style="margin:0;color:#d6ff00;font-size:22px;font-weight:bold;">Agile Begins</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#111;font-size:20px;">You're confirmed, ${escapeHtml(
          registration.name
        )}!</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#666;">
          Your seat for the workshop below is reserved. Details:
        </p>
        <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
        ${meetingHtml}
        <p style="margin-top:22px;padding-top:16px;border-top:1px solid #eee;font-size:13px;color:#888;">
          Questions? Reply to ${escapeHtml(support)}.
        </p>
      </div>
    </div>`;
}

function confirmationPlainText(
  registration: { name: string; workshop: WorkshopDocument },
  meetingLink?: string
): string {
  const workshop = registration.workshop;
  return [
    `You're confirmed, ${registration.name}! Your seat is reserved.`,
    "",
    `Workshop: ${workshop.title}`,
    `Date: ${workshop.date || "To be announced"}`,
    `Time: ${workshop.time || "To be announced"}`,
    `Platform: ${workshop.meetingPlatform || workshop.platform || "To be announced"}`,
    meetingLink ? `Join link: ${meetingLink}` : "",
    "",
    `Need help? ${env.supportEmail()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}