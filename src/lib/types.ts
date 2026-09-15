import type { sessionSchema } from "better-auth";
import type { Context } from "hono";
import { z } from "zod";

export const AuthUserSchema = z.object({
  createdAt: z.date(),
  email: z.email(),
  emailVerified: z.boolean(),
  id: z.string(),
  image: z.string().nullable().optional(),
  name: z.string(),
  updatedAt: z.date(),
});

export interface AppVariables {
  session?: z.infer<typeof sessionSchema>;
  user?: z.infer<typeof AuthUserSchema>;
}

export type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;
