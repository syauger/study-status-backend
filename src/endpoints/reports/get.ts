import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../../lib/types";
import { report } from "@/db/app.schema";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";

export class ReportGet extends OpenAPIRoute {
  schema = {
    tags: ["Reports"],
    summary: "Get a report",
    request: {
      params: z.object({
        reportId: z.number().describe("Report ID"),
      }),
    },
    responses: {
      "200": {
        description: "Returns a list of reports",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              report: z.object(report.$inferSelect).nullable(),
            }),
          },
        },
      },
      "404": {
        description: "Report not found",
      },
    },
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
      success: res !== null,
      report: res?.[0] ?? null,
    };
  }
}
