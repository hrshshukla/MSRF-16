import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { orgUnitsTable } from "./org-units.js";

export const orgUnitBearersTable = pgTable("org_unit_bearers", {
  id: serial("id").primaryKey(),
  orgUnitId: integer("org_unit_id").notNull().references(() => orgUnitsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(), // President, Secretary, Treasurer, Joint Secretary, etc.
  phone: text("phone"),
  email: text("email"),
  imageUrl: text("image_url"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrgUnitBearerSchema = createInsertSchema(orgUnitBearersTable).omit({ id: true, createdAt: true });
export type InsertOrgUnitBearer = z.infer<typeof insertOrgUnitBearerSchema>;
export type OrgUnitBearer = typeof orgUnitBearersTable.$inferSelect;
