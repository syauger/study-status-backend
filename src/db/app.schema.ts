import { relations } from "drizzle-orm";
import { int, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "@/db/auth.schema";
import type { LocationHours } from "@/lib/location";
import { noiseLevels } from "@/lib/location";

export const location = sqliteTable("locations", {
  amenities: text().notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  description: text().notNull().default(""),
  hours: text({ mode: "json" }).$type<LocationHours>(),
  id: int().primaryKey({ autoIncrement: true }),
  latitude: real().notNull(),
  longitude: real().notNull(),
  name: text().notNull(),
  noiseLevel: text("noise_level", { enum: noiseLevels })
    .notNull()
    .default("unknown"),
});

export const report = sqliteTable("checkins", {
  comment: text(),
  createdAt: integer("created_at", {
    mode: "timestamp",
  })
    .notNull()
    .$defaultFn(() => new Date()),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  crowdLevel: text("crowd_level", {
    enum: ["empty", "moderate", "busy"],
  }).notNull(),
  id: integer().primaryKey({ autoIncrement: true }),
  locationId: integer("location_id")
    .notNull()
    .references(() => location.id, {
      onDelete: "cascade",
    }),
});

export const reportsRelations = relations(report, ({ one }) => ({
  location: one(location, {
    fields: [report.locationId],
    references: [location.id],
  }),
  user: one(user, {
    fields: [report.createdBy],
    references: [user.id],
  }),
}));
