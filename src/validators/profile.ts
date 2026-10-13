import { z } from "zod";

/**
 * Validation for the Companion Mode profile setup form.
 *
 * All fields are validated on the server — the client never decides what
 * "complete" means. Avatar is an optional remote image URL (no uploads in
 * this project, so there is no avatar pipeline to reuse).
 */

export const STUDY_AVAILABILITY_OPTIONS = [
  "weekday-mornings",
  "weekday-evenings",
  "weekends",
  "flexible",
] as const;

export type StudyAvailability = (typeof STUDY_AVAILABILITY_OPTIONS)[number];

export const STUDY_AVAILABILITY_LABELS: Record<StudyAvailability, string> = {
  "weekday-mornings": "Weekday mornings",
  "weekday-evenings": "Weekday evenings",
  weekends: "Weekends",
  flexible: "Flexible / varies",
};

export const LEARNING_INTEREST_OPTIONS = [
  "Web development",
  "Data science",
  "Design",
  "Marketing",
  "Business",
  "AI & ML",
  "Mobile apps",
  "Career skills",
] as const;

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, { error: "Display name must be at least 2 characters." })
    .max(80, { error: "Display name is too long." }),
  avatarUrl: z
    .string()
    .trim()
    .max(2048, { error: "Avatar URL is too long." })
    .optional()
    .refine(
      (value) => !value || /^https:\/\/.+/i.test(value),
      { error: "Avatar must be an https:// image URL, or left empty." }
    ),
  learningInterests: z
    .array(z.string().trim().min(2).max(40))
    .min(1, { error: "Pick at least one learning interest." })
    .max(6, { error: "Pick at most 6 learning interests." }),
  learningGoals: z
    .string()
    .trim()
    .min(10, { error: "Tell us a little more (at least 10 characters)." })
    .max(500, { error: "Learning goals must be under 500 characters." }),
  studyAvailability: z.enum(STUDY_AVAILABILITY_OPTIONS, {
    error: "Choose when you usually study.",
  }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
