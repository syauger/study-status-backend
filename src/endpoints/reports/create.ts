import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../../lib/types";
import { report } from "@/db/app.schema";
import { drizzle } from "drizzle-orm/d1";
import { inArray } from "drizzle-orm";

export class ReportCreate extends OpenAPIRoute {
  schema = {
    tags: ["Reports"],
    summary: "List Reports",
    request: {
      query: z.object({
        page: z.number().default(0).describe("Page number"),
        locationIds: z
          .array(z.number())
          .optional()
          .describe("Filter by location IDs"),
      }),
    },
    responses: {
      "200": {
        description: "Returns a list of reports",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              reports: z.object(report.$inferSelect).array(),
            }),
          },
        },
      },
    },
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
          : undefined,
      )
      .limit(10)
      .offset(page * 10)
      .catch(() => null);

    return {
      success: res !== null,
      reports: res ?? [],
    };
  }
}
