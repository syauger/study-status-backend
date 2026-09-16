import { z } from "zod";

export const noiseLevels = [
  "unknown",
  "quiet",
  "conversational",
  "lively",
  "mixed",
] as const;

export const locationHoursSchema = z.object({
  friday: z.string(),
  monday: z.string(),
  notes: z.string(),
  saturday: z.string(),
  sunday: z.string(),
  thursday: z.string(),
  timezone: z.string(),
  tuesday: z.string(),
  wednesday: z.string(),
});

export type LocationHours = z.infer<typeof locationHoursSchema>;

export const locationResponseSchema = z.object({
  amenities: z.string().describe("Comma-separated amenities"),
  createdAt: z.iso.datetime(),
  description: z.string(),
  hours: locationHoursSchema.nullable(),
  id: z.number().int(),
  latitude: z.number(),
  longitude: z.number(),
  name: z.string(),
  noiseLevel: z.enum(noiseLevels),
});
