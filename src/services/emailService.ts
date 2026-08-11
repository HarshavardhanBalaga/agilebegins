import { sendEmail } from "@/lib/nodemailer";
import { env } from "@/lib/env";
import { MEETING_LINK_ENV } from "@/lib/constants";
import type { WorkshopDocument } from "@/types/workshop";

/**
 * All outgoing transactional email for Agile Begins, built on nodemailer.
 * Failures (including an unconfigured SMTP provider) are thrown to the
 * caller, which decides whether the flow should fail or degrade gracefully.
 *
 * Every HTML template renders through one shared shell so all messages read
 * as part of the same brand. Colors match the site theme (globals.css):
 * indigo `#2f1bff` header, lime `#d6ff00` accent strip, ink `#111111`, and
 * soft neutral surfaces so the body copy stays clean and readable.
 */

const BRAND = "#2f1bff";
const ACCENT = "#d6ff00";
const INK = "#111111";
const BODY = "#4b4b56";
const MUTED = "#8a8a96";
const BORDER = "#e6e6f0";
const SURFACE = "#f6f6fb";
const TINT = "#efedff";

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
   * Admin alert sent as soon as a registration is submitted. Includes the
   * student's basic details and the workshop — deliberately no payment
   * screenshot (admins review those in the dashboard).
   */
  async sendNewRegistrationNotification(registration: {
    name: string;
    email: string;
    phone: string;
    college: string;
    branch: string;
    year: string;
    transactionId: string | null;
    workshop: WorkshopDocument;
  }): Promise<void> {
    const html = notificationTemplate(registration);

    await sendEmail({
      to: env.notifyEmail(),
      subject: `New registration — ${registration.workshop.title}`,
      html,
      text: notificationPlainText(registration),
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

function emailShell(content: string, footer: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};margin:0;padding:36px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">
            <tr>
              <td style="background:${BRAND};padding:28px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.4px;">Agile Begins</span>
                    </td>
                    <td align="right">
                      <span style="display:inline-block;width:12px;height:12px;background:${ACCENT};border-radius:3px;"></span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0;height:4px;background:${ACCENT};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:8px 40px 40px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="background:${SURFACE};border-top:1px solid ${BORDER};padding:20px 40px;">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function eyebrow(text: string): string {
  return `<p style="margin:32px 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND};">${escapeHtml(
    text
  )}</p>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;line-height:1.3;color:${INK};">${escapeHtml(
    text
  )}</h1>`;
}

function body(text: string): string {
  return `<p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BODY};">${text}</p>`;
}

function detailRows(rows: Array<[string, string]>): string {
  const items = rows
    .map(
      ([label, value], index) => `
        <tr>
          <td style="padding:${index === 0 ? "18px 22px" : "16px 22px"};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};white-space:nowrap;vertical-align:top;">${escapeHtml(
            label
          )}</td>
          <td style="padding:${index === 0 ? "18px 22px 18px 24px" : "16px 22px 16px 24px"};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:${INK};vertical-align:top;">${escapeHtml(
            value
          )}</td>
        </tr>`
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};border:1px solid ${BORDER};border-radius:12px;">
      ${items}
    </table>`;
}

function button(label: string, href: string, variant: "accent" | "brand"): string {
  const bg = variant === "accent" ? ACCENT : BRAND;
  const fg = variant === "accent" ? INK : "#ffffff";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 6px;">
      <tr>
        <td style="border-radius:999px;background:${bg};mso-padding-alt:14px 34px 14px 34px;">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 34px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.2px;color:${fg};text-decoration:none;border-radius:999px;">${escapeHtml(
            label
          )}</a>
        </td>
      </tr>
    </table>`;
}

function fallbackLink(label: string, href: string): string {
  return `<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">${escapeHtml(
    label
  )} <a href="${escapeHtml(href)}" style="color:${BRAND};word-break:break-all;">${escapeHtml(
    href
  )}</a></p>`;
}

function divider(): string {
  return `<div style="height:1px;background:${BORDER};margin:28px 0;"></div>`;
}

function noteBlock(text: string): string {
  return `<p style="margin:20px 0 0;padding:14px 18px;background:${TINT};border-left:3px solid ${BRAND};border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${BODY};">${text}</p>`;
}

function supportFooter(support: string): string {
  return `
    <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:${INK};">Agile Begins</p>
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">Questions? Reply to <a href="mailto:${escapeHtml(
      support
    )}" style="color:${BRAND};text-decoration:none;font-weight:bold;">${escapeHtml(
      support
    )}</a></p>`;
}

function confirmationTemplate(
  registration: { name: string; workshop: WorkshopDocument },
  meetingLink?: string
): string {
  const workshop = registration.workshop;
  const support = env.supportEmail();
  const meeting = meetingLink?.trim();

  const meetingBlock = meeting
    ? `${button("Join the session", meeting, "accent")}${fallbackLink(
        "Can't see the button? Copy this join link:",
        meeting
      )}`
    : body("Your join link will be shared shortly.");

  const whatsapp = whatsappCommunityLink(workshop);
  const whatsappBlock =
    whatsapp && whatsapp !== "#"
      ? `<p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BODY};"><strong style="color:${INK};">Join the community:</strong></p>${button(
          "Join the WhatsApp community",
          whatsapp,
          "brand"
        )}`
      : "";

  const customBodyHtml = workshop.emailBody?.trim()
    ? `${divider()}<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BODY};">${escapeHtml(
        workshop.emailBody.trim()
      )}</p>`
    : "";

  return emailShell(
    `
    ${eyebrow("Registration confirmed")}
    ${heading(`You're confirmed, ${registration.name}!`)}
    ${body(
      "Your seat for the workshop below is reserved. Here are the details you'll need:"
    )}
    ${detailRows([
      ["Workshop", workshop.title],
      ["Date", workshop.date || "To be announced"],
      ["Time", workshop.time || "To be announced"],
      ["Platform", workshop.meetingPlatform || workshop.platform || "To be announced"],
      ["Duration", workshop.duration || "—"],
    ])}
    ${divider()}
    ${meetingBlock}
    ${whatsappBlock}
    ${customBodyHtml}
    `,
    supportFooter(support)
  );
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

  const whatsappBlock =
    whatsapp && whatsapp !== "#"
      ? `${divider()}<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BODY};"><strong style="color:${INK};">Join the community:</strong></p>${button(
          "Join the WhatsApp community",
          whatsapp,
          "brand"
        )}`
      : "";

  return emailShell(
    `
    ${eyebrow("Registration received")}
    ${heading(`Thanks, ${registration.name}!`)}
    ${body(
      `We received your registration for <strong style="color:${INK};">${escapeHtml(
        workshop.title
      )}</strong>. Our team will verify your payment within a few hours — once approved you'll receive a confirmation email with the meeting details.`
    )}
    ${detailRows([
      ["Workshop", workshop.title],
      ["Date", workshop.date || "To be announced"],
      ["Time", workshop.time || "To be announced"],
      ["Status", "Awaiting payment verification"],
    ])}
    ${noteBlock(
      "Keep an eye on this inbox — your confirmation email includes the Google Meet link for the session."
    )}
    ${whatsappBlock}
    `,
    supportFooter(support)
  );
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

function notificationTemplate(registration: {
  name: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  year: string;
  transactionId: string | null;
  workshop: WorkshopDocument;
}): string {
  const workshop = registration.workshop;
  const support = env.supportEmail();

  return emailShell(
    `
    ${eyebrow("New registration")}
    ${heading(`New registration for ${workshop.title}`)}
    ${body(
      "A student just registered. Review the details below and verify their payment in the admin dashboard."
    )}
    ${detailRows([
      ["Workshop", workshop.title],
      ["Date", workshop.date || "To be announced"],
      ["Time", workshop.time || "To be announced"],
      ["Student", registration.name],
      ["Email", registration.email],
      ["Phone", registration.phone],
      ["College", registration.college],
      ["Branch", registration.branch],
      ["Year", registration.year],
      [
        "Transaction ID",
        registration.transactionId?.trim() || "Not provided",
      ],
      ["Status", "Awaiting payment verification"],
    ])}
    ${noteBlock(
      "The payment screenshot (if any) is available in the admin dashboard — it is not included in this email."
    )}
    `,
    supportFooter(support)
  );
}

function notificationPlainText(registration: {
  name: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  year: string;
  transactionId: string | null;
  workshop: WorkshopDocument;
}): string {
  const workshop = registration.workshop;
  return [
    `New registration for ${workshop.title}`,
    "",
    `Workshop: ${workshop.title}`,
    `Date: ${workshop.date || "To be announced"}`,
    `Time: ${workshop.time || "To be announced"}`,
    "",
    `Student: ${registration.name}`,
    `Email: ${registration.email}`,
    `Phone: ${registration.phone}`,
    `College: ${registration.college}`,
    `Branch: ${registration.branch}`,
    `Year: ${registration.year}`,
    `Transaction ID: ${registration.transactionId?.trim() || "Not provided"}`,
    `Status: Awaiting payment verification`,
    "",
    "The payment screenshot (if any) is in the admin dashboard.",
  ].join("\n");
}

function otpTemplate(name: string, code: string): string {
  const support = env.supportEmail();
  return emailShell(
    `
    ${eyebrow("Password reset")}
    ${heading(`Reset your password, ${name}!`)}
    ${body("Use the code below to reset your password. It expires in 10 minutes.")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${TINT};border:1px solid #dcd9ff;border-radius:12px;">
      <tr>
        <td align="center" style="padding:22px 20px;font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:bold;letter-spacing:0.24em;color:${BRAND};">${escapeHtml(
          code
        )}</td>
      </tr>
    </table>
    ${noteBlock(
      "If you didn't request this, you can safely ignore this email. We will never ask for this code over the phone or social media."
    )}
    `,
    supportFooter(support)
  );
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
  const support = env.supportEmail();
  return emailShell(
    `
    ${eyebrow("One last step")}
    ${heading(`Confirm your email, ${name}!`)}
    ${body(
      "Please confirm your email address so you can reserve your seat. The link below expires in 24 hours."
    )}
    ${button("Verify Email", verifyUrl, "accent")}
    ${fallbackLink("If the button doesn't work, open this link:", verifyUrl)}
    `,
    supportFooter(support)
  );
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