"use client";

import type { RegistrationDetail } from "@/models/registration";
import {
  UserRound,
  CreditCard,
  Mail,
  CalendarCheck,
  X,
  Clock,
  type LucideIcon,
} from "lucide-react";

type StepState = "done" | "current" | "upcoming" | "failed" | "skipped";

interface TimelineStep {
  icon: LucideIcon;
  title: string;
  detail: string;
  state: StepState;
}

const stateStyles: Record<StepState, string> = {
  done: "bg-accent text-ink",
  current: "bg-ink text-accent ring-2 ring-accent",
  upcoming: "bg-white/10 text-white/40",
  failed: "bg-red-500 text-white",
  skipped: "bg-white/10 text-white/30",
};

const labelStyles: Record<StepState, string> = {
  done: "text-white",
  current: "text-white",
  upcoming: "text-white/40",
  failed: "text-red-200",
  skipped: "text-white/30",
};

const detailStyles: Record<StepState, string> = {
  done: "text-white/60",
  current: "text-accent",
  upcoming: "text-white/40",
  failed: "text-red-200/80",
  skipped: "text-white/30",
};

/**
 * Registration lifecycle stepper: Registered → Payment Verified/Rejected →
 * Confirmation Email Sent → Attended. Derived entirely from the registration
 * document, so it always reflects the latest admin action.
 */
export function StatusTimeline({ detail }: { detail: RegistrationDetail }) {
  const steps = buildSteps(detail);

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isLast = index === steps.length - 1;
        return (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden
                className={`absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-px ${
                  step.state === "done" ? "bg-accent/50" : "bg-white/10"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ${stateStyles[step.state]}`}
            >
              <Icon
                className="h-4 w-4"
                aria-hidden
                strokeWidth={step.state === "current" ? 2.5 : 2}
              />
            </span>
            <div className="min-w-0 pt-1">
              <p
                className={`font-heading text-sm font-bold ${labelStyles[step.state]}`}
              >
                {step.title}
              </p>
              <p className={`mt-0.5 text-xs ${detailStyles[step.state]}`}>
                {step.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function buildSteps(detail: RegistrationDetail): TimelineStep[] {
  const { paymentStatus, createdAt, confirmationMailSent, meetingLinkSent } =
    detail;

  const registered = formatDate(createdAt);
  const rejected = paymentStatus === "rejected";

  const payment: TimelineStep =
    paymentStatus === "verified"
      ? {
          icon: CreditCard,
          title: "Payment verified",
          detail: "Registration confirmed",
          state: "done",
        }
      : paymentStatus === "rejected"
        ? {
            icon: X,
            title: "Payment rejected",
            detail: "Contact the student to re-check their transaction",
            state: "failed",
          }
        : {
            icon: Clock,
            title: "Payment pending verification",
            detail: "Awaiting review of the UPI screenshot",
            state: "current",
          };

  const email: TimelineStep =
    rejected || paymentStatus === "pending"
      ? {
          icon: Mail,
          title: "Confirmation email",
          detail: rejected
            ? "Skipped — payment was rejected"
            : "Sent once payment is verified",
          state: rejected ? "skipped" : "upcoming",
        }
      : confirmationMailSent
        ? {
            icon: Mail,
            title: "Confirmation email sent",
            detail: meetingLinkSent
              ? "Includes the meeting link"
              : "Sent",
            state: "done",
          }
        : {
            icon: Mail,
            title: "Confirmation email",
            detail: "Not sent yet — use “Send Email”",
            state: "current",
          };

  const attendance: TimelineStep =
    rejected || paymentStatus === "pending"
      ? {
          icon: CalendarCheck,
          title: "Attendance",
          detail: rejected ? "Skipped" : "Marked after the session",
          state: rejected ? "skipped" : "upcoming",
        }
      : detail.attendance
        ? {
            icon: CalendarCheck,
            title: "Attended",
            detail: "Marked present",
            state: "done",
          }
        : {
            icon: CalendarCheck,
            title: "Attendance",
            detail: "Not yet marked",
            state: "upcoming",
          };

  return [
    {
      icon: UserRound,
      title: "Registered",
      detail: registered,
      state: "done",
    },
    payment,
    email,
    attendance,
  ];
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
