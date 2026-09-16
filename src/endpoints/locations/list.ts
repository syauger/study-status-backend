import { OpenAPIRoute } from "chanfana";
import { asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";

import { location } from "@/db/app.schema";
import { locationResponseSchema } from "@/lib/location";

import type { AppContext } from "../../lib/types";

export class LocationList extends OpenAPIRoute {
  schema = {
    request: {
      query: z.object({
        page: z
          .number()
          .int()
          .min(0)
          .max(1_000_000)
          .default(0)
          .describe("Page number"),
      }),
    },
    responses: {
      "200": {
        content: {
          "application/json": {
            schema: z.object({
              locations: z.array(locationResponseSchema),
              nextPage: z.number().int().nullable(),
              success: z.boolean(),
            }),
          },
        },
        description: "Returns a list of locations",
      },
      "400": { description: "Invalid page number" },
      "500": { description: "Unable to load locations" },
    },
    summary: "List Locations",
    tags: ["Locations"],
  };

  async handle(c: AppContext) {
    const db = drizzle(c.env.DB);

    const data = await this.getValidatedData<typeof this.schema>();
    const { page } = data.query;

    const res = await db
      .select()
      .from(location)
      .orderBy(asc(location.id))
      .limit(11)
      .offset(page * 10)
      .catch(() => null);

    if (!res) {
      return c.json({ success: false, error: "Unable to load locations" }, 500);
    }
    return {
      locations: res.slice(0, 10),
      nextPage: res.length > 10 ? page + 1 : null,
      success: true,
    };
  }
}
