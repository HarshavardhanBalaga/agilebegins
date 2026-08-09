import { redirect } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { LoginPanel } from "./LoginPanel";
import { getSessionUser } from "@/middlewares/auth";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

/**
 * /login — the session check is done on the server. Already signed in? Go
 * straight to `?next=` (admins only, to avoid bouncing a student between
 * /admin and /login). Otherwise render the form.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [user, query] = await Promise.all([getSessionUser(), searchParams]);
  const rawNext = query.next;
  const next =
    typeof rawNext === "string" &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//")
      ? rawNext
      : "/";

  if (user) {
    redirect(user.role === "admin" ? next : "/");
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-5.5rem)] items-center justify-center px-5 py-16 sm:px-8">
        <LoginPanel next={next} />
      </main>
    </>
  );
}
