import type { NextRequest } from "next/server";
import { run, ok } from "@/lib/http";
import { requireAdmin } from "@/middlewares/auth";
import { registrationService } from "@/services/registrationService";
import { csvCell } from "@/lib/sanitize";
import { toCsv } from "@/utils/csv";
import { PAYMENT_STATUS, type PaymentStatus } from "@/lib/constants";
import { isObjectId } from "@/utils/ids";
import type { RegistrationFilters } from "@/models/registration";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<string>(Object.values(PAYMENT_STATUS));

/** Parses workshopId / status / search query params into service filters. */
function parseFilters(searchParams: URLSearchParams): RegistrationFilters {
  const workshopId = searchParams.get("workshopId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  return {
    ...(workshopId && isObjectId(workshopId) ? { workshopId } : {}),
    ...(status && VALID_STATUSES.has(status)
      ? { status: status as PaymentStatus }
      : {}),
    ...(search ? { search } : {}),
  };
}

/**
 * GET /api/admin/registrations
 *
 * Admin-only. Returns the registration table plus dashboard counts:
 *   { items, total, page, pageSize, counts: { total, pending, verified, rejected } }
 *
 * Filters:
 *   ?workshopId=<objectId>   — restrict to one workshop
 *   ?status=pending|verified|rejected
 *   ?search=<term>           — matches name/email/phone/college/branch/year/txn
 *
 * `?format=csv` streams the filtered export as an attachment download.
 */
export async function GET(request: NextRequest) {
  return run(async () => {
    await requireAdmin(request);

    const { searchParams } = request.nextUrl;
    const filters = parseFilters(searchParams);
    const format = searchParams.get("format");

    if (format === "csv") {
      const rows = await registrationService.exportAll(filters);
      const csv = toCsv(
        [
          "Student Name",
          "Email",
          "Phone",
          "College",
          "Branch",
          "Year",
          "Workshop",
          "Transaction ID",
          "Status",
          "Email Verified",
          "Attendance",
          "Created At",
        ],
        rows.map((r) => [
          csvCell(r.name),
          csvCell(r.email),
          csvCell(r.phone),
          csvCell(r.college),
          csvCell(r.branch),
          csvCell(r.year),
          csvCell(r.workshopTitle),
          csvCell(r.transactionId),
          csvCell(r.paymentStatus),
          r.emailVerified ? "Yes" : "No",
          r.attendance ? "Yes" : "No",
          csvCell(r.createdAt),
        ])
      );

      const filename = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || 25)
    );

    const { items, total, counts } = await registrationService.listForAdmin(
      page,
      pageSize,
      filters
    );

    return ok({
      items,
      total,
      page,
      pageSize,
      counts: {
        total,
        pending: counts.pending,
        verified: counts.verified,
        rejected: counts.rejected,
      },
    });
  });
}
