import { expo } from "@better-auth/expo";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { drizzle } from "drizzle-orm/d1";

import * as appSchema from "@/db/app.schema";
import * as authSchema from "@/db/auth.schema";
import { webOrigins } from "@/lib/origins";

const schema = {
  ...appSchema,
  ...authSchema,
};

export const auth = (env: Cloudflare.Env) => {
  const db = drizzle(env.DB);

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    plugins: [expo()],
    trustedOrigins: ["studystatus://", ...webOrigins(env)],
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
  });
};
