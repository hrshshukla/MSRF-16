import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users.js";

export const feedPostsTable = pgTable("feed_posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id),
  text: text("text"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const feedMediaTable = pgTable("feed_media", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => feedPostsTable.id, { onDelete: "cascade" }),
  fileType: text("file_type").notNull(),
  fileId: text("file_id").notNull(),
  filePath: text("file_path").notNull(),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const feedPostLikesTable = pgTable(
  "feed_post_likes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => feedPostsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    postUserUnique: uniqueIndex("feed_post_likes_post_user_unique").on(
      table.postId,
      table.userId,
    ),
  }),
);

export const feedCommentsTable = pgTable("feed_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => feedPostsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const feedPostSharesTable = pgTable(
  "feed_post_shares",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => feedPostsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    postUserUnique: uniqueIndex("feed_post_shares_post_user_unique").on(
      table.postId,
      table.userId,
    ),
  }),
);

export const feedPostReportsTable = pgTable(
  "feed_post_reports",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => feedPostsTable.id, { onDelete: "cascade" }),
    reporterId: integer("reporter_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    postReporterUnique: uniqueIndex("feed_post_reports_post_reporter_unique").on(
      table.postId,
      table.reporterId,
    ),
  }),
);

export const insertFeedPostSchema = createInsertSchema(feedPostsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFeedPost = typeof feedPostsTable.$inferInsert;
export type FeedPost = typeof feedPostsTable.$inferSelect;
export type FeedMedia = typeof feedMediaTable.$inferSelect;
export type FeedComment = typeof feedCommentsTable.$inferSelect;
export type FeedPostLike = typeof feedPostLikesTable.$inferSelect;
export type FeedPostShare = typeof feedPostSharesTable.$inferSelect;
export type FeedPostReport = typeof feedPostReportsTable.$inferSelect;