import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as appSchema from "./src/db/app.schema";
import * as authSchema from "./src/db/auth.schema";

const schema = {
  ...appSchema,
  ...authSchema,
};

const { DB, BETTER_AUTH_URL, BETTER_AUTH_SECRET } = process.env;

const db = drizzle(DB as unknown as DrizzleD1Database);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
});
