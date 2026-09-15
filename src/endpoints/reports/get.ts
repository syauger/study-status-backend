import { OpenAPIRoute } from "chanfana";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import { report } from "@/db/app.schema";
import type { AppContext } from "../../lib/types";

export class ReportGet extends OpenAPIRoute {
  schema = {
    request: {
      params: z.object({
        reportId: z.number().describe("Report ID"),
      }),
    },
    responses: {
      "200": {
        content: {
          "application/json": {
            schema: z.object({
              report: z.object(report.$inferSelect).nullable(),
              success: z.boolean(),
            }),
          },
        },
        description: "Returns a list of reports",
      },
      "404": {
        description: "Report not found",
      },
    },
    summary: "Get a report",
    tags: ["Reports"],
  };

  async handle(c: AppContext) {
    const db = drizzle(c.env.DB);

    const data = await this.getValidatedData<typeof this.schema>();
    const { reportId } = data.params;

    const res = await db
      .select()
      .from(report)
      .where(eq(report.id, reportId))
      .limit(1)
      .catch(() => null);

    return {
      report: res?.[0] ?? null,
      success: res !== null,
    };
  }
}
