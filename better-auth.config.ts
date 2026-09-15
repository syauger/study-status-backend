import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";

const { DB, BETTER_AUTH_URL, BETTER_AUTH_SECRET } = process.env;

const db = drizzle(DB as unknown as DrizzleD1Database);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
});
