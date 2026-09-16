import { z } from "zod";

export const crowdLevels = ["empty", "moderate", "busy"] as const;
export const reportResponseSchema = z.object({
  id: z.number().int(),
  locationId: z.number().int(),
  authorName: z.string(),
  crowdLevel: z.enum(crowdLevels),
  comment: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export const reportCreateSchema = z.object({
  locationId: z.number().int().positive(),
  crowdLevel: z.enum(crowdLevels),
  comment: z.string().trim().max(1000).optional(),
});
