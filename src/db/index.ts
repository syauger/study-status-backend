import { drizzle } from "drizzle-orm/d1";

const { DB } = process.env;

export const db = drizzle(DB as unknown as D1Database);
