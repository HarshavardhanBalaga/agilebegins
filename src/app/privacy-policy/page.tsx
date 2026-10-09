import type { Metadata } from "next";
import Link from "next/link";

import {
  DocumentFlag,
  DocumentList,
  DocumentNote,
  DocumentPage,
  DocumentStrong,
} from "@/components/layout/DocumentPage";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy policy — Agile Begins",
  description:
    "What Agile Begins collects when you create an account or register for a workshop, how it is used and stored, and the choices you have.",
};

const linkClass =
  "font-semibold text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:text-ink";

export default function PrivacyPolicyPage() {
  const supportEmail = env.supportEmail();
  const { privacyContact } = env.policy();

  return (
    <DocumentPage
      eyebrow="Legal"
      title="Privacy policy"
      intro={
        <>
          <p>
            This policy explains what Agile Begins collects when you use this
            website, why we need it, how long we keep it, and how you can ask us
            to change or delete it.
          </p>
          <p>
            It describes the platform as it is actually built today. If the way
            we handle data changes, this page changes with it.
          </p>
        </>
      }
      related={[
        { href: "/terms-and-conditions", label: "Terms & conditions" },
        { href: "/refund-cancellation", label: "Refund & cancellation" },
        { href: "/contact-us", label: "Contact us" },
      ]}
      sections={[
        {
          id: "what-this-covers",
          title: "What this policy covers",
          body: (
            <>
              <p>
                This policy covers the personal information handled by the Agile
                Begins website: accounts, workshop registrations, payments made
                by UPI, support emails, and the session cookies that keep you
                logged in.
              </p>
              <p>
                It does not cover third-party services you use separately — for
                example a UPI app, Google Meet, or WhatsApp. Those services have
                their own privacy policies.
              </p>
            </>
          ),
        },
        {
          id: "information-we-collect",
          title: "Information we collect",
          body: (
            <>
              <DocumentList
                items={[
                  <>
                    <DocumentStrong>Account information.</DocumentStrong> Your
                    name, email address and password when you create an account.
                    The password is stored only as a bcrypt hash — nobody at
                    Agile Begins can read it. We also store whether your email is
                    verified and when the account was created or updated.
                  </>,
                  <>
                    <DocumentStrong>Registration details.</DocumentStrong> When
                    you reserve a seat we collect your name, email address, phone
                    number (an Indian mobile number, stored in a normalised form),
                    college, branch, year of study, and the workshop you are
                    registering for.
                  </>,
                  <>
                    <DocumentStrong>Payment information.</DocumentStrong> The
                    transaction ID or UPI reference (optional) and the payment
                    screenshot you upload, plus the payment status our team sets
                    after reviewing it.
                  </>,
                  <>
                    <DocumentStrong>Support emails.</DocumentStrong> The messages
                    you send us, which we keep so we can follow up and keep a
                    record of what was agreed.
                  </>,
                  <>
                    <DocumentStrong>Update and attendance records.</DocumentStrong>{" "}
                    Whether a confirmation email was sent, and whether you
                    attended the session.
                  </>,
                  <>
                    <DocumentStrong>Technical logs.</DocumentStrong> Our servers
                    and hosting provider may record standard request information
                    such as IP address, browser type and timestamps for security
                    and debugging.
                  </>,
                ]}
              />
              <DocumentNote>
                <p>
                  We do not receive or store your card or bank credentials. UPI
                  payments happen in your own UPI app, between you and your bank;
                  we only see what you send us as proof of payment.
                </p>
              </DocumentNote>
            </>
          ),
        },
        {
          id: "how-we-use-it",
          title: "How we use your information",
          body: (
            <DocumentList
              items={[
                <>Create and secure your account, and let you log in.</>,
                <>
                  Confirm your details, reserve your seat and match your payment
                  to your registration.
                </>,
                <>
                  Verify your payment by hand and send you the confirmation email
                  with the session details and Google Meet link.
                </>,
                <>
                  Email reminders and any changes to a workshop you registered
                  for.
                </>,
                <>
                  Share the recording, notes or templates your registration
                  includes.
                </>,
                <>Answer your support questions and resolve payment issues.</>,
                <>
                  Keep the platform safe and working: prevent duplicate
                  registrations, abuse and fraud, and diagnose errors.
                </>,
                <>
                  Maintain the records we are expected to keep for payments,
                  accounting and disputes.
                </>,
              ]}
            />
          ),
        },
        {
          id: "cookies",
          title: "Cookies and local storage",
          body: (
            <>
              <p>
                Agile Begins uses only the cookies needed to keep you signed in.
                There are no advertising cookies and no third-party analytics or
                tracking scripts on this site.
              </p>
              <DocumentList
                items={[
                  <>
                    <DocumentStrong>access_token</DocumentStrong> — a short-lived
                    session token (about 15 minutes) that identifies you while you
                    move around the site.
                  </>,
                  <>
                    <DocumentStrong>refresh_token</DocumentStrong> — a longer
                    session token (about 7 days) that quietly issues a new access
                    token so you are not logged out mid-task.
                  </>,
                ]}
              />
              <p>
                Both are HTTP-only cookies, which means page scripts cannot read
                them, and they are marked SameSite=Lax as protection against
                cross-site request forgery. We keep only a SHA-256 hash of the
                refresh token in our database, never the token itself.
              </p>
              <DocumentNote>
                <p>
                  If analytics or marketing tools are added later, this section
                  will be updated before they go live, along with the choices
                  available to you.
                </p>
              </DocumentNote>
            </>
          ),
        },
        {
          id: "payments",
          title: "Payments and payment proof",
          body: (
            <>
              <p>
                Workshop fees are paid by UPI directly to the UPI ID shown on the
                payment step of registration. Money moves between your bank and
                your UPI app — Agile Begins never sees your card or bank
                credentials.
              </p>
              <p>
                To match a payment to you we ask for the transaction ID (optional)
                and a screenshot of the payment, which is required. Those are
                used only to verify the payment, to keep a record of who paid for
                which seat, and to answer a dispute if one comes up. Payment
                screenshots are only accessible through authenticated admin
                views.
              </p>
              <DocumentNote>
                <p>
                  A transaction ID that has already been used on another
                  registration is rejected automatically, which is one of the
                  ways duplicate or reused payment proofs are caught.
                </p>
              </DocumentNote>
            </>
          ),
        },
        {
          id: "who-we-share-with",
          title: "Who we share information with",
          body: (
            <>
              <p>
                We do not sell personal information and we do not share it with
                advertising networks. Information is shared only with the
                services needed to run Agile Begins:
              </p>
              <DocumentList
                items={[
                  <>
                    <DocumentStrong>Database hosting</DocumentStrong> — our
                    MongoDB database stores accounts, registrations, payment
                    proofs and session records.
                  </>,
                  <>
                    <DocumentStrong>Email delivery</DocumentStrong> — a
                    transactional email provider sends verification links,
                    registration emails and confirmations to your address.
                  </>,
                  <>
                    <DocumentStrong>Website hosting</DocumentStrong> — the
                    platform and its server logs run on a third-party host.
                  </>,
                  <>
                    <DocumentStrong>Google Meet</DocumentStrong> — live sessions
                    run there. Joining a session is governed by Google&apos;s own
                    terms and privacy policy.
                  </>,
                  <>
                    <DocumentStrong>WhatsApp</DocumentStrong> — only if you choose
                    to join the community group, which is governed by WhatsApp
                    &apos;s terms.
                  </>,
                  <>
                    <DocumentStrong>Agile Begins team members</DocumentStrong> —
                    admins can view registrations and payment proofs to verify
                    payments, mark attendance and export records.
                  </>,
                  <>
                    <DocumentStrong>Legal obligations</DocumentStrong> — where we
                    are required to disclose information by law or to respond to
                    a valid legal request.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "retention",
          title: "How long we keep your information",
          body: (
            <>
              <p>
                These are the retention periods the platform actually applies
                today, rather than a general statement:
              </p>
              <DocumentList
                items={[
                  <>
                    <DocumentStrong>Accounts</DocumentStrong> — kept while your
                    account exists, and until you ask us to delete it.
                  </>,
                  <>
                    <DocumentStrong>Registrations and payment records</DocumentStrong>{" "}
                    — kept after a workshop is over, so we can answer questions
                    about who attended and prove that a payment was made.
                  </>,
                  <>
                    <DocumentStrong>Session records</DocumentStrong> — refresh
                    tokens expire after about 7 days and are removed by a TTL
                    index automatically; revoked tokens stay flagged so they can
                    never be replayed.
                  </>,
                  <>
                    <DocumentStrong>Password reset codes</DocumentStrong> — expire
                    in 10 minutes and are removed automatically. Only a hash of
                    the code is stored, never the code itself.
                  </>,
                  <>
                    <DocumentStrong>Support emails</DocumentStrong> — kept while
                    they are useful for follow-up and record keeping.
                  </>,
                ]}
              />
              <DocumentFlag title="Retention schedule to be confirmed">
                <p>
                  A formal retention schedule — including how long payment and
                  attendance records are kept to satisfy accounting and tax rules
                  — has not been agreed yet. Until it is, records are kept for as
                  long as they are needed for the purposes above, and we will say
                  so here once fixed periods are set.
                </p>
              </DocumentFlag>
            </>
          ),
        },
        {
          id: "security",
          title: "How we protect your information",
          body: (
            <DocumentList
              items={[
                <>
                  Passwords are stored as bcrypt hashes and are never shown to
                  anyone, including admins.
                </>,
                <>
                  Sessions use signed tokens in HTTP-only, SameSite=Lax cookies,
                  so page scripts cannot read them.
                </>,
                <>
                  Refresh tokens are rotated on use and stored only as SHA-256
                  hashes, so a database leak does not hand over a usable session.
                </>,
                <>
                  Email verification links (24 hours) and password reset codes
                  (10 minutes, limited attempts) are short-lived and single-use.
                </>,
                <>
                  Admin pages and admin APIs re-verify your session on the server
                  every time; a page is never protected only by hiding a link.
                </>,
                <>
                  Form input is validated and sanitised before it is stored, and
                  CSV exports are guarded against formula injection.
                </>,
              ]}
            />
          ),
        },
        {
          id: "your-choices",
          title: "Your choices and rights",
          body: (
            <>
              <p>
                You can ask us to do any of the following, and we will act on
                reasonable requests:
              </p>
              <DocumentList
                items={[
                  <>
                    <DocumentStrong>Access</DocumentStrong> — ask what personal
                    information we hold about you.
                  </>,
                  <>
                    <DocumentStrong>Correction</DocumentStrong> — ask us to fix
                    details on your account or a registration that are wrong, for
                    example a misspelled college name.
                  </>,
                  <>
                    <DocumentStrong>Deletion</DocumentStrong> — ask us to delete
                    your account and personal information. We may need to keep
                    payment and attendance records where we are required to.
                  </>,
                  <>
                    <DocumentStrong>Withdraw consent</DocumentStrong> — stop
                    receiving non-essential emails at any time. Emails that are
                    part of a purchase you made, such as a confirmation or a
                    session change notice, are still sent.
                  </>,
                  <>
                    <DocumentStrong>Object or complain</DocumentStrong> — tell us
                    if you think your information has been handled badly, and we
                    will look into it.
                  </>,
                ]}
              />
              <p>
                To make a request, email{" "}
                <a
                  href={`mailto:${privacyContact ?? supportEmail}`}
                  className={linkClass}
                >
                  {privacyContact ?? supportEmail}
                </a>{" "}
                from the address on your account, so we know the request is
                really yours.
              </p>
            </>
          ),
        },
        {
          id: "children",
          title: "Students under 18",
          body: (
            <p>
              Agile Begins is aimed at college students and is not designed for
              children. If you are under 18, please use the platform with the
              knowledge of a parent or guardian.
            </p>
          ),
        },
        {
          id: "changes-and-contact",
          title: "Changes to this policy, and who to contact",
          body: (
            <>
              <p>
                When the way we handle information changes, this page is updated
                and the &ldquo;last updated&rdquo; date at the top changes with
                it. Material changes that affect what you agreed to will also be
                emailed to registered students.
              </p>
              <p>
                Privacy questions and requests go to{" "}
                <a
                  href={`mailto:${privacyContact ?? supportEmail}`}
                  className={linkClass}
                >
                  {privacyContact ?? supportEmail}
                </a>
                . For anything else — a workshop, a payment or your account — use{" "}
                <Link href="/contact-us" className={linkClass}>
                  Contact us
                </Link>{" "}
                or email{" "}
                <a href={`mailto:${supportEmail}`} className={linkClass}>
                  {supportEmail}
                </a>
                .
              </p>
              <DocumentFlag title="Privacy contact and legal entity to be confirmed">
                <p>
                  A dedicated privacy or grievance contact has not been appointed
                  yet, so the general support address is used above. Set{" "}
                  <span className="font-mono text-[13px]">PRIVACY_CONTACT</span>{" "}
                  to publish a dedicated contact, and{" "}
                  <span className="font-mono text-[13px]">LEGAL_ENTITY_NAME</span>{" "}
                  to name the registered business that is responsible for this
                  data.
                </p>
              </DocumentFlag>
            </>
          ),
        },
      ]}
    />
  );
}