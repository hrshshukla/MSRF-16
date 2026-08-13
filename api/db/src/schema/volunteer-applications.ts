import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { usersTable, volunteerApplicationStatusEnum } from "./users.js";

export const volunteerApplicationsTable = pgTable("volunteer_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  skills: text("skills").notNull(),
  message: text("message").notNull(),
  status: volunteerApplicationStatusEnum("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertVolunteerApplicationSchema = createInsertSchema(
  volunteerApplicationsTable,
).omit({ id: true, createdAt: true, updatedAt: true, readAt: true });
export const selectVolunteerApplicationSchema = createSelectSchema(
  volunteerApplicationsTable,
);