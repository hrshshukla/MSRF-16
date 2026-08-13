import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const OrgLevel = {
  INDIA: "india",
  STATE: "state",
  DISTRICT: "district",
  CITY: "city",
  BLOCK: "block",
  VILLAGE: "village",
} as const;
export type OrgLevel = (typeof OrgLevel)[keyof typeof OrgLevel];

export const orgUnitsTable = pgTable("org_units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  level: text("level").notNull(), // india|state|district|city|block|village
  parentId: integer("parent_id").references((): AnyPgColumn => orgUnitsTable.id),
  slug: text("slug").unique(),
  officeAddress: text("office_address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  description: text("description"),
  imageUrl: text("image_url"),
  stateName: text("state_name"), // useful for district/city/block/village levels
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrgUnitSchema = createInsertSchema(orgUnitsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrgUnit = z.infer<typeof insertOrgUnitSchema>;
export type OrgUnit = typeof orgUnitsTable.$inferSelect;
