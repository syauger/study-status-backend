import { OpenAPIRoute } from "chanfana";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";

import { report } from "@/db/app.schema";
import { user } from "@/db/auth.schema";
import { reportResponseSchema } from "@/lib/report";
import type { AppContext } from "@/lib/types";

export class ReportGet extends OpenAPIRoute {
  schema = {
    request: { params: z.object({ reportId: z.number().int().positive() }) },
    responses: {
      "200": {
        description: "Returns a report",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(true),
              report: reportResponseSchema,
            }),
          },
        },
      },
      "400": { description: "Invalid report ID" },
      "404": { description: "Report not found" },
      "500": { description: "Unable to load report" },
    },
    summary: "Get a report",
    tags: ["Reports"],
  };

  async handle(c: AppContext) {
    const {
      params: { reportId },
    } = await this.getValidatedData<typeof this.schema>();
    const rows = await drizzle(c.env.DB)
      .select({
        id: report.id,
        locationId: report.locationId,
        crowdLevel: report.crowdLevel,
        comment: report.comment,
        createdAt: report.createdAt,
        authorName: user.name,
      })
      .from(report)
      .innerJoin(user, eq(report.createdBy, user.id))
      .where(eq(report.id, reportId))
      .limit(1)
      .catch(() => null);
    if (!rows) {
      return c.json({ success: false, error: "Unable to load report" }, 500);
    }
    if (!rows[0]) {
      return c.json({ success: false, error: "Report not found" }, 404);
    }
    return { success: true, report: rows[0] };
  }
}
