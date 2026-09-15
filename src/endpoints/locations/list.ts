import { OpenAPIRoute } from "chanfana";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import { report } from "@/db/app.schema";
import type { AppContext } from "../../lib/types";

export class ReportList extends OpenAPIRoute {
  schema = {
    request: {
      query: z.object({
        locationIds: z
          .array(z.number())
          .optional()
          .describe("Filter by location IDs"),
        page: z.number().default(0).describe("Page number"),
      }),
    },
    responses: {
      "200": {
        content: {
          "application/json": {
            schema: z.object({
              reports: z.object(report.$inferSelect).array(),
              success: z.boolean(),
            }),
          },
        },
        description: "Returns a list of reports",
      },
    },
    summary: "List Reports",
    tags: ["Reports"],
  };

  async handle(c: AppContext) {
    const db = drizzle(c.env.DB);

    const data = await this.getValidatedData<typeof this.schema>();
    const { page, locationIds } = data.query;

    const res = await db
      .select()
      .from(report)
      .where(
        locationIds?.length
          ? inArray(report.locationId, locationIds)
          : undefined
      )
      .limit(10)
      .offset(page * 10)
      .catch(() => null);

    return {
      reports: res ?? [],
      success: res !== null,
    };
  }
}
