import { OpenAPIRoute } from "chanfana";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";

import { location } from "@/db/app.schema";
import { locationResponseSchema } from "@/lib/location";
import type { AppContext } from "@/lib/types";

export class LocationGet extends OpenAPIRoute {
  schema = {
    request: {
      params: z.object({ locationId: z.number().int().positive() }),
    },
    responses: {
      "200": {
        description: "Returns a location",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(true),
              location: locationResponseSchema,
            }),
          },
        },
      },
      "400": { description: "Invalid location ID" },
      "404": { description: "Location not found" },
      "500": { description: "Unable to load location" },
    },
    summary: "Get Location",
    tags: ["Locations"],
  };

  async handle(c: AppContext) {
    const {
      params: { locationId },
    } = await this.getValidatedData<typeof this.schema>();
    const db = drizzle(c.env.DB);
    const result = await db
      .select()
      .from(location)
      .where(eq(location.id, locationId))
      .limit(1)
      .catch(() => null);
    if (!result) {
      return c.json({ success: false, error: "Unable to load location" }, 500);
    }
    if (!result[0]) {
      return c.json({ success: false, error: "Location not found" }, 404);
    }
    return { success: true, location: result[0] };
  }
}
