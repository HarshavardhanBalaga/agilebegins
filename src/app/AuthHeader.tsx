import Image from "next/image";
import Link from "next/link";

export function AuthHeader() {
  return (
    <div className="mb-2 flex justify-center">
      <Link href="/" className="flex shrink-0 items-center" aria-label="AgileBegins home">
        <Image
          src="/logos/logo_exact_black_transparent_64px.png"
          alt="AgileBegins"
          width={36}
          height={36}
          priority
          className="h-auto w-9"
        />
        <span className="text-lg leading-none text-neutral-900">
          AgileBegins
        </span>
      </Link>
    </div>
  );
}
