import { user } from "@/db/auth.schema";
import { relations } from "drizzle-orm";
import { int, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const location = sqliteTable("locations", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),

  latitude: real().notNull(),
  longitude: real().notNull(),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const report = sqliteTable("checkins", {
  id: integer().primaryKey({ autoIncrement: true }),

  locationId: integer("location_id")
    .notNull()
    .references(() => location.id, {
      onDelete: "cascade",
    }),

  crowdLevel: text("crowd_level", {
    enum: ["empty", "moderate", "busy"],
  }).notNull(),

  alias: text(),
  comment: text(),

  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  createdAt: integer("created_at", {
    mode: "timestamp",
  })
    .notNull()
    .$defaultFn(() => new Date()),
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
