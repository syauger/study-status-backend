import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as appSchema from "@/db/app.schema";
import * as authSchema from "@/db/auth.schema";

const schema = {
  ...appSchema,
  ...authSchema,
};

export const auth = (env: Cloudflare.Env) => {
  const db = drizzle(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
  });
};
