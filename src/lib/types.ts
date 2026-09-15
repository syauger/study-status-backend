import { sessionSchema } from "better-auth";
import type { Context } from "hono";
import z from "zod";

export const AuthUserSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  email: z.email(),
  emailVerified: z.boolean(),
  name: z.string(),
  image: z.string().nullable().optional(),
});

export type AppVariables = {
  session?: z.infer<typeof sessionSchema>;
  user?: z.infer<typeof AuthUserSchema>;
};

export type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;
