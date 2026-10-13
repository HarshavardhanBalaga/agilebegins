import { redirect } from "next/navigation";
import { getSessionUser } from "@/middlewares/auth";
import { isEmailVerified, toPublicUser } from "@/models/user";
import AppNavbar from "@/components/app/AppNavbar";
import { APP_SURFACE_PAGE } from "@/components/app/appTheme";

/**
 * Authenticated app shell for /app. Verifies the session server-side on
 * every render (proxy.ts is only an optimistic redirect), keeps the public
 * landing page untouched, and renders the dedicated app navbar.
 *
 * Profile/profile-setup/settings/progress routes stay reachable even when
 * onboarding is incomplete — the /app home page shows the prompt instead,
 * so there is never a redirect loop.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app");
  if (!isEmailVerified(user)) redirect("/check-inbox");

  const publicUser = toPublicUser(user);
  // Notifications are not implemented yet — expose `false` so the bell
  // renders without an unread dot until the feature lands.
  const hasUnreadNotifications = false;

  return (
    <div className={`min-h-screen ${APP_SURFACE_PAGE} font-[family-name:var(--font-cal-sans)]`}>
      <AppNavbar user={publicUser} hasUnreadNotifications={hasUnreadNotifications} />
      {children}
    </div>
  );
}
