import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { eventsTable } from "./events.js";

export const eventParticipationsTable = pgTable(
  "event_participations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    eventId: integer("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("registered"),
    participatedAt: timestamp("participated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userEventUnique: uniqueIndex("event_participations_user_event_unique").on(table.userId, table.eventId),
  }),
);

export type EventParticipation = typeof eventParticipationsTable.$inferSelect;