/**
 * Lightweight input sanitation helpers. All user input is first validated
 * with Zod, then passed through these before touching the database or being
 * rendered back to other users.
 */

/** Collapse whitespace and remove surrounding whitespace. */
export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Remove any HTML/script tags entirely from a string. */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

/**
 * Escapes regex metacharacters so user input can be safely embedded in a
 * case-insensitive search expression.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Guard against CSV formula injection. Cells beginning with one of these
 * characters are prefixed with a single quote so spreadsheet software treats
 * them as text, not formulas.
 */
export function csvCell(value: string): string {
  const normalized = normalizeText(value);
  if (/^[=+\-@]/.test(normalized)) {
    return `'${normalized}`;
  }
  return normalized;
}