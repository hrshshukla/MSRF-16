import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "volunteer",
  "member",
]);

export const volunteerApplicationStatusEnum = pgEnum(
  "volunteer_application_status",
  ["pending", "approved", "rejected"],
);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  profileImageUrl: text("profile_image_url"),
  customBadge: text("custom_badge"),
  description: text("description"),
  thoughtTemplateId: integer("thought_template_id"),
  email: text("email").notNull().unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("member"),
  volunteerApplicationStatus: volunteerApplicationStatusEnum("volunteer_application_status"),
  volunteerApplicationSubmittedAt: timestamp("volunteer_application_submitted_at", {
    withTimezone: true,
  }),
  volunteerApplicationReviewedAt: timestamp("volunteer_application_reviewed_at", {
    withTimezone: true,
  }),
  city: text("city"),
  cityDetectedAutomatically: boolean("city_detected_automatically").notNull().default(false),
  orgUnitId: integer("org_unit_id"),
  isActive: boolean("is_active").notNull().default(true),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(usersTable);
