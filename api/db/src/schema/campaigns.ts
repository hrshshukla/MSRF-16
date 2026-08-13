import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  goalAmountInr: integer("goal_amount_inr").notNull().default(0),
  raisedAmountInr: integer("raised_amount_inr").notNull().default(0),
  status: text("status").notNull().default("active"),
  imageUrl: text("image_url"),
  imageFileId: text("image_file_id"),
  imageFilePath: text("image_file_path"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  location: text("location"),
  category: text("category").notNull().default("general"),
  orgUnitId: integer("org_unit_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
