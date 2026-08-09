import { sendEmail } from "@/lib/nodemailer";
import { env } from "@/lib/env";
import { MEETING_LINK_ENV } from "@/lib/constants";
import type { WorkshopDocument } from "@/types/workshop";

/**
 * All outgoing transactional email for Agile Begins, built on nodemailer.
 * Failures (including an unconfigured SMTP provider) are thrown to the
 * caller, which decides whether the flow should fail or degrade gracefully.
 */
export const emailService = {
  /**
   * Verification email sent right after account creation. The link carries a
   * purpose-scoped JWT so only this flow can flip `emailVerified`.
   */
  async sendVerificationEmail(input: {
    email: string;
    name: string;
    verifyUrl: string;
  }): Promise<void> {
    await sendEmail({
      to: input.email,
      subject: "Confirm your email — Agile Begins",
      html: verificationTemplate(input.name, input.verifyUrl),
      text: verificationPlainText(input.verifyUrl),
    });
  },

  /**
   * Confirmation email sent once an admin verifies payment. Includes the
   * workshop's date, time, platform, meeting link, WhatsApp community link
   * and support address. Meeting/WhatsApp links and subject/body come from
   * the per-workshop mail settings with env fallbacks.
   */
  async sendConfirmationEmail(registration: {
    email: string;
    name: string;
    workshop: WorkshopDocument;
  }): Promise<void> {
    const meetingLink =
      registration.workshop.meetingLink?.trim() ||
      process.env[MEETING_LINK_ENV];
    const html = confirmationTemplate(registration, meetingLink);

    await sendEmail({
      to: registration.email,
      subject:
        registration.workshop.emailSubject?.trim() ||
        `You're in! ${registration.workshop.title}`,
      html,
      text: confirmationPlainText(registration, meetingLink),
    });
  },

  /**
   * Acknowledgement email sent as soon as a registration is submitted. It
   * confirms receipt and that payment verification is in progress — the
   * meeting link is deliberately NOT included here (only after verification).
   */
  async sendAcknowledgementEmail(registration: {
    email: string;
    name: string;
    workshop: WorkshopDocument;
  }): Promise<void> {
    const whatsapp = whatsappCommunityLink(registration.workshop);
    const html = acknowledgementTemplate(registration, whatsapp);

    await sendEmail({
      to: registration.email,
      subject: `We received your registration — ${registration.workshop.title}`,
      html,
      text: acknowledgementPlainText(registration, whatsapp),
    });
  },

  /**
   * Password-reset OTP email. The code is valid for 10 minutes and the email
   * reminds the user it will never be asked for over the phone.
   */
  async sendOtpEmail(input: { email: string; name: string; code: string }): Promise<void> {
    await sendEmail({
      to: input.email,
      subject: "Your password reset code — Agile Begins",
      html: otpTemplate(input.name, input.code),
      text: otpPlainText(input.code),
    });
  },

  /**
   * Test email for the admin "mail settings" screen. It renders the exact
   * confirmation template the student would receive so settings can be
   * previewed before saving. Delivered to the admin's own address.
   */
  async sendTestEmail(input: {
    to: string;
    name: string;
    workshop: WorkshopDocument;
  }): Promise<void> {
    const meetingLink =
      input.workshop.meetingLink?.trim() ||
      process.env[MEETING_LINK_ENV];
    const html = confirmationTemplate(input, meetingLink);

    await sendEmail({
      to: input.to,
      subject:
        input.workshop.emailSubject?.trim() ||
        `[Test] You're in! ${input.workshop.title}`,
      html,
      text: confirmationPlainText(input, meetingLink),
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

  const whatsapp = whatsappCommunityLink(workshop);
  const whatsappHtml =
    whatsapp && whatsapp !== "#"
      ? `<p style="margin:14px 0 0;font-size:14px;color:#111;">
           <strong>Join the community:</strong>
           <a href="${whatsapp}" style="color:#2f1bff;">WhatsApp Community</a>
         </p>`
      : "";

  const customBodyHtml = workshop.emailBody?.trim()
    ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #eee;font-size:14px;color:#444;">${escapeHtml(
        workshop.emailBody.trim()
      )}</p>`
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
        ${whatsappHtml}
        ${customBodyHtml}
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
    `WhatsApp community: ${whatsappCommunityLink(workshop)}`,
    "",
    `Need help? ${env.supportEmail()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function acknowledgementTemplate(
  registration: { name: string; workshop: WorkshopDocument },
  whatsapp: string
): string {
  const workshop = registration.workshop;
  const support = env.supportEmail();
  const whatsappHtml =
    whatsapp && whatsapp !== "#"
      ? `<p style="margin:14px 0 0;font-size:14px;color:#111;">
           <strong>Join the community:</strong>
           <a href="${whatsapp}" style="color:#2f1bff;">WhatsApp Community</a>
         </p>`
      : "";

  return `
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;">
      <div style="background:#2f1bff;padding:28px 32px;">
        <h1 style="margin:0;color:#d6ff00;font-size:22px;font-weight:bold;">Agile Begins</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#111;font-size:20px;">Thanks, ${escapeHtml(
          registration.name
        )}! Registration received.</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#666;">
          We've got your registration for <strong>${escapeHtml(
            workshop.title
          )}</strong>. Our team will verify your payment within a few hours —
          once approved you'll receive a confirmation email with the meeting
          details.
        </p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;">Date</td>
            <td style="padding:10px 0 10px 20px;font-size:14px;font-weight:600;color:#111;">${
              workshop.date || "To be announced"
            }</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#666;">Time</td>
            <td style="padding:10px 0 10px 20px;font-size:14px;font-weight:600;color:#111;">${
              workshop.time || "To be announced"
            }</td>
          </tr>
        </table>
        ${whatsappHtml}
        <p style="margin-top:22px;padding-top:16px;border-top:1px solid #eee;font-size:13px;color:#888;">
          Questions? Reply to ${escapeHtml(support)}.
        </p>
      </div>
    </div>`;
}

function acknowledgementPlainText(
  registration: { name: string; workshop: WorkshopDocument },
  whatsapp: string
): string {
  const workshop = registration.workshop;
  return [
    `Thanks, ${registration.name}! We received your registration for ${workshop.title}.`,
    "",
    `Date: ${workshop.date || "To be announced"}`,
    `Time: ${workshop.time || "To be announced"}`,
    "",
    "Our team verifies payments within a few hours. You'll get a confirmation email with the meeting details once approved.",
    whatsapp && whatsapp !== "#"
      ? `WhatsApp community: ${whatsapp}`
      : "",
    "",
    `Need help? ${env.supportEmail()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function otpTemplate(name: string, code: string): string {
  return `
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;">
      <div style="background:#2f1bff;padding:28px 32px;">
        <h1 style="margin:0;color:#d6ff00;font-size:22px;font-weight:bold;">Agile Begins</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#111;font-size:20px;">Reset your password, ${escapeHtml(
          name
        )}!</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#666;">
          Use the code below to reset your password. It expires in 10 minutes.
        </p>
        <p style="margin:0;font-family:monospace;font-size:32px;font-weight:bold;letter-spacing:0.2em;color:#2f1bff;">
          ${escapeHtml(code)}
        </p>
        <p style="margin-top:22px;padding-top:16px;border-top:1px solid #eee;font-size:13px;color:#888;">
          If you didn't request this, you can safely ignore this email. We will
          never ask for this code over the phone or social media.
        </p>
      </div>
    </div>`;
}

function otpPlainText(code: string): string {
  return [
    "Use this code to reset your password (valid for 10 minutes):",
    "",
    code,
    "",
    "If you didn't request this, ignore this email.",
    `Questions? ${env.supportEmail()}`,
  ].join("\n");
}

function verificationTemplate(name: string, verifyUrl: string): string {
  return `
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;">
      <div style="background:#2f1bff;padding:28px 32px;">
        <h1 style="margin:0;color:#d6ff00;font-size:22px;font-weight:bold;">Agile Begins</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#111;font-size:20px;">Confirm your email, ${escapeHtml(
          name
        )}!</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#666;">
          Please confirm your email address so you can reserve your seat. The
          link below expires in 24 hours.
        </p>
        <p style="margin:0;">
          <a href="${verifyUrl}" style="display:inline-block;background:#2f1bff;color:#ffffff;padding:14px 28px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:bold;">
            Verify Email
          </a>
        </p>
        <p style="margin-top:22px;padding-top:16px;border-top:1px solid #eee;font-size:13px;color:#888;">
          If the button doesn't work, open this link: ${verifyUrl}
        </p>
      </div>
    </div>`;
}

function verificationPlainText(verifyUrl: string): string {
  return [
    "Confirm your email address to reserve your seat with Agile Begins.",
    "",
    `Open this link (valid for 24 hours): ${verifyUrl}`,
    "",
    `Questions? ${env.supportEmail()}`,
  ].join("\n");
}

/** Resolves the per-workshop WhatsApp community link, falling back to env. */
export function whatsappCommunityLink(
  workshop: Pick<WorkshopDocument, "whatsappLink">
): string {
  return (
    workshop.whatsappLink?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL ||
    "#"
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}