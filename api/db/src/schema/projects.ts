import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  imageFileId: text("image_file_id"),
  imageFilePath: text("image_file_path"),
  status: text("status").notNull().default("ongoing"),
  category: text("category").notNull().default("seva"),
  beneficiariesCount: integer("beneficiaries_count"),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year"),
  budgetInr: integer("budget_inr"),
  location: text("location"),
  membersInvolvedCount: integer("members_involved_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
