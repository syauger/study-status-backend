import { OpenAPIRoute } from "chanfana";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";

import { location } from "@/db/app.schema";
import type { AppContext } from "@/lib/types";

const currentWeatherSchema = z.object({
  temperature_2m: z.number(),
  apparent_temperature: z.number(),
  weather_code: z.number().int(),
  wind_speed_10m: z.number(),
  time: z.number(),
});

export class LocationWeather extends OpenAPIRoute {
  schema = {
    request: { params: z.object({ locationId: z.number().int().positive() }) },
    responses: {
      "200": {
        description: "Current weather in Celsius and km/h from Open-Meteo",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(true),
              weather: currentWeatherSchema,
            }),
          },
        },
      },
      "400": { description: "Invalid location ID" },
      "404": { description: "Location not found" },
      "500": { description: "Unable to load location" },
      "502": { description: "Weather service unavailable" },
    },
    summary: "Get Location Weather",
    tags: ["Locations"],
  };

  async handle(c: AppContext) {
    const {
      params: { locationId },
    } = await this.getValidatedData<typeof this.schema>();
    const rows = await drizzle(c.env.DB)
      .select({ latitude: location.latitude, longitude: location.longitude })
      .from(location)
      .where(eq(location.id, locationId))
      .limit(1)
      .catch(() => null);
    if (!rows) {
      return c.json({ success: false, error: "Unable to load location" }, 500);
    }
    const [coordinates] = rows;
    if (!coordinates) {
      return c.json({ success: false, error: "Location not found" }, 404);
    }
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      current:
        "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
      temperature_unit: "celsius",
      wind_speed_unit: "kmh",
      timeformat: "unixtime",
    }).toString();
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        throw new Error("Weather service unavailable");
      }
      const { current } = z
        .object({ current: currentWeatherSchema })
        .parse(await response.json());
      c.header("Cache-Control", "public, max-age=300");
      return c.json({ success: true, weather: current });
    } catch {
      return c.json(
        { success: false, error: "Weather service unavailable" },
        502
      );
    }
  }
}
