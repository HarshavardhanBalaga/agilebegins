/**
 * Reusable brand tokens for the authenticated /app area.
 *
 * Centralizes the AgileBegins palette so colors stay consistent:
 * - Blue (#2F1BFF, `brand`) dominates interactive elements: primary
 *   buttons, active nav, links, focus rings, selected controls.
 * - Lime (#D6FF00, `accent`) is a restrained accent: notification dots,
 *   progress highlights, completion badges, small status markers.
 * - Surfaces stay light: white pages/cards, #F8F8FC subtle fills, light
 *   neutral borders, ink (#111111) headings/body text.
 *
 * `globals.css` already defines these as Tailwind v4 theme colors
 * (`bg-brand`, `text-brand`, `bg-accent`, `text-ink`, …), so these tokens
 * are plain class strings — no new dependencies, no CSS edits needed.
 */

export const APP_SURFACE_PAGE = "bg-[#F8F8FC]";
export const APP_SURFACE_HOVER = "hover:bg-[#F8F8FC]";

export const APP_PRIMARY_BUTTON =
  "rounded-lg bg-brand px-4 py-2.5 text-sm text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60";

export const APP_PRIMARY_BUTTON_INLINE =
  "inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm text-white transition-colors hover:bg-brand/90";

export const APP_SECONDARY_BUTTON =
  "rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-ink transition-colors hover:bg-accent hover:border-accent";

export const APP_LINK_BRAND = "font-medium text-brand underline";

export const APP_NAV_ACTIVE = "bg-brand text-white";
export const APP_NAV_INACTIVE =
  "text-neutral-600 hover:bg-[#F8F8FC] hover:text-brand";
export const APP_NAV_MOBILE_ACTIVE = "bg-brand text-white";
export const APP_NAV_MOBILE_INACTIVE = "text-neutral-700 hover:bg-[#F8F8FC]";

/** Lime unread dot: vivid accent with a white ring so it pops on white. */
export const APP_UNREAD_DOT =
  "absolute top-1.5 right-1.5 size-2 rounded-full bg-accent ring-2 ring-white";

/** Lime completion badge: dark ink text on lime for accessible contrast. */
export const APP_LIME_BADGE =
  "rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-ink";

/** Progress fill: brand blue bar on a light track. */
export const APP_PROGRESS_FILL =
  "h-full rounded-full bg-brand transition-all";
export const APP_PROGRESS_TRACK =
  "overflow-hidden rounded-full bg-neutral-200/70";

/** Selected interest chip: solid brand; unselected chips highlight brand on hover. */
export const APP_CHIP_SELECTED = "border-brand bg-brand text-white";
export const APP_CHIP_UNSELECTED =
  "border-neutral-300 bg-white text-neutral-700 hover:border-brand hover:text-brand";

/** Selected availability card + native radio tint. */
export const APP_OPTION_SELECTED =
  "border-brand bg-brand/5 text-ink";
export const APP_OPTION_UNSELECTED =
  "border-neutral-300 text-neutral-700 hover:border-brand";

export const APP_INPUT =
  "rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-brand/20";
