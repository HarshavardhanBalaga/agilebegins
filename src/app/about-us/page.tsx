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
  title: "About Agile Begins — practical learning for students",
  description:
    "What Agile Begins is, who it is built for, the problems it solves for students, and the workshops, notes, templates and recordings available today.",
};

const linkClass =
  "font-semibold text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:text-ink";

export default function AboutUsPage() {
  const supportEmail = env.supportEmail();

  return (
    <DocumentPage
      eyebrow="About us"
      title="About Agile Begins"
      intro={
        <>
          <p>
            Agile Begins is a learning platform for students. We run live,
            practical workshops on the things college rarely explains directly —
            how to choose skills that matter, how to build projects that prove
            them, and how to get ready for an internship.
          </p>
          <p>
            Everything here is built around one job: helping you move from
            confusion to clarity, and from clarity to something you can actually
            show — a project, a profile, a plan.
          </p>
        </>
      }
      related={[
        { href: "/workshop", label: "Explore workshops" },
        { href: "/register", label: "Reserve your seat" },
        { href: "/contact-us", label: "Contact us" },
      ]}
      footnote={
        <DocumentFlag title="Business details to be confirmed">
          <p>
            The registered business name, operating address and support hours for
            Agile Begins are not published yet, so nothing is stated here about
            them. These are configuration values the site owner can fill in (
            <code className="font-mono text-[13px] text-brand">
              LEGAL_ENTITY_NAME
            </code>
            ,{" "}
            <code className="font-mono text-[13px] text-brand">
              BUSINESS_ADDRESS
            </code>
            ,{" "}
            <code className="font-mono text-[13px] text-brand">
              SUPPORT_HOURS
            </code>
            ) — see <span className="font-mono text-[13px]">.env.example</span>.
            This notice replaces them until then.
          </p>
        </DocumentFlag>
      }
      sections={[
        {
          id: "what-agile-begins-is",
          title: "What Agile Begins is",
          body: (
            <>
              <p>
                Agile Begins is a student-focused learning platform. We publish
                live workshops, and the notes, templates and recordings that come
                with them, so that learning turns into work you can point at.
              </p>
              <DocumentNote>
                <p>
                  Agile Begins is not a web development agency and does not take
                  on client projects. It exists for one audience: students.
                </p>
              </DocumentNote>
              <p>
                We are early. What we offer today is written on this page, and
                anything new gets described here before it is sold — never the
                other way around.
              </p>
            </>
          ),
        },
        {
          id: "who-its-for",
          title: "Who it is for",
          body: (
            <>
              <p>
                Agile Begins is built for students who want a clear next step,
                especially:
              </p>
              <DocumentList
                items={[
                  <>
                    <DocumentStrong>2nd-year students and beyond</DocumentStrong>{" "}
                    who are starting to feel the pressure to figure things out
                    early.
                  </>,
                  <>
                    <DocumentStrong>Self-taught learners</DocumentStrong> who are
                    picking up development from scattered tutorials and want an
                    order to do things in.
                  </>,
                  <>
                    <DocumentStrong>
                      Students preparing for internships
                    </DocumentStrong>{" "}
                    who want their first applications to actually land.
                  </>,
                  <>
                    <DocumentStrong>Anyone who feels behind</DocumentStrong> and
                    wants an honest answer about what to learn, what to leave
                    out, and what to do next.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "the-problem-we-solve",
          title: "The problem we are solving",
          body: (
            <>
              <p>
                Most students do not struggle because information is missing.
                They struggle because there is too much of it — hundreds of
                roadmaps and must-learn lists, with very little saying what
                actually matters for where you are right now.
              </p>
              <p>
                That turns into a familiar loop: you start a course, do not
                finish it, do not build anything, and still cannot tell whether
                you are on the right track. Agile Begins is our attempt to break
                that loop with a prioritised, honest path — what to learn, what
                to skip, what to build, and what to do next.
              </p>
            </>
          ),
        },
        {
          id: "what-we-offer-today",
          title: "What we offer today",
          body: (
            <>
              <p>
                This is what exists right now. Nothing is listed here unless you
                can actually sign up for it.
              </p>
              <DocumentList
                items={[
                  <>
                    <DocumentStrong>Live workshops</DocumentStrong> — 90-minute
                    sessions on Google Meet with a live Q&amp;A at the end.
                    Workshop 001, What I Wish I Knew in 2nd Year, is ₹49 and
                    covers career clarity, the skills worth your time, building
                    projects correctly, and internship preparation.
                  </>,
                  <>
                    <DocumentStrong>Workshop notes</DocumentStrong> — written
                    notes so you can revisit everything after the session.
                  </>,
                  <>
                    <DocumentStrong>
                      Recordings for registered attendees
                    </DocumentStrong>{" "}
                    — sessions are recorded and shared with the students who
                    registered for them.
                  </>,
                  <>
                    <DocumentStrong>Templates and resource packs</DocumentStrong>{" "}
                    — practical starting points that come with the relevant
                    workshop, such as a resume template, headline options and
                    outreach message templates.
                  </>,
                  <>
                    <DocumentStrong>A WhatsApp community</DocumentStrong> — for
                    reminders and updates about upcoming sessions.
                  </>,
                  <>
                    <DocumentStrong>Email support</DocumentStrong> — reach a
                    person at{" "}
                    <a href={`mailto:${supportEmail}`} className={linkClass}>
                      {supportEmail}
                    </a>{" "}
                    about a workshop, a payment or your account.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "how-a-workshop-works",
          title: "How a workshop works, start to finish",
          body: (
            <>
              <ol className="space-y-3">
                {[
                  <>Create an account and verify your email address.</>,
                  <>
                    Pick a live workshop and share a few details: your name,
                    phone number, college, branch and year.
                  </>,
                  <>
                    Pay the workshop fee by UPI to the ID shown on the payment
                    step.
                  </>,
                  <>
                    Upload a screenshot of the payment, and the transaction ID if
                    you have it, so the payment can be matched to you.
                  </>,
                  <>
                    A team member verifies the payment by hand — this usually
                    takes a few hours.
                  </>,
                  <>
                    Once it is verified you receive a confirmation email with the
                    Google Meet link, and your seat is confirmed.
                  </>,
                ].map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 font-mono text-[11px] font-bold text-ink">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <DocumentNote>
                <p>
                  Seats are limited and shown on each workshop page. A
                  registration stays pending until the payment is verified. The
                  rules around refunds and cancellations live in the{" "}
                  <Link href="/refund-cancellation" className={linkClass}>
                    Refund &amp; cancellation policy
                  </Link>
                  .
                </p>
              </DocumentNote>
            </>
          ),
        },
        {
          id: "mission-and-vision",
          title: "Our mission and our vision",
          body: (
            <>
              <p>
                <DocumentStrong>Mission.</DocumentStrong> To help students stop
                guessing — by making the path from learning to building to
                getting hired clear, practical and honest.
              </p>
              <p>
                <DocumentStrong>Vision.</DocumentStrong> A generation of students
                who leave college with proof of work: real projects, a real
                profile, and the confidence to apply for the opportunities they
                actually want.
              </p>
            </>
          ),
        },
        {
          id: "what-we-will-not-promise",
          title: "What we will not promise",
          body: (
            <DocumentList
              items={[
                <>
                  We do not promise internships, placements, salaries or job
                  offers. We share what we know and what has worked; the work —
                  and the outcome — stays yours.
                </>,
                <>
                  We do not publish invented numbers or testimonials. If there is
                  ever something real to point at, it will be something you can
                  verify.
                </>,
                <>
                  We do not make refund or cancellation promises outside the{" "}
                  <Link href="/refund-cancellation" className={linkClass}>
                    Refund &amp; cancellation policy
                  </Link>
                  .
                </>,
                <>
                  We do not sell anything before it exists. A workshop or
                  resource that is not live yet is marked as coming soon and
                  cannot be purchased.
                </>,
              ]}
            />
          ),
        },
      ]}
    />
  );
}