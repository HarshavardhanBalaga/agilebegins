import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

/**
 * Nodemailer SMTP transport singleton.
 *
 * The transporter is created lazily so an unconfigured SMTP provider does not
 * break unrelated API routes. Sending failures are reported to the caller so
 * flows like "verify payment" never fail because the mail step failed.
 */

let transporterPromise: Promise<Transporter> | null = null;

export async function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  return transporterPromise;
}

async function createTransporter(): Promise<Transporter> {
  const config = env.smtp();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  // Fail fast with a descriptive error instead of sending into the void.
  await transporter.verify();
  return transporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const config = env.smtp();
  const transporter = await getTransporter();
  await transporter.sendMail({
    from: config.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text ?? undefined,
  });
}