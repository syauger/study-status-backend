import { OpenAPIRoute } from "chanfana";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";

import { report } from "@/db/app.schema";

import type { AppContext } from "../../lib/types";

export class ReportCreate extends OpenAPIRoute {
  schema = {
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              comment: z.string().optional(),
              crowdLevel: z.enum(["empty", "moderate", "busy"]),
              locationId: z.number().int().positive(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        content: {
          "application/json": {
            schema: z.object({
              report: z.object(report.$inferSelect).array(),
              success: z.boolean(),
            }),
          },
        },
        description: "Returns the created report",
      },
    },
    summary: "List Reports",
    tags: ["Reports"],
  };

  async handle(c: AppContext) {
    const db = drizzle(c.env.DB);

    const { body } = await this.getValidatedData<typeof this.schema>();
    // oxlint-disable-next-line typescript/no-non-null-assertion
    const user = c.var.user!;

    const res = await db
      .insert(report)
      .values({
        comment: body.comment ?? null,
        createdBy: user.id,
        crowdLevel: body.crowdLevel,
        locationId: body.locationId,
      })
      .returning()
      .then((r) => r[0])
      .catch(() => null);

    return {
      report: res,
      success: res !== null,
    };
  }
}
