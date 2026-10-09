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
  title: "Refund & cancellation policy — Agile Begins",
  description:
    "How refunds and cancellations work for Agile Begins workshops, notes, recordings and templates — including the decisions that are still to be confirmed.",
};

const linkClass =
  "font-semibold text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:text-ink";

export default function RefundCancellationPage() {
  const supportEmail = env.supportEmail();
  const { refundWindowDays } = env.policy();
  const windowDays = refundWindowDays ? Number(refundWindowDays) : null;

  return (
    <DocumentPage
      eyebrow="Legal"
      title="Refund & cancellation policy"
      intro={
        <>
          <p>
            This page explains how refunds and cancellations work for workshop
            seats and for the notes, recordings and templates that come with
            them.
          </p>
          <p>
            It only describes what Agile Begins has actually decided. Where a
            decision has not been made yet — a cancellation window, or refund
            rules for downloadable products — the page says so plainly instead of
            guessing, because students should know exactly where they stand
            before they pay.
          </p>
        </>
      }
      related={[
        { href: "/terms-and-conditions", label: "Terms & conditions" },
        { href: "/contact-us", label: "Contact us" },
        { href: "/workshop", label: "Explore workshops" },
      ]}
      sections={[
        {
          id: "the-short-version",
          title: "The short version",
          body: (
            <DocumentList
              items={[
                <>
                  Workshop seats are paid in full up front, and the number of
                  seats is limited, so cancellations are handled by emailing us
                  rather than through an automatic button.
                </>,
                <>
                  A registration stays pending until your payment is verified. If
                  a payment cannot be verified, the registration is marked as
                  rejected in our system and you can submit a corrected proof.
                </>,
                <>
                  If you paid and something went wrong — a duplicate payment, a
                  wrong screenshot, a rejected registration you believe is
                  correct — email us and we will re-check it.
                </>,
                <>
                  Refunds, where they apply, are returned through the same UPI
                  channel the payment came from. The exact windows and processing
                  times are flagged below because they have not been fixed yet.
                </>,
                <>
                  The full rules for using workshop material are in the{" "}
                  <Link href="/terms-and-conditions" className={linkClass}>
                    Terms &amp; conditions
                  </Link>
                  , and how we handle your data is in the{" "}
                  <Link href="/privacy-policy" className={linkClass}>
                    Privacy policy
                  </Link>
                  .
                </>,
              ]}
            />
          ),
        },
        {
          id: "workshop-cancellations",
          title: "Cancelling a workshop seat",
          body: (
            <>
              <p>
                A seat is for one live session on a fixed date and time, and it is
                capped by the number of seats shown on the workshop page. That is
                why cancelling early matters — the closer it gets to the session,
                the harder the seat is to fill.
              </p>
              <DocumentList
                items={[
                  <>
                    <DocumentStrong>Before the session starts.</DocumentStrong>{" "}
                    Email us as early as you can with the subject{" "}
                    <span className="font-mono text-[13px] text-brand">
                      Refund or cancellation request
                    </span>
                    . We will tell you what we can do in your case. The formal
                    cancellation window is not set yet — see the flag below.
                  </>,
                  <>
                    <DocumentStrong>After the session has run.</DocumentStrong>{" "}
                    Once a session has been delivered and its recording and notes
                    have been shared with you, the material has already been
                    provided. Requests at that point are reviewed individually,
                    and the formal terms for them are still to be decided (see
                    the flag below).
                  </>,
                  <>
                    <DocumentStrong>If you cannot attend but want to keep the
                    material.</DocumentStrong> Tell us before the session. Where
                    the recording and notes can be shared with you anyway, we will
                    say so in our reply.
                  </>,
                ]}
              />
              <DocumentNote>
                <p>
                  Nobody is charged twice for the same seat: a duplicate
                  registration for the same workshop is blocked, and a
                  transaction ID that has already been used on another
                  registration is rejected automatically.
                </p>
              </DocumentNote>
            </>
          ),
        },
        {
          id: "payments-we-could-not-verify",
          title: "When a payment cannot be verified",
          body: (
            <>
              <p>
                Payments are checked by hand. When the amount, the transaction ID
                or the screenshot does not line up, the registration is marked as
                rejected and you can submit a corrected proof for the same
                workshop.
              </p>
              <DocumentList
                items={[
                  <>
                    <DocumentStrong>Wrong or missing screenshot.</DocumentStrong>{" "}
                    Email us with the transaction ID and the UPI reference from
                    your app, and we will re-check the payment.
                  </>,
                  <>
                    <DocumentStrong>Paid twice by mistake.</DocumentStrong> Send
                    us both transaction IDs. We will verify them and work out how
                    to return the extra amount — the processing details for that
                    are part of the flag below.
                  </>,
                  <>
                    <DocumentStrong>Paid by a different UPI account.</DocumentStrong>{" "}
                    Tell us which account the payment came from, since the name on
                    the payment may not match the name on your registration.
                  </>,
                ]}
              />
              <DocumentNote>
                <p>
                  You will never lose a seat for a genuine payment. What we cannot
                  do is confirm a seat for a payment we cannot see, so please keep
                  the payment confirmation in your UPI app until your seat is
                  confirmed by email.
                </p>
              </DocumentNote>
            </>
          ),
        },
        {
          id: "if-we-move-a-session",
          title: "If Agile Begins reschedules or cancels a session",
          body: (
            <>
              <p>
                If a session has to be moved, we email everyone registered with
                the new date and time. If the new time does not work for you, get
                in touch and we will look at it individually.
              </p>
              <p>
                A change made on our side is treated differently from a
                cancellation you make, and it is the one case where returning the
                fee is the clear expectation — but the exact procedure and timing
                are not set yet, so they are flagged below rather than promised
                here.
              </p>
            </>
          ),
        },
        {
          id: "digital-products",
          title: "Digital products, templates and recordings",
          body: (
            <>
              <p>
                Today, notes, recordings and templates are not sold on their own.
                They are included with a workshop registration, so there is no
                separate standalone download to refund — the rules are the same as
                for the workshop seat they came with.
              </p>
              <DocumentFlag title="Refund rules for standalone digital products are not finalised">
                <p>
                  Agile Begins has not yet launched a standalone digital product,
                  so no refund rule for one has been decided — and none is
                  invented here, including any claim that digital products are
                  automatically non-refundable.
                </p>
                <p>Before the first standalone product goes on sale, decide:</p>
                <DocumentList
                  items={[
                    <>
                      whether a refund is possible <em>before</em> the file is
                      downloaded or the link is opened;
                    </>,
                    <>
                      whether it is possible <em>after</em> the file has been
                      downloaded or accessed, and if so for how long;
                    </>,
                    <>
                      whether a partial refund or credit applies when only part of
                      a bundle has been used;
                    </>,
                    <>
                      how the rule is shown on the product page and in the
                      checkout step, so it is visible before purchase.
                    </>,
                  ]}
                />
                <p>
                  Until then, this page will keep saying that the position is not
                  set, rather than implying a rule that does not exist.
                </p>
              </DocumentFlag>
            </>
          ),
        },
        {
          id: "how-to-request",
          title: "How to request a refund or cancellation",
          body: (
            <>
              <p>
                Requests are handled by email so there is a written record for
                both sides. Send your request to{" "}
                <a href={`mailto:${supportEmail}`} className={linkClass}>
                  {supportEmail}
                </a>{" "}
                with the subject{" "}
                <span className="font-mono text-[13px] text-brand">
                  Refund or cancellation request
                </span>
                , and include:
              </p>
              <DocumentList
                items={[
                  <>The email address on your Agile Begins account.</>,
                  <>The workshop name or number (for example, Workshop 001).</>,
                  <>
                    Your UPI transaction ID or reference number, and the payment
                    screenshot if you still have it.
                  </>,
                  <>
                    What you want to happen — a cancelled seat, a refund, or a
                    re-check of a rejected registration.
                  </>,
                  <>
                    Why, in a line or two. It helps us understand the situation
                    and decide fairly.
                  </>,
                ]}
              />
              <DocumentNote>
                <p>
                  Email us as early as possible. A message that reaches us before
                  the session is much easier to act on than one that arrives
                  after, and it gives someone else a chance at a limited seat.
                </p>
              </DocumentNote>
            </>
          ),
        },
        {
          id: "how-refunds-are-paid",
          title: "How and when refunds are paid",
          body: (
            <>
              <p>
                Where a refund is agreed, it is returned through the same UPI
                channel the payment arrived from. We cannot send a refund to a
                different UPI ID or bank account, and we will ask you to confirm
                the details before sending anything.
              </p>
              <p>
                Once a refund has been initiated from our side, how quickly the
                money shows up in your account depends on your bank and UPI app,
                not on us.
              </p>
              <DocumentFlag title="Refund windows and processing times to be confirmed">
                <p>
                  These decisions are still open, so this page does not state
                  them: how many days before a session a cancellation is
                  accepted, any fee or deduction that applies, and how many
                  working days a refund takes to be processed.
                </p>
                {windowDays ? (
                  <p>
                    A cancellation window is currently configured as {windowDays}{" "}
                    day{windowDays === 1 ? "" : "s"} — review the wording of this
                    page once the policy is finalised.
                  </p>
                ) : (
                  <p>
                    To publish a cancellation window, set{" "}
                    <span className="font-mono text-[13px]">
                      REFUND_WINDOW_DAYS
                    </span>{" "}
                    (the number of days before a session a cancellation is
                    accepted, for example{" "}
                    <span className="font-mono text-[13px]">3</span>). This page
                    then shows the decision and removes this notice. Until it is
                    set, students see this flag rather than an invented window.
                  </p>
                )}
              </DocumentFlag>
            </>
          ),
        },
        {
          id: "what-this-policy-does-not-cover",
          title: "What this policy does not cover",
          body: (
            <DocumentList
              items={[
                <>
                  Issues with a UPI app, your bank, or your internet connection.
                  Those are handled by your provider.
                </>,
                <>
                  A session you could not attend because you did not see the
                  confirmation email. Keep the address on your registration
                  current, and check it after you pay.
                </>,
                <>
                  Anything you bought from another platform or teacher, even if it
                  covers similar topics. Agile Begins is not the seller in that
                  case.
                </>,
                <>
                  A repeat request for the same payment, or a request that
                  contradicts the{" "}
                  <Link href="/terms-and-conditions" className={linkClass}>
                    Terms &amp; conditions
                  </Link>
                  . We will tell you if we cannot act on a request, and why.
                </>,
              ]}
            />
          ),
        },
        {
          id: "contact",
          title: "Who to contact",
          body: (
            <>
              <p>
                Every refund or cancellation request goes to the same address:{" "}
                <a href={`mailto:${supportEmail}`} className={linkClass}>
                  {supportEmail}
                </a>
                . Use the subject{" "}
                <span className="font-mono text-[13px] text-brand">
                  Refund or cancellation request
                </span>{" "}
                so it is easy to find, and include the details listed above.
              </p>
              <p>
                For anything that is not about a refund — a workshop question, a
                login problem, a payment that is still pending —{" "}
                <Link href="/contact-us" className={linkClass}>
                  Contact us
                </Link>{" "}
                lists the subject lines that route fastest.
              </p>
              <DocumentFlag title="Support hours and formal terms to be confirmed">
                <p>
                  Support hours and a response-time commitment are still open,
                  and these documents have not yet been reviewed professionally.
                  Until then, this page describes the situation as it stands and
                  flags every open decision rather than presenting it as settled.
                </p>
              </DocumentFlag>
            </>
          ),
        },
      ]}
    />
  );
}