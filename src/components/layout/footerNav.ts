/**
 * The footer renders a real codebase, so the explorer doubles as the site
 * navigation: every entry below must map to a route that exists in
 * `src/app`. Never add a file here that does not have a page behind it.
 */
export interface FooterFile {
  /** Source-file style name shown in the explorer. */
  name: string;
  /** Route the file opens. */
  href: string;
  /** Friendly destination, used for the tooltip and the screen-reader label. */
  label: string;
  /** Extra path prefixes that also mark this file as the open one. */
  match?: string[];
}

export interface FooterFolder {
  name: string;
  files: FooterFile[];
}

export const FOOTER_TREE: FooterFolder[] = [
  {
    name: "pages",
    files: [
      { name: "home.tsx", href: "/", label: "Home" },
      { name: "about-us.tsx", href: "/about-us", label: "About Agile Begins" },
      { name: "contact-us.tsx", href: "/contact-us", label: "Contact us" },
    ],
  },
  {
    name: "resources",
    files: [
      {
        name: "workshops.tsx",
        href: "/workshop",
        label: "Explore workshops",
        match: ["/workshop", "/workshops"],
      },
      {
        name: "reserve-seat.tsx",
        href: "/register",
        label: "Reserve your seat",
      },
    ],
  },
  {
    name: "legal",
    files: [
      {
        name: "privacy-policy.tsx",
        href: "/privacy-policy",
        label: "Privacy policy",
      },
      {
        name: "terms-and-conditions.tsx",
        href: "/terms-and-conditions",
        label: "Terms & conditions",
      },
      {
        name: "refund-cancellation.tsx",
        href: "/refund-cancellation",
        label: "Refund & cancellation policy",
      },
    ],
  },
];

/**
 * The file open in the editor pane (rendered beside the tree) — a source file,
 * not a route, so it is shown with an "open" marker instead of a link.
 */
export const OPEN_FILE = {
  name: "mission.tsx",
  label: "Your next chapter starts with a step",
} as const;

/** Legal shortcuts kept in the status bar so they are always one tap away. */
export const LEGAL_LINKS = [
  { label: "Privacy", title: "Privacy policy", href: "/privacy-policy" },
  { label: "Terms", title: "Terms & conditions", href: "/terms-and-conditions" },
  {
    label: "Refunds",
    title: "Refund & cancellation policy",
    href: "/refund-cancellation",
  },
] as const;