import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { orgUnitsTable } from "./org-units.js";

export const orgUnitMembersTable = pgTable("org_unit_members", {
  id: serial("id").primaryKey(),
  orgUnitId: integer("org_unit_id").notNull().references(() => orgUnitsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  memberRole: text("member_role").notNull().default("volunteer"), // volunteer|active_member|associate
  joinDate: text("join_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrgUnitMemberSchema = createInsertSchema(orgUnitMembersTable).omit({ id: true, createdAt: true });
export type InsertOrgUnitMember = z.infer<typeof insertOrgUnitMemberSchema>;
export type OrgUnitMember = typeof orgUnitMembersTable.$inferSelect;
