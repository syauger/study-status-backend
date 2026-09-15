import { relations } from "drizzle-orm";
import { int, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "@/db/auth.schema";

export const location = sqliteTable("locations", {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  id: int().primaryKey({ autoIncrement: true }),

  latitude: real().notNull(),
  longitude: real().notNull(),
  name: text().notNull(),
});

export const report = sqliteTable("checkins", {
  alias: text(),
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
