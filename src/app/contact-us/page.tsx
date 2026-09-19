import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import {
  DocumentFlag,
  DocumentList,
  DocumentNote,
  DocumentPage,
  DocumentStrong,
} from "@/components/layout/DocumentPage";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact Agile Begins — student support",
  description:
    "How to reach Agile Begins about workshops, payments, refunds or your account, and what to include so we can help faster.",
};

const linkClass =
  "font-semibold text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:text-ink";

/** One support topic, pre-filling the subject so the email lands in the right queue. */
function ContactCard({
  topic,
  description,
  subject,
  email,
}: {
  topic: string;
  description: string;
  subject: string;
  email: string;
}) {
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-ink/[0.03] p-5">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-accent" />
      <p className="font-heading text-sm font-bold text-brand">{topic}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/65">{description}</p>
      <p className="mt-4 font-mono text-[10.5px] text-ink/45">
        subject: {subject}
      </p>
      <a
        href={href}
        className="mt-3 inline-flex items-center gap-2 font-heading text-sm font-bold text-brand transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      >
        Compose email
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  );
}

export default function ContactUsPage() {
  const supportEmail = env.supportEmail();
  const whatsapp = env.whatsappCommunityUrl();

  const topics = [
    {
      topic: "Workshops",
      description:
        "Questions about a session, what it covers, or whether it fits where you are right now.",
      subject: "Workshop question",
    },
    {
      topic: "Payments and verification",
      description:
        "You have paid but the registration is still pending, or something about the payment looks wrong.",
      subject: "Payment verification help",
    },
    {
      topic: "Refunds and cancellations",
      description:
        "You want to request a refund or cancel a seat. Read the refund policy first so you know what we will ask for.",
      subject: "Refund or cancellation request",
    },
    {
      topic: "Your account",
      description:
        "Login problems, email verification links, or updating the details on your account.",
      subject: "Account help",
    },
  ];

  return (
    <DocumentPage
      eyebrow="Contact us"
      title="Contact Agile Begins"
      showSupport={false}
      intro={
        <>
          <p>
            Every message goes to a real inbox that a person reads. There is no
            contact form, no ticket number and no bot — just email, and a reply
            when we have an answer.
          </p>
          <p>
            Support address:{" "}
            <a href={`mailto:${supportEmail}`} className={linkClass}>
              {supportEmail}
            </a>
          </p>
        </>
      }
      related={[
        { href: "/workshop", label: "Explore workshops" },
        { href: "/refund-cancellation", label: "Refund & cancellation" },
        { href: "/about-us", label: "About us" },
      ]}
      sections={[
        {
          id: "email-support",
          title: "What can we help with?",
          body: (
            <>
              <p>
                Pick the topic closest to your question — the subject line is
                filled in for you so your email reaches the right place faster.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {topics.map((topic) => (
                  <ContactCard
                    key={topic.subject}
                    topic={topic.topic}
                    description={topic.description}
                    subject={topic.subject}
                    email={supportEmail}
                  />
                ))}
              </div>
            </>
          ),
        },
        {
          id: "what-to-include",
          title: "What to include in your email",
          body: (
            <>
              <p>
                Including these details means we can usually answer in the first
                reply instead of asking for more information:
              </p>
              <DocumentList
                items={[
                  <>
                    <DocumentStrong>The email address on your account</DocumentStrong>{" "}
                    — it is how we find you in our records.
                  </>,
                  <>
                    <DocumentStrong>
                      The workshop name or number
                    </DocumentStrong>{" "}
                    (for example, Workshop 001).
                  </>,
                  <>
                    <DocumentStrong>
                      The UPI transaction ID or reference number
                    </DocumentStrong>{" "}
                    if your question is about a payment.
                  </>,
                  <>
                    <DocumentStrong>The payment screenshot</DocumentStrong> you
                    uploaded, if you still have it.
                  </>,
                  <>
                    <DocumentStrong>What happened</DocumentStrong>, and what you
                    would like us to do about it.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "workshop-updates",
          title: "Workshop updates and community",
          body: (
            <>
              <p>
                Reminders and any change notices for a live workshop are emailed
                to the address on your registration, so keeping that address
                current matters.
              </p>
              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Join the WhatsApp community
                </a>
              ) : (
                <DocumentNote>
                  <p>
                    The community invite is not configured on this deployment,
                    so no link is shown. Set{" "}
                    <span className="font-mono text-[13px]">
                      NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL
                    </span>{" "}
                    to publish it here.
                  </p>
                </DocumentNote>
              )}
            </>
          ),
        },
        {
          id: "contact-details",
          title: "Contact details on record",
          body: (
            <>
              <p>
                Email support is the only channel that is confirmed today. The
                rest are listed here exactly as they stand, so nothing on this
                page looks more final than it is.
              </p>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-ink/10 bg-ink/[0.03] px-4 py-3">
                  <dt className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">
                    Support email
                  </dt>
                  <dd className="mt-1.5 text-sm">
                    <a href={`mailto:${supportEmail}`} className={linkClass}>
                      {supportEmail}
                    </a>
                  </dd>
                </div>
                {["Support phone", "Operating address", "Support hours"].map(
                  (label) => (
                    <div
                      key={label}
                      className="rounded-xl border border-ink/10 bg-ink/[0.03] px-4 py-3"
                    >
                      <dt className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">
                        {label}
                      </dt>
                      <dd className="mt-1.5 text-sm text-ink/55">
                        To be confirmed
                      </dd>
                    </div>
                  )
                )}
              </dl>
              <DocumentFlag title="Details to be confirmed">
                <p>
                  No phone number, operating address or support-hours window has
                  been agreed, so none is published. The owner can add them with{" "}
                  <span className="font-mono text-[13px]">CONTACT_PHONE</span>,{" "}
                  <span className="font-mono text-[13px]">BUSINESS_ADDRESS</span>{" "}
                  and <span className="font-mono text-[13px]">SUPPORT_HOURS</span>{" "}
                  — see <span className="font-mono text-[13px]">.env.example</span>
                  .
                </p>
              </DocumentFlag>
            </>
          ),
        },
        {
          id: "how-fast-we-reply",
          title: "How quickly you will hear back",
          body: (
            <>
              <p>
                Payment verification is done by hand, so a paid registration can
                sit as pending for a short while before it is confirmed. Other
                messages are answered in the order they arrive.
              </p>
              <p>
                If a workshop is starting soon and your registration is still
                pending, email us with the subject{" "}
                <span className="font-mono text-[13px] text-brand">
                  Payment verification help
                </span>{" "}
                so it is easy to find. The purchase, refund and cancellation
                terms live on the{" "}
                <Link href="/refund-cancellation" className={linkClass}>
                  Refund &amp; cancellation policy
                </Link>{" "}
                and{" "}
                <Link href="/terms-and-conditions" className={linkClass}>
                  Terms &amp; conditions
                </Link>{" "}
                pages.
              </p>
              <DocumentFlag title="Response commitment to be confirmed">
                <p>
                  Formal support hours and a response-time commitment are not set
                  yet, so this page promises neither. Setting{" "}
                  <span className="font-mono text-[13px]">SUPPORT_HOURS</span>{" "}
                  publishes them here automatically.
                </p>
              </DocumentFlag>
            </>
          ),
        },
      ]}
    />
  );
}