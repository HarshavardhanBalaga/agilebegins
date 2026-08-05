import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-ink transition-transform duration-300 group-hover:-translate-y-0.5">
        <svg
          width="18"
          height="18"
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
      <span className="font-heading text-[15px] font-extrabold uppercase tracking-[0.2em] text-white">
        Agile Begins
      </span>
    </Link>
  );
}