import type { NextRequest } from "next/server";
import { run, ok } from "@/lib/http";
import { requireAdmin } from "@/middlewares/auth";
import { registrationService } from "@/services/registrationService";
import { csvCell } from "@/lib/sanitize";
import { toCsv } from "@/utils/csv";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/registrations
 *
 * Admin-only. Returns the registration table plus dashboard counts:
 *   { items, total, page, pageSize, counts: { total, pending, verified, rejected } }
 *
 * `?format=csv` streams the full export as an attachment download.
 */
export async function GET(request: NextRequest) {
  return run(async () => {
    await requireAdmin(request);

    const { searchParams } = request.nextUrl;
    const format = searchParams.get("format");

    if (format === "csv") {
      const rows = await registrationService.exportAll();
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
      pageSize
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