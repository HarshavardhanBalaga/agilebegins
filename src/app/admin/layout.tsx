import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSessionUser } from "@/middlewares/auth";
import { toPublicUser } from "@/models/user";

export const dynamic = "force-dynamic";

/**
 * /admin/* — every admin page renders inside the sidebar shell. Access is
 * enforced here on the server (and again in each API route): non-admins are
 * sent to the login page.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    redirect("/login?next=/admin");
  }

  return <AdminShell user={toPublicUser(user)}>{children}</AdminShell>;
}
