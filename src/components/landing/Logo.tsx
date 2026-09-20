import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3"
      aria-label="Agile Begins — home"
    >
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:bg-white/15">
        <Image
          src="/logos/logo_exact_black_transparent_64px.png"
          alt=""
          width={28}
          height={28}
          className="drop-shadow-sm"
          priority
        />
      </div>
      <span className="font-heading text-[15px] font-extrabold uppercase tracking-[0.2em] text-white">
        Agile Begins
      </span>
    </Link>
  );
}
