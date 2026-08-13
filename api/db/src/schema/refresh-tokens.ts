import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  isRevoked: boolean("is_revoked").notNull().default(false),
  deviceInfo: text("device_info"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
