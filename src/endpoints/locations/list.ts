import { OpenAPIRoute } from "chanfana";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";

import { location } from "@/db/app.schema";

import type { AppContext } from "../../lib/types";

export class LocationList extends OpenAPIRoute {
  schema = {
    request: {
      query: z.object({
        page: z.number().default(0).describe("Page number"),
      }),
    },
    responses: {
      "200": {
        content: {
          "application/json": {
            schema: z.object({
              locations: z.object(location.$inferSelect).array(),
              success: z.boolean(),
            }),
          },
        },
        description: "Returns a list of locations",
      },
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
      .limit(10)
      .offset(page * 10)
      .catch(() => null);

    return {
      locations: res ?? [],
      success: res !== null,
    };
  }
}
