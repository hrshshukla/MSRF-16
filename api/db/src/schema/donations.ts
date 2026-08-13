import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { campaignsTable } from "./campaigns.js";

export const donationsTable = pgTable("donations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").references(() => campaignsTable.id, { onDelete: "set null" }),
  amountInr: integer("amount_inr").notNull(),
  donorName: text("donor_name"),
  donorEmail: text("donor_email"),
  donatedAt: timestamp("donated_at", { withTimezone: true }).notNull().defaultNow(),
  paymentReference: text("payment_reference"),
});

export type Donation = typeof donationsTable.$inferSelect;