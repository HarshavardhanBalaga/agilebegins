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
  title: "Terms & conditions — Agile Begins",
  description:
    "The rules for using Agile Begins: accounts, workshop registration, payments, what you may do with notes, recordings and templates, and how accounts can be closed.",
};

const linkClass =
  "font-semibold text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:text-ink";

export default function TermsAndConditionsPage() {
  const supportEmail = env.supportEmail();
  const { governingLaw } = env.policy();

  return (
    <DocumentPage
      eyebrow="Legal"
      title="Terms & conditions"
      intro={
        <>
          <p>
            These terms are the agreement between you and Agile Begins for using
            this website and buying what we offer: live workshop seats, and the
            notes, recordings and templates that come with them.
          </p>
          <p>
            By creating an account or registering for a workshop, you accept
            these terms. If anything here is unclear, email{" "}
            <a href={`mailto:${supportEmail}`} className={linkClass}>
              {supportEmail}
            </a>{" "}
            before you pay.
          </p>
        </>
      }
      related={[
        { href: "/privacy-policy", label: "Privacy policy" },
        { href: "/refund-cancellation", label: "Refund & cancellation" },
        { href: "/contact-us", label: "Contact us" },
      ]}
      sections={[
        {
          id: "who-can-use-agile-begins",
          title: "Who can use Agile Begins",
          body: (
            <>
              <DocumentList
                items={[
                  <>
                    Agile Begins is intended for students and learners. You need a
                    valid email address you can access, because verification and
                    confirmation are sent there.
                  </>,
                  <>
                    If you are under 18, use the platform with the knowledge of a
                    parent or guardian.
                  </>,
                  <>
                    One person, one account. Details you give us — name, phone,
                    college, branch, year — must be your own and accurate, so we
                    can match your payment and reach you about the session.
                  </>,
                  <>
                    You are responsible for keeping your password private. Tell us
                    straight away at{" "}
                    <a href={`mailto:${supportEmail}`} className={linkClass}>
                      {supportEmail}
                    </a>{" "}
                    if you think someone else has access to your account.
                  </>,
                  <>
                    Seats are personal. You may not buy a seat on behalf of
                    someone else, or transfer a registration to another person,
                    without asking us first.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "using-the-platform",
          title: "Rules for using the platform",
          body: (
            <DocumentList
              items={[
                <>
                  Do not attempt to break, overload, scrape or gain unauthorised
                  access to the site, its APIs or the admin areas.
                </>,
                <>
                  Do not submit a payment screenshot or transaction ID that is not
                  yours, or reuse one that has already been used for another
                  registration. Reused transaction IDs are rejected automatically
                  and abusive submissions can lead to a blocked account.
                </>,
                <>
                  Do not impersonate another person or a member of the Agile
                  Begins team when contacting us or joining the community.
                </>,
                <>
                  Do not create multiple accounts to work around a limit, or to
                  get around a rejected registration.
                </>,
                <>
                  Keep support emails and community messages civil. Abuse,
                  harassment or spam ends the conversation and may end your
                  account.
                </>,
              ]}
            />
          ),
        },
        {
          id: "what-you-are-buying",
          title: "What you are buying",
          body: (
            <>
              <p>
                A workshop registration is a seat for one live session, plus
                whatever that workshop page says is included — typically the
                session recording, written notes, and any templates or resource
                pack listed for that workshop. What is included is described on
                each workshop page before you pay.
              </p>
              <DocumentNote>
                <p>
                  Workshops listed as coming soon cannot be purchased. A
                  registration is only possible for a workshop that is live, and
                  the number of seats is shown on the workshop page.
                </p>
              </DocumentNote>
              <p>
                Where we openly offer digital resources, they are supplied for
                your own learning. They are learning material, not a licence to
                resell, and they do not come with any promise of a particular
                outcome (see the section on results below).
              </p>
            </>
          ),
        },
        {
          id: "pricing-and-payment",
          title: "Prices and payment",
          body: (
            <>
              <DocumentList
                items={[
                  <>
                    Prices are shown in Indian Rupees on the workshop page and on
                    the payment step, and must be paid in full to reserve a seat.
                  </>,
                  <>
                    Payment is made by UPI to the UPI ID shown during
                    registration. You are responsible for paying the correct
                    amount and for any charges your bank or UPI app applies.
                  </>,
                  <>
                    A registration stays pending until a team member verifies your
                    payment, which is done by hand and usually takes a few hours.
                    Your seat is confirmed only when you receive the confirmation
                    email.
                  </>,
                  <>
                    Uploading a payment screenshot is required, and the
                    transaction ID is optional but helps us verify faster. If the
                    proof does not match the amount or the account, the
                    registration can be rejected.
                  </>,
                  <>
                    If we raise the price of a future workshop, it applies from
                    that point on — it never changes the price of a seat you have
                    already paid for.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "workshop-access-and-changes",
          title: "Workshop access and changes",
          body: (
            <>
              <DocumentList
                items={[
                  <>
                    Sessions run on Google Meet. The meeting link is emailed when
                    your payment is verified, so keep the address on your
                    registration up to date.
                  </>,
                  <>
                    Join on time. A seat is for one person, and sharing the
                    meeting link or letting others join on your seat is not
                    allowed.
                  </>,
                  <>
                    Recordings, notes and templates are shared with students who
                    registered for that workshop.
                  </>,
                  <>
                    If a session has to be rescheduled, we will email everyone
                    registered. Where a change means you cannot attend at all, the{" "}
                    <Link href="/refund-cancellation" className={linkClass}>
                      Refund &amp; cancellation policy
                    </Link>{" "}
                    explains what we can do.
                  </>,
                  <>
                    Workshop content reflects what we know at the time of the
                    session. Tools, hiring practices and platforms change, so we
                    may update or replace material in later sessions.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "materials-and-licence",
          title: "Notes, recordings, templates and what you may do with them",
          body: (
            <>
              <p>
                When your registration includes notes, a recording or a template,
                you get a personal, non-exclusive licence to use that material for
                your own learning. That means:
              </p>
              <DocumentList
                items={[
                  <>
                    <DocumentStrong>You can</DocumentStrong> study it, keep it,
                    and apply it to your own projects, resumes, profiles and
                    applications.
                  </>,
                  <>
                    <DocumentStrong>You can</DocumentStrong> adapt a template to
                    your own situation and use the result for yourself.
                  </>,
                  <>
                    <DocumentStrong>You may not</DocumentStrong> resell, rent,
                    sublicense or redistribute the material, or post it publicly
                    as your own or as a free resource for others.
                  </>,
                  <>
                    <DocumentStrong>You may not</DocumentStrong> share paid
                    material — including recordings, notes and templates — with
                    students who did not register for that workshop, or upload it
                    to file-sharing sites, groups or paid course platforms.
                  </>,
                  <>
                    <DocumentStrong>You may not</DocumentStrong> reuse Agile Begins
                    material, slides or content to run your own workshop, course
                    or paid programme.
                  </>,
                ]}
              />
              <DocumentNote>
                <p>
                  Sharing a link or a file with a friend looks harmless, but it is
                  what makes small workshops impossible to keep running. If a
                  classmate wants the material, point them at the workshop page
                  instead.
                </p>
              </DocumentNote>
            </>
          ),
        },
        {
          id: "intellectual-property",
          title: "Intellectual property",
          body: (
            <>
              <p>
                The Agile Begins name, logo, website, workshop content, notes,
                templates, graphics and written material belong to Agile Begins or
                the people who created them. Nothing on this site transfers
                ownership of that material to you.
              </p>
              <p>
                Your work stays yours: projects, resumes and anything you build
                using what you learned belong to you, with no claim from us.
              </p>
              <p>
                The names of other companies, tools and platforms mentioned in our
                sessions — such as Google Meet, GitHub or LinkedIn — belong to
                their owners, are used for identification only, and do not imply
                any partnership or endorsement.
              </p>
            </>
          ),
        },
        {
          id: "service-availability",
          title: "Service availability",
          body: (
            <DocumentList
              items={[
                <>
                  The website is provided as it is. It can be temporarily
                  unavailable for maintenance, hosting issues or network problems,
                  and we do not guarantee uninterrupted access.
                </>,
                <>
                  Live sessions can be affected by things outside our control, such
                  as a participant&apos;s internet connection, device or the meeting
                  platform. If a session fails technically on our side, we will
                  reschedule it or share the recording with everyone registered.
                </>,
                <>
                  We may add, change or retire a workshop, and we may correct
                  mistakes in descriptions or prices. A price already paid is
                  never changed after the fact.
                </>,
                <>
                  We may suspend or close an account that breaks these terms —
                  for example by submitting a fraudulent payment proof, abusing
                  the site, or redistributing paid material. Where we can, we will
                  tell you why.
                </>,
                <>
                  Our liability is limited to the amount you paid for the
                  workshop or resource in question. We are not liable for indirect
                  losses, such as missed opportunities or lost income, and nothing
                  in these terms excludes liability that cannot be excluded by
                  law.
                </>,
              ]}
            />
          ),
        },
        {
          id: "no-outcome-promise",
          title: "Results are not promised",
          body: (
            <>
              <p>
                Agile Begins teaches and shares guidance. It does not promise
                internships, placements, jobs, salaries or any other specific
                outcome. Hiring decisions belong to employers, not to us.
              </p>
              <p>
                Nothing in a workshop or a resource is a substitute for your own
                work, practice or judgement, and our material is not professional
                legal, financial or career-placement advice.
              </p>
            </>
          ),
        },
        {
          id: "changes-to-these-terms",
          title: "Changes to these terms",
          body: (
            <>
              <p>
                When these terms change, this page is updated and the &ldquo;last
                updated&rdquo; date at the top changes with it. New terms apply to
                purchases made after they are published — they do not
                retroactively change the deal behind a seat you already paid for.
              </p>
              <p>
                Material changes that affect what you already agreed to are also
                emailed to registered students.
              </p>
            </>
          ),
        },
        {
          id: "contact-and-law",
          title: "Contact and applicable law",
          body: (
            <>
              <p>
                Questions about these terms, or a dispute about a purchase, go to{" "}
                <a href={`mailto:${supportEmail}`} className={linkClass}>
                  {supportEmail}
                </a>
                . Most things are sorted out with a reply —{" "}
                <Link href="/contact-us" className={linkClass}>
                  Contact us
                </Link>{" "}
                explains what to include.
              </p>
              <p>
                Purchases, refunds and cancellations are also governed by the{" "}
                <Link href="/refund-cancellation" className={linkClass}>
                  Refund &amp; cancellation policy
                </Link>
                , and personal data is handled as described in the{" "}
                <Link href="/privacy-policy" className={linkClass}>
                  Privacy policy
                </Link>
                .
              </p>
              {governingLaw ? (
                <p>
                  These terms are governed by the laws of {governingLaw}.
                </p>
              ) : (
                <DocumentFlag title="Legal information to be confirmed">
                  <p>
                    The registered business name, the address for legal notices
                    and the governing law and jurisdiction for these terms have
                    not been confirmed, so nothing is asserted here. Set{" "}
                    <span className="font-mono text-[13px]">LEGAL_ENTITY_NAME</span>
                    ,{" "}
                    <span className="font-mono text-[13px]">
                      BUSINESS_ADDRESS
                    </span>{" "}
                    and{" "}
                    <span className="font-mono text-[13px]">GOVERNING_LAW</span>{" "}
                    to publish them — this notice disappears automatically once{" "}
                    <span className="font-mono text-[13px]">GOVERNING_LAW</span> is
                    set.
                  </p>
                  <p>
                    Have these terms reviewed by a qualified professional before
                    launch.
                  </p>
                </DocumentFlag>
              )}
            </>
          ),
        },
      ]}
    />
  );
}