import {
  AdminDashboard,
  type AdminListResponse,
} from "@/components/admin/AdminDashboard";
import { registrationService } from "@/services/registrationService";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ workshop?: string }>;
}

/**
 * /admin/registrations — the full registrations manager: workshop tabs,
 * status filter, search, pagination, actions and the detail drawer.
 * Deep-linked with `?workshop=<id>` to pre-select a workshop.
 */
export default async function AdminRegistrationsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const workshopId = params.workshop ?? null;

  const [workshops, { items, total, counts }] = await Promise.all([
    registrationService.adminSummary(),
    registrationService.listForAdmin(1, PAGE_SIZE, {
      ...(workshopId ? { workshopId } : {}),
    }),
  ]);

  const initialData: AdminListResponse = {
    items,
    total,
    page: 1,
    pageSize: PAGE_SIZE,
    counts: {
      total,
      pending: counts.pending,
      verified: counts.verified,
      rejected: counts.rejected,
    },
  };

  return (
    <main className="mx-auto w-full max-w-[1280px] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white">
          Registrations
        </h1>
        <p className="mt-3 max-w-[560px] text-base leading-relaxed text-white/[0.78]">
          Verify payments, send confirmation emails and manage workshop
          registrations.
        </p>
      </div>

      <AdminDashboard
        initialData={initialData}
        initialWorkshops={workshops}
        initialWorkshopId={workshopId}
      />
    </main>
  );
}
