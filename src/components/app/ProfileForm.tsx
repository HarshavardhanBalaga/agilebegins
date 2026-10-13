"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/clientFetch";
import {
  LEARNING_INTEREST_OPTIONS,
  STUDY_AVAILABILITY_LABELS,
  STUDY_AVAILABILITY_OPTIONS,
  type StudyAvailability,
} from "@/validators/profile";

export interface ProfileFormInitial {
  displayName: string;
  avatarUrl: string;
  learningInterests: string[];
  learningGoals: string;
  studyAvailability: StudyAvailability | null;
}

interface ApiErrorBody {
  error?: string;
  fields?: Record<string, string | undefined>;
}

function getErrorMessage(body: ApiErrorBody, fallback: string): string {
  if (body.error) return body.error;
  const first = body.fields ? Object.values(body.fields).find(Boolean) : undefined;
  return first ?? fallback;
}

import {
  APP_CHIP_SELECTED,
  APP_CHIP_UNSELECTED,
  APP_INPUT,
  APP_OPTION_SELECTED,
  APP_OPTION_UNSELECTED,
  APP_PRIMARY_BUTTON,
} from "@/components/app/appTheme";

/** Backwards-compatible alias for the shared brand input style. */
export const profileInputClass = APP_INPUT;

/**
 * Student-friendly profile setup form. Submits to PUT /api/profile; the
 * server validates everything and derives completion — the client only
 * renders loading / error / success states.
 *
 * - `mode="setup"`: first-time fill; heading says "Set up your profile",
 *   saving a complete profile lands on /app?welcome=profile-complete.
 * - `mode="edit"`: re-entry from Settings; heading says "Edit profile"
 *   and a "Back to profile" link returns without saving. `returnTo`
 *   decides where a successful save lands.
 */
export default function ProfileForm({
  initial,
  mode = "setup",
  returnTo,
}: {
  initial: ProfileFormInitial;
  mode?: "setup" | "edit";
  returnTo?: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [interests, setInterests] = useState<string[]>(initial.learningInterests);
  const [customInterest, setCustomInterest] = useState("");
  const [learningGoals, setLearningGoals] = useState(initial.learningGoals);
  const [availability, setAvailability] = useState<StudyAvailability | "">(
    initial.studyAvailability ?? ""
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value].slice(0, 6)
    );
  }

  function addCustomInterest() {
    const value = customInterest.trim();
    if (!value || interests.includes(value) || interests.length >= 6) return;
    setInterests((prev) => [...prev, value].slice(0, 6));
    setCustomInterest("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setPending(true);
    try {
      const res = await apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          avatarUrl: avatarUrl.trim() === "" ? undefined : avatarUrl.trim(),
          learningInterests: interests,
          learningGoals,
          studyAvailability: availability === "" ? undefined : availability,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody & {
        complete?: boolean;
      };
      if (!res.ok) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(body.fields ?? {}).filter(
              (entry): entry is [string, string] => typeof entry[1] === "string"
            )
          )
        );
        if (res.status === 401) {
          router.push("/login?next=/app/profile");
          return;
        }
        setFormError(getErrorMessage(body, "Could not save your profile."));
        return;
      }
      if (mode === "edit") {
        router.push(returnTo ?? "/app/profile");
      } else {
        router.push(body.complete ? "/app?welcome=profile-complete" : "/app");
      }
      router.refresh();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl text-neutral-900">{mode === "edit" ? "Edit profile" : "Set up your profile"}</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {mode === "edit"
              ? "Update your Companion Mode details. Your changes save here, not on the details page."
              : "This powers Companion Mode matching. You can edit it anytime from Settings."}
          </p>
        </div>
        {mode === "edit" ? (
          <Link href={returnTo ?? "/app/profile"} className="shrink-0 text-sm font-medium text-brand underline">
            Back to profile
          </Link>
        ) : null}
      </div>
      <div className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-display-name" className="text-sm text-neutral-900">Display name</label>
          <input id="profile-display-name" type="text" autoComplete="nickname" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="What should companions call you?" className={profileInputClass} />
          {fieldErrors.displayName ? <p className="text-sm text-red-600">{fieldErrors.displayName}</p> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-avatar" className="text-sm text-neutral-900">Profile photo URL <span className="text-neutral-400">(optional)</span></label>
          <input id="profile-avatar" type="url" inputMode="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" className={profileInputClass} />
          {fieldErrors.avatarUrl ? <p className="text-sm text-red-600">{fieldErrors.avatarUrl}</p> : null}
        </div>
        <fieldset>
          <legend className="text-sm text-neutral-900">Learning interests <span className="text-neutral-400">({interests.length}/6)</span></legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {LEARNING_INTEREST_OPTIONS.map((option) => {
              const selected = interests.includes(option);
              return (
                <button key={option} type="button" onClick={() => toggleInterest(option)} aria-pressed={selected} className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${selected ? APP_CHIP_SELECTED : APP_CHIP_UNSELECTED}`}>
                  {option}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 flex gap-2">
            <input type="text" value={customInterest} onChange={(e) => setCustomInterest(e.target.value)} placeholder="Add your own…" maxLength={40} aria-label="Add a custom interest" className={`${profileInputClass} flex-1`} />
            <button type="button" onClick={addCustomInterest} className={`shrink-0 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 transition-colors hover:border-brand hover:text-brand`}>
              Add
            </button>
          </div>
          {fieldErrors.learningInterests ? <p className="mt-1.5 text-sm text-red-600">{fieldErrors.learningInterests}</p> : null}
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-goals" className="text-sm text-neutral-900">Current learning goals</label>
          <textarea id="profile-goals" rows={4} value={learningGoals} onChange={(e) => setLearningGoals(e.target.value)} placeholder="e.g. Build my first portfolio site and get comfortable with JavaScript in 3 months." maxLength={500} className={`${profileInputClass} resize-y`} />
          {fieldErrors.learningGoals ? <p className="text-sm text-red-600">{fieldErrors.learningGoals}</p> : null}
        </div>
        <fieldset>
          <legend className="text-sm text-neutral-900">Preferred study availability</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {STUDY_AVAILABILITY_OPTIONS.map((option) => (
              <label key={option} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${availability === option ? APP_OPTION_SELECTED : APP_OPTION_UNSELECTED}`}>
                <input type="radio" name="study-availability" value={option} checked={availability === option} onChange={() => setAvailability(option)} className="accent-brand" />
                {STUDY_AVAILABILITY_LABELS[option]}
              </label>
            ))}
          </div>
          {fieldErrors.studyAvailability ? <p className="mt-1.5 text-sm text-red-600">{fieldErrors.studyAvailability}</p> : null}
        </fieldset>
        {formError ? <p role="alert" className="text-sm text-red-600">{formError}</p> : null}
        <button type="submit" disabled={pending} className={APP_PRIMARY_BUTTON}>
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
