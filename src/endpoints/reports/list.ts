import { OpenAPIRoute } from "chanfana";
import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";

import { report } from "@/db/app.schema";
import { user } from "@/db/auth.schema";
import { reportResponseSchema } from "@/lib/report";
import type { AppContext } from "@/lib/types";

export class ReportList extends OpenAPIRoute {
  schema = {
    request: {
      query: z.object({
        locationId: z.number().int().positive().optional(),
        locationIds: z.array(z.number().int().positive()).max(100).optional(),
        before: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Fetch reports older than this report ID"),
        page: z.number().int().min(0).max(1_000_000).default(0),
      }),
    },
    responses: {
      "200": {
        description: "Reports, newest first, with a cursor for older reports",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(true),
              reports: z.array(reportResponseSchema),
              nextCursor: z.number().int().nullable(),
            }),
          },
        },
      },
      "400": { description: "Invalid pagination or location filter" },
      "500": { description: "Unable to load reports" },
    },
    summary: "List Reports",
    tags: ["Reports"],
  };

  async handle(c: AppContext) {
    const {
      query: { locationId, locationIds, before, page },
    } = await this.getValidatedData<typeof this.schema>();
    const db = drizzle(c.env.DB);
    const rows = await db
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
      .where(
        and(
          locationId ? eq(report.locationId, locationId) : undefined,
          locationIds?.length
            ? inArray(report.locationId, locationIds)
            : undefined,
          before ? lt(report.id, before) : undefined
        )
      )
      .orderBy(desc(report.id))
      .limit(11)
      .offset(before ? 0 : page * 10)
      .catch(() => null);
    if (!rows) {
      return c.json({ success: false, error: "Unable to load reports" }, 500);
    }
    const reports = rows.slice(0, 10);
    return {
      success: true,
      reports,
      nextCursor: rows.length > 10 ? (reports.at(-1)?.id ?? null) : null,
    };
  }
}
