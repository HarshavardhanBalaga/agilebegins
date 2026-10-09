"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  FileCode,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  Mail,
  MessageCircle,
  SquareTerminal,
} from "lucide-react";

import {
  FOOTER_TREE,
  LEGAL_LINKS,
  OPEN_FILE,
  type FooterFile,
  type FooterFolder,
} from "./footerNav";

interface FooterIdeProps {
  /** Verified support address from the environment. */
  supportEmail: string;
  /** WhatsApp community invite; the link is hidden when not configured. */
  whatsappUrl?: string;
}

/* -------------------------------------------------------------------------- */
/* Editor content                                                             */
/* -------------------------------------------------------------------------- */

type CodeTone = "comment" | "keyword" | "string" | "plain" | "punct" | "key";

const CODE_TONES: Record<CodeTone, string> = {
  comment: "text-white/30 italic",
  keyword: "text-code",
  string: "text-white/70",
  plain: "text-white/85",
  punct: "text-white/40",
  key: "text-white",
};

interface CodeToken {
  text: string;
  tone: CodeTone;
}

interface CodeLine {
  tokens: CodeToken[];
  /** The line the caret sits on — highlighted with a lime gutter bar. */
  active?: boolean;
}

const CODE: CodeLine[] = [
  { tokens: [{ text: "/**", tone: "comment" }] },
  { tokens: [{ text: " * agilebegins / student-hub", tone: "comment" }] },
  {
    tokens: [{ text: " * For students who are done guessing.", tone: "comment" }],
  },
  { tokens: [{ text: " */", tone: "comment" }] },
  { tokens: [] },
  {
    tokens: [
      { text: "const", tone: "keyword" },
      { text: " mission = {", tone: "punct" },
    ],
  },
  {
    tokens: [
      { text: "  learn", tone: "key" },
      { text: ": ", tone: "punct" },
      { text: '"with purpose"', tone: "string" },
      { text: ",", tone: "punct" },
    ],
  },
  {
    tokens: [
      { text: "  build", tone: "key" },
      { text: ": ", tone: "punct" },
      { text: '"with confidence"', tone: "string" },
      { text: ",", tone: "punct" },
    ],
  },
  {
    tokens: [
      { text: "  grow", tone: "key" },
      { text: ": ", tone: "punct" },
      { text: '"at your own pace"', tone: "string" },
      { text: ",", tone: "punct" },
    ],
  },
  { tokens: [{ text: "};", tone: "punct" }] },
  { tokens: [] },
  {
    tokens: [
      { text: "export default function", tone: "keyword" },
      { text: " StudentHub() {", tone: "plain" },
    ],
  },
  {
    active: true,
    tokens: [
      { text: "  return ", tone: "keyword" },
      { text: "<Path ", tone: "plain" },
      { text: "from", tone: "key" },
      { text: "=", tone: "punct" },
      { text: '"confused"', tone: "string" },
      { text: " ", tone: "plain" },
      { text: "to", tone: "key" },
      { text: "=", tone: "punct" },
      { text: '"clear"', tone: "string" },
      { text: " />;", tone: "punct" },
    ],
  },
  { tokens: [{ text: "}", tone: "punct" }] },
];

/** True when the browser is currently on (or inside) the file's route. */
function isOpenFile(file: FooterFile, pathname: string): boolean {
  const prefixes = file.match ?? [file.href];
  return prefixes.some((prefix) =>
    prefix === "/"
      ? pathname === "/"
      : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/* -------------------------------------------------------------------------- */
/* Explorer                                                                   */
/* -------------------------------------------------------------------------- */

function ExplorerFile({ file, active }: { file: FooterFile; active: boolean }) {
  return (
    <Link
      href={file.href}
      title={file.label}
      aria-label={`${file.label} (${file.name})`}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-2 rounded-md py-1.5 pl-3 pr-2 font-mono text-[12px] transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70 focus-visible:outline-none lg:text-[12.5px] ${
        active
          ? "bg-white/[0.07] text-accent"
          : "text-white/65 hover:bg-white/[0.05] hover:text-white active:bg-white/[0.08]"
      }`}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full bg-accent"
        />
      ) : null}
      <FileCode
        className={`h-3.5 w-3.5 shrink-0 ${
          active ? "text-accent" : "text-white/35"
        }`}
        aria-hidden="true"
      />
      <span className="min-w-0 truncate">{file.name}</span>
      {active ? (
        <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-accent/80">
          open
        </span>
      ) : null}
    </Link>
  );
}

function ExplorerFolder({
  folder,
  pathname,
}: {
  folder: FooterFolder;
  pathname: string;
}) {
  // Folders start open so every link stays discoverable on touch devices.
  const [open, setOpen] = useState(true);
  const listId = `footer-explorer-${folder.name}`;
  const holdsOpenFile = folder.files.some((file) => isOpenFile(file, pathname));

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 font-mono text-[11.5px] text-white/55 transition-colors duration-200 hover:bg-white/[0.05] hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70 focus-visible:outline-none lg:text-[12px]"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
            open ? "rotate-90" : ""
          }`}
          aria-hidden="true"
        />
        {open ? (
          <FolderOpen
            className="h-3.5 w-3.5 shrink-0 text-white/45"
            aria-hidden="true"
          />
        ) : (
          <Folder
            className="h-3.5 w-3.5 shrink-0 text-white/45"
            aria-hidden="true"
          />
        )}
        <span className="truncate">{folder.name}</span>
        <span
          className={`ml-auto shrink-0 font-mono text-[10px] ${
            holdsOpenFile ? "text-accent" : "text-white/25"
          }`}
        >
          {folder.files.length}
        </span>
      </button>

      <div
        id={listId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <ul
          className={`min-h-0 overflow-hidden pl-3 ${
            open ? "visible" : "invisible"
          }`}
        >
          {folder.files.map((file) => (
            <li key={file.href}>
              <ExplorerFile file={file} active={isOpenFile(file, pathname)} />
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

function Explorer({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Footer navigation"
      className="border-b border-white/[0.08] bg-black/25 px-4 py-5 sm:px-6 md:border-b-0 md:border-r md:px-4 lg:px-6 xl:px-10"
    >
      <p className="flex items-center gap-2 px-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
        <SquareTerminal className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        Explorer
      </p>

      <p className="mt-4 flex items-center gap-1.5 px-1.5 font-mono text-[11px] text-white/35">
        <Folder className="h-3.5 w-3.5" aria-hidden="true" />
        agilebegins
      </p>

      <ul className="mt-1 space-y-0.5">
        {FOOTER_TREE.map((folder) => (
          <ExplorerFolder key={folder.name} folder={folder} pathname={pathname} />
        ))}

        {/* The file open in the editor beside the tree — not a navigation link. */}
        <li>
          <div className="relative mt-1 flex items-center gap-2 rounded-md bg-accent/[0.08] py-1.5 pl-3 pr-2 font-mono text-[12px] text-accent lg:text-[12.5px]">
            <span
              aria-hidden="true"
              className="absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full bg-accent"
            />
            <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">
              {OPEN_FILE.name}
              <span className="sr-only">
                {" "}
                — {OPEN_FILE.label}, open in the editor
              </span>
            </span>
            <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.14em]">
              open
            </span>
          </div>
        </li>
      </ul>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Editor                                                                     */
/* -------------------------------------------------------------------------- */

function Editor() {
  return (
    <div className="min-w-0">
      {/* Tab strip */}
      <div className="flex items-center gap-3 border-b border-white/[0.08] bg-white/[0.02] px-4 py-2 sm:px-6 lg:px-8 xl:px-10">
        <span className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-surface-code px-2.5 py-1 font-mono text-[11px] text-white">
          <FileText className="h-3 w-3 text-accent" aria-hidden="true" />
          {OPEN_FILE.name}
        </span>
        <span className="hidden font-mono text-[10px] text-white/30 sm:block">
          Ln 13, Col 25
        </span>
        <span className="ml-auto hidden font-mono text-[10px] text-white/25 lg:block">
          TSX · UTF-8
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Source */}
        <div className="overflow-x-auto px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <div className="min-w-max font-mono text-[11.5px] leading-6 sm:text-[12.5px]">
            {CODE.map((line, index) => (
              <div
                key={index}
                className={`relative flex ${line.active ? "bg-white/[0.05]" : ""}`}
              >
                {line.active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-[2px] bg-accent"
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className="w-7 shrink-0 select-none pr-3 text-right text-white/20 sm:w-9"
                >
                  {index + 1}
                </span>
                <span className="whitespace-pre">
                  {line.tokens.map((token, tokenIndex) => (
                    <span key={tokenIndex} className={CODE_TONES[token.tone]}>
                      {token.text}
                    </span>
                  ))}
                  {line.active ? (
                    <span
                      aria-hidden="true"
                      className="caret-blink ml-0.5 inline-block h-3.5 w-1.5 translate-y-[3px] animate-[agile-caret_1.15s_ease-in-out_infinite] bg-accent motion-reduce:animate-none"
                    />
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rendered closing message */}
        <div className="border-t border-white/[0.08] px-4 py-6 sm:px-6 lg:flex lg:flex-col lg:justify-center lg:border-t-0 lg:border-l lg:px-8 xl:px-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
            Rendered preview
          </p>

          <p className="mt-5 font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-bold leading-[1.06] tracking-[-0.02em] text-white">
            Your next chapter
            <br />
            starts with a step<span className="text-accent">.</span>
          </p>

          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Less guessing. More doing. Keep building your future.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/workshop"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-heading text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore workshops
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 font-heading text-sm font-bold text-white transition-colors duration-300 hover:border-white/40 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Reserve your seat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

const statusLink =
  "inline-flex items-center gap-1.5 rounded-sm transition-colors duration-200 hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70 focus-visible:outline-none";

/**
 * Repository header — the full-bleed toolbar that opens the footer: branding,
 * the repository path and the branch. It is the top edge of the IDE, so it
 * spans the viewport while its content keeps the page's padding rhythm.
 */
function RepositoryHeader() {
  return (
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/[0.08] bg-white/[0.02] px-4 py-3 sm:px-6 lg:px-8 xl:px-12">
      <span aria-hidden="true" className="hidden items-center gap-1.5 sm:flex">
        <span className="h-2.5 w-2.5 rounded-full bg-white/[0.14]" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/[0.14]" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
      </span>

      <Link
        href="/"
        className="flex items-center gap-2 rounded transition-opacity duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70 focus-visible:outline-none"
      >
        <span className="grid h-6 w-6 place-items-center rounded bg-accent text-ink">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </span>
        <span className="font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-white">
          Agile Begins
        </span>
      </Link>

      <span aria-hidden="true" className="hidden h-4 w-px bg-white/15 sm:block" />

      <span className="flex items-center gap-1.5 font-mono text-[11px]">
        <span className="text-white">agilebegins</span>
        <span className="text-white/35">/</span>
        <span className="text-accent">student-hub</span>
      </span>

      <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] text-white/70">
        <GitBranch className="h-3 w-3 text-white/60" aria-hidden="true" />
        main
      </span>

      <span className="ml-auto hidden font-mono text-[10px] text-white/25 lg:block">
        UTF-8 · TypeScript React
      </span>
    </div>
  );
}


/**
 * Status bar — the final boundary of the website. Branch indicator, brand line,
 * copyright, legal shortcuts and the student support/community links, split into
 * two wrapping rows on mobile so nothing hides behind a hover.
 */
function StatusBar({ supportEmail, whatsappUrl }: FooterIdeProps) {
  const year = new Date().getFullYear();

  return (
    <div className="flex w-full flex-col gap-2.5 border-t border-white/[0.08] bg-black/35 px-4 py-3 font-mono text-[10.5px] text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 xl:px-12">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="flex items-center gap-1.5 text-white/60">
          <GitBranch className="h-3 w-3 text-accent" aria-hidden="true" />
          main
        </span>
        <span
          aria-hidden="true"
          className="hidden h-3 w-px bg-white/10 sm:block"
        />
        <span>Built for students — learn, build, grow.</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span>© {year} Agile Begins</span>

        <span aria-hidden="true" className="hidden h-3 w-px bg-white/10 sm:block" />

        {LEGAL_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            title={link.title}
            className={statusLink}
          >
            {link.label}
          </Link>
        ))}

        <a
          href={`mailto:${supportEmail}`}
          title={`Email ${supportEmail}`}
          className={statusLink}
        >
          <Mail className="h-3 w-3" aria-hidden="true" />
          Support
        </a>

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Join the Agile Begins WhatsApp community"
            className={statusLink}
          >
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            Community
          </a>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The Agile Begins footer: a source repository opened in an editor. It is a
 * full-bleed element — the explorer, editor and status bar all span the
 * viewport — so the website ends inside its own codebase instead of inside a
 * floating card. The file explorer is the site navigation and the editor pane
 * carries the closing student message and the two CTAs.
 */
export function FooterIde({ supportEmail, whatsappUrl }: FooterIdeProps) {
  const pathname = usePathname();

  return (
    <footer
      aria-label="Site footer"
      className="relative mt-auto w-full border-t-2 border-accent bg-surface-code"
    >
      <RepositoryHeader />

      {/* Explorer + editor */}
      <div className="grid w-full md:grid-cols-[264px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
        <Explorer pathname={pathname} />
        <Editor />
      </div>

      <StatusBar supportEmail={supportEmail} whatsappUrl={whatsappUrl} />
    </footer>
  );
}