import type { PublicUser } from "@/models/user";

interface AuthLinksProps {
  user: PublicUser | null | undefined;
  onLogout: () => void;
  variant: "desktop" | "mobile";
}

/**
 * Auth-aware navbar buttons. Home and workshop browsing stay public; login is
 * only surfaced here and when an action actually needs it. Shows "Log in" /
 * "Register" when signed out (both land on the adaptive auth flow, which
 * switches between login and registration in place), or the user's name +
 * "Log out" (plus a Dashboard link for admins) when signed in.
 */
export function AuthLinks({ user, onLogout, variant }: AuthLinksProps) {
  if (variant === "desktop") {
    if (user === undefined) {
      // Keep the row stable while the session is checked on the client.
      return <span className="hidden h-9 w-20 sm:inline-flex" aria-hidden="true" />;
    }

    if (user) {
      return (
        <div className="hidden items-center gap-3 md:flex">
          {user.role === "admin" ? (
            <a
              href="/admin"
              className="text-sm font-medium text-accent transition-colors hover:text-white"
            >
              Dashboard
            </a>
          ) : null}
          <span className="max-w-[120px] truncate text-sm text-muted">
            {user.name}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border cursor-pointer border-white/20 px-5 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      );
    }

    return (
      <div className="hidden items-center gap-3 md:flex">
        <a
          href="/login"
          className="text-sm font-medium text-muted transition-colors hover:text-white"
        >
          Log in
        </a>
        <a
          href="/register"
          className="rounded-full border border-white/20 px-6 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10"
        >
          Register
        </a>
      </div>
    );
  }

  // Mobile menu (stacked full-width items).
  if (user === undefined) {
    return null;
  }

  if (user) {
    return (
      <>
        <p className="border-b border-white/5 py-3 font-heading text-sm font-semibold uppercase tracking-[0.12em] text-muted">
          Signed in as {user.name}
        </p>
        {user.role === "admin" ? (
          <a
            href="/admin"
            className="mt-4 rounded-full border border-white/20 px-6 py-3 text-center font-heading text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Dashboard
          </a>
        ) : null}
        <button
          type="button"
          onClick={onLogout}
          className="mt-4 rounded-full border border-white/20 px-6 py-3 font-heading text-sm font-bold text-white transition-colors hover:bg-white/10"
        >
          Log out
        </button>
      </>
    );
  }

  return (
    <>
      <a
        href="/login"
        className="mt-4 rounded-full border border-white/20 px-6 py-3 text-center font-heading text-sm font-bold text-white transition-colors hover:bg-white/10"
      >
        Log in
      </a>
      <a
        href="/register"
        className="mt-4 rounded-full bg-accent px-6 py-3 text-center font-heading text-sm font-bold text-ink"
      >
        Register
      </a>
    </>
  );
}
