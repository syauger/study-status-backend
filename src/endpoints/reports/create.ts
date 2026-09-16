import { OpenAPIRoute } from "chanfana";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";

import { location, report } from "@/db/app.schema";
import { reportCreateSchema, reportResponseSchema } from "@/lib/report";
import type { AppContext } from "@/lib/types";

export class ReportCreate extends OpenAPIRoute {
  schema = {
    request: {
      body: { content: { "application/json": { schema: reportCreateSchema } } },
    },
    responses: {
      "201": {
        description: "Returns the created report",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(true),
              report: reportResponseSchema,
            }),
          },
        },
      },
      "400": { description: "Invalid report" },
      "401": { description: "Sign in to create a report" },
      "404": { description: "Location not found" },
      "500": { description: "Unable to create report" },
    },
    summary: "Create Report",
    tags: ["Reports"],
  };

  async handle(c: AppContext) {
    const { user } = c.var;
    if (!user) {
      return c.json(
        { success: false, error: "Sign in to create a report" },
        401
      );
    }
    const { body } = await this.getValidatedData<typeof this.schema>();
    const db = drizzle(c.env.DB);
    const locations = await db
      .select({ id: location.id })
      .from(location)
      .where(eq(location.id, body.locationId))
      .limit(1)
      .catch(() => null);
    if (!locations) {
      return c.json({ success: false, error: "Unable to load location" }, 500);
    }
    if (!locations[0]) {
      return c.json({ success: false, error: "Location not found" }, 404);
    }
    const rows = await db
      .insert(report)
      .values({
        locationId: body.locationId,
        crowdLevel: body.crowdLevel,
        comment: body.comment || null,
        createdBy: user.id,
      })
      .returning()
      .catch(() => null);
    const created = rows?.[0];
    if (!created) {
      return c.json({ success: false, error: "Unable to create report" }, 500);
    }
    return c.json(
      {
        success: true,
        report: {
          id: created.id,
          locationId: created.locationId,
          crowdLevel: created.crowdLevel,
          comment: created.comment,
          createdAt: created.createdAt,
          authorName: user.name,
        },
      },
      201
    );
  }
}
