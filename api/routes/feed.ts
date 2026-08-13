import { and, desc, eq, isNotNull, lt, or, sql } from "@workspace/db";
import { Router, type IRouter } from "../http";
import {
  db,
  feedCommentsTable,
  feedMediaTable,
  feedPostLikesTable,
  feedPostReportsTable,
  feedPostsTable,
  feedPostSharesTable,
  orgUnitsTable,
  usersTable,
} from "@workspace/db";
import {
  CreateFeedPostBody,
  CreateFeedPostCommentBody,
  CreateFeedPostCommentParams,
  FeedPostsPage,
  ListFeedPostCommentsParams,
  ListFeedPostsQueryParams,
  ListFeedPostsResponse,
  ShareFeedPostParams,
  ToggleFeedPostLikeParams,
} from "../lib/api-zod";
import { authenticate, optionalAuthenticate } from "../middlewares/auth";
import {
  ImageKitService,
  MediaConfigurationError,
  MediaValidationError,
} from "../lib/mediaProvider";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const DEFAULT_CITY = "Nagpur";

type Cursor = { createdAt: string; id: number };

function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(value?: string): Cursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Cursor;
    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function getCityName(orgUnitId: number | null): Promise<string | null> {
  let currentId = orgUnitId;
  for (let depth = 0; depth < 12 && currentId != null; depth += 1) {
    const [unit] = await db
      .select({
        id: orgUnitsTable.id,
        name: orgUnitsTable.name,
        level: orgUnitsTable.level,
        parentId: orgUnitsTable.parentId,
      })
      .from(orgUnitsTable)
      .where(eq(orgUnitsTable.id, currentId));
    if (!unit) return null;
    if (unit.level === "city") return unit.name;
    currentId = unit.parentId;
  }
  return null;
}

async function authorFor(user: {
  id: number;
  name: string;
  profileImageUrl: string | null;
  customBadge: string | null;
  role: string;
  city: string | null;
  orgUnitId: number | null;
}) {
  return {
    id: user.id,
    name: user.name,
    profileImageUrl: user.profileImageUrl,
    badge:
      user.customBadge ??
      (user.role === "admin"
        ? "admin"
        : user.role === "volunteer"
          ? "volunteer"
          : "member"),
    city: user.city ?? await getCityName(user.orgUnitId),
  };
}

export async function formatPost(postId: number, viewerId?: number) {
  const [post] = await db
    .select({
      id: feedPostsTable.id,
      text: feedPostsTable.text,
      createdAt: feedPostsTable.createdAt,
      authorName: usersTable.name,
      authorProfileImageUrl: usersTable.profileImageUrl,
      authorCustomBadge: usersTable.customBadge,
      authorId: feedPostsTable.authorId,
      authorRole: usersTable.role,
      authorCity: usersTable.city,
      authorOrgUnitId: usersTable.orgUnitId,
    })
    .from(feedPostsTable)
    .innerJoin(usersTable, eq(usersTable.id, feedPostsTable.authorId))
    .where(eq(feedPostsTable.id, postId));
  if (!post) return null;

  const [media, likes, comments, shares, viewerLike] = await Promise.all([
    db
      .select()
      .from(feedMediaTable)
      .where(eq(feedMediaTable.postId, postId))
      .orderBy(feedMediaTable.sortOrder, feedMediaTable.id),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedPostLikesTable)
      .where(eq(feedPostLikesTable.postId, postId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedCommentsTable)
      .where(eq(feedCommentsTable.postId, postId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedPostSharesTable)
      .where(
        and(
          eq(feedPostSharesTable.postId, postId),
          isNotNull(feedPostSharesTable.userId),
        ),
      ),
    viewerId == null
      ? Promise.resolve([])
      : db
          .select({ id: feedPostLikesTable.id })
          .from(feedPostLikesTable)
          .where(
            and(
              eq(feedPostLikesTable.postId, postId),
              eq(feedPostLikesTable.userId, viewerId),
            ),
          ),
  ]);

  return {
    id: post.id,
    author: await authorFor({
      id: post.authorId,
      name: post.authorName,
      profileImageUrl: post.authorProfileImageUrl,
      customBadge: post.authorCustomBadge,
      role: post.authorRole,
      city: post.authorCity,
      orgUnitId: post.authorOrgUnitId,
    }),
    text: post.text,
    media: media.map((item) => ({
      id: item.id,
      type: item.fileType as "image" | "video",
      url:
        item.mediaUrl ??
        "",
    })),
    counts: {
      likes: likes[0]?.count ?? 0,
      comments: comments[0]?.count ?? 0,
      shares: shares[0]?.count ?? 0,
    },
    likedByViewer: viewerLike.length > 0,
    isAuthor: viewerId != null && post.authorId === viewerId,
    createdAt: post.createdAt.toISOString(),
  };
}

router.get("/members/:id/profile", optionalAuthenticate, async (req, res): Promise<void> => {
  const memberId = Number(req.params.id);
  if (!Number.isInteger(memberId) || memberId <= 0) {
    res.status(400).json({ error: "Invalid member ID" });
    return;
  }

  const [member] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      profileImageUrl: usersTable.profileImageUrl,
      description: usersTable.description,
      thoughtTemplateId: usersTable.thoughtTemplateId,
      role: usersTable.role,
      customBadge: usersTable.customBadge,
      city: usersTable.city,
      orgUnitId: usersTable.orgUnitId,
      createdAt: usersTable.createdAt,
      isActive: usersTable.isActive,
    })
    .from(usersTable)
    .where(eq(usersTable.id, memberId))
    .limit(1);

  if (!member || !member.isActive) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const postRows = await db
    .select({ id: feedPostsTable.id })
    .from(feedPostsTable)
    .where(eq(feedPostsTable.authorId, memberId))
    .orderBy(desc(feedPostsTable.createdAt), desc(feedPostsTable.id));
  const posts = (
    await Promise.all(postRows.map((row) => formatPost(row.id, req.user?.id)))
  ).filter((item): item is NonNullable<typeof item> => item !== null);

  res.json({
    profile: {
      id: member.id,
      name: member.name,
      profileImageUrl: member.profileImageUrl,
      customBadge: member.customBadge,
      description: member.description,
      role: member.role,
      city: member.city ?? await getCityName(member.orgUnitId) ?? DEFAULT_CITY,
      createdAt: member.createdAt.toISOString(),
      thoughtTemplateId: member.thoughtTemplateId ?? member.id % 15,
    },
    posts,
  });
});

router.get("/feed", optionalAuthenticate, async (req, res): Promise<void> => {
  const query = ListFeedPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const cursor = decodeCursor(query.data.cursor);
  if (query.data.cursor && !cursor) {
    res.status(400).json({ error: "Invalid cursor" });
    return;
  }
  const limit = query.data.limit ?? 10;
  const condition = cursor
    ? or(
        lt(feedPostsTable.createdAt, new Date(cursor.createdAt)),
        and(
          eq(feedPostsTable.createdAt, new Date(cursor.createdAt)),
          lt(feedPostsTable.id, cursor.id),
        ),
      )
    : undefined;
  const rows = await db
    .select({ id: feedPostsTable.id })
    .from(feedPostsTable)
    .where(condition)
    .orderBy(desc(feedPostsTable.createdAt), desc(feedPostsTable.id))
    .limit(limit + 1);
  const pageRows = rows.slice(0, limit);
  const items = (
    await Promise.all(pageRows.map((row) => formatPost(row.id, req.user?.id)))
  ).filter((item): item is NonNullable<typeof item> => item !== null);
  const last = pageRows.at(-1);
  const nextCursor =
    rows.length > limit && last
      ? encodeCursor({ createdAt: (await db.select({ createdAt: feedPostsTable.createdAt }).from(feedPostsTable).where(eq(feedPostsTable.id, last.id)))[0]!.createdAt.toISOString(), id: last.id })
      : null;
  res.json(ListFeedPostsResponse.parse({ items, nextCursor }));
});

router.post("/feed", authenticate, async (req, res): Promise<void> => {
  const parsed = CreateFeedPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const text = parsed.data.text?.trim() || null;
  if (!text && parsed.data.media.length === 0) {
    res.status(400).json({ error: "A post needs text or media" });
    return;
  }
  const [post] = await db
    .insert(feedPostsTable)
    .values({ authorId: req.user!.id, text })
    .returning({ id: feedPostsTable.id });
  if (!post) {
    res.status(500).json({ error: "Unable to create post" });
    return;
  }
  if (parsed.data.media.length > 0) {
    let mediaProvider: ImageKitService | null = null;
    const uploadedFileIds: string[] = [];
    try {
      const media = await Promise.all(
        parsed.data.media.map(async (item, index) => {
          const provider = mediaProvider ?? new ImageKitService();
          mediaProvider = provider;
          const metadata = provider.validateUploadMetadata({
            userId: req.user!.id,
            purpose: "post",
            metadata: item,
          });
          uploadedFileIds.push(metadata.fileId);
          if (
            item.type !== metadata.fileType
          ) {
            throw new MediaValidationError("Uploaded media type does not match the post media type.");
          }
          return {
            postId: post.id,
            fileType: item.fileType,
            fileId: metadata.fileId,
            filePath: metadata.filePath,
            mediaUrl: metadata.mediaUrl,
            thumbnailUrl: metadata.thumbnailUrl,
            mimeType: metadata.mimeType,
            fileSize: metadata.fileSize,
            width: metadata.width,
            height: metadata.height,
            duration: metadata.duration,
            sortOrder: index,
          };
        }),
      );
      await db.insert(feedMediaTable).values(media);
    } catch (error) {
      await db.delete(feedPostsTable).where(eq(feedPostsTable.id, post.id));
      await Promise.allSettled(
        uploadedFileIds.map((fileId) => mediaProvider!.deleteFile(fileId)),
      );
      if (error instanceof MediaValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error instanceof MediaConfigurationError) {
        res.status(503).json({ error: "Media storage is not configured." });
        return;
      }
      logger.error({ err: error }, "Unable to verify uploaded media");
      res.status(502).json({ error: "Unable to verify uploaded media. Please try again." });
      return;
    }
  }
  const formatted = await formatPost(post.id, req.user!.id);
  res.status(201).json(formatted);
});

router.get("/feed/mine", authenticate, async (req, res): Promise<void> => {
  const rows = await db
    .select({ id: feedPostsTable.id })
    .from(feedPostsTable)
    .where(eq(feedPostsTable.authorId, req.user!.id))
    .orderBy(desc(feedPostsTable.createdAt), desc(feedPostsTable.id));

  const posts = (
    await Promise.all(rows.map((row) => formatPost(row.id, req.user!.id)))
  ).filter((item): item is NonNullable<typeof item> => item !== null);

  res.json(posts);
});

router.get("/feed/:id", optionalAuthenticate, async (req, res): Promise<void> => {
  const parsed = ToggleFeedPostLikeParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }

  const post = await formatPost(parsed.data.id, req.user?.id);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json(post);
});

router.delete("/feed/:id", authenticate, async (req, res): Promise<void> => {
  const parsed = ToggleFeedPostLikeParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [post] = await db
    .select({ authorId: feedPostsTable.authorId })
    .from(feedPostsTable)
    .where(eq(feedPostsTable.id, parsed.data.id));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  if (post.authorId !== req.user!.id) {
    res.status(403).json({ error: "Only the post author can delete it" });
    return;
  }

  const media = await db
    .select({ fileId: feedMediaTable.fileId })
    .from(feedMediaTable)
    .where(eq(feedMediaTable.postId, parsed.data.id));

  if (media.length > 0) {
    try {
      const provider = new ImageKitService();
      await Promise.all(media.map((item) => provider.deleteFile(item.fileId)));
    } catch (error) {
      logger.error({ err: error, postId: parsed.data.id }, "Unable to delete post media");
      res.status(502).json({ error: "Unable to remove post media. The post was not deleted." });
      return;
    }
  }

  await db.delete(feedPostsTable).where(eq(feedPostsTable.id, parsed.data.id));
  res.status(204).send();
});

router.post("/feed/:id/report", authenticate, async (req, res): Promise<void> => {
  const parsed = ToggleFeedPostLikeParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [post] = await db
    .select({ id: feedPostsTable.id })
    .from(feedPostsTable)
    .where(eq(feedPostsTable.id, parsed.data.id));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  try {
    await db.insert(feedPostReportsTable).values({
      postId: parsed.data.id,
      reporterId: req.user!.id,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({ error: "You have already reported this post" });
      return;
    }
    throw error;
  }

  res.status(201).json({ message: "Post reported successfully" });
});

router.post("/feed/:id/like", authenticate, async (req, res): Promise<void> => {
  const parsed = ToggleFeedPostLikeParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db
    .select({ id: feedPostLikesTable.id })
    .from(feedPostLikesTable)
    .where(
      and(
        eq(feedPostLikesTable.postId, parsed.data.id),
        eq(feedPostLikesTable.userId, req.user!.id),
      ),
    );
  if (existing) {
    await db.delete(feedPostLikesTable).where(eq(feedPostLikesTable.id, existing.id));
  } else {
    await db.insert(feedPostLikesTable).values({
      postId: parsed.data.id,
      userId: req.user!.id,
    });
  }
  const [likes, shares] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(feedPostLikesTable).where(eq(feedPostLikesTable.postId, parsed.data.id)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedPostSharesTable)
      .where(
        and(
          eq(feedPostSharesTable.postId, parsed.data.id),
          isNotNull(feedPostSharesTable.userId),
        ),
      ),
  ]);
  res.json({ liked: !existing, likes: likes[0]?.count ?? 0, shares: shares[0]?.count ?? 0 });
});

router.get("/feed/:id/comments", async (req, res): Promise<void> => {
  const parsed = ListFeedPostCommentsParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = await db
    .select({
      id: feedCommentsTable.id,
      postId: feedCommentsTable.postId,
      text: feedCommentsTable.text,
      createdAt: feedCommentsTable.createdAt,
      authorId: usersTable.id,
      authorName: usersTable.name,
      authorProfileImageUrl: usersTable.profileImageUrl,
      authorCustomBadge: usersTable.customBadge,
      authorRole: usersTable.role,
      authorCity: usersTable.city,
      authorOrgUnitId: usersTable.orgUnitId,
    })
    .from(feedCommentsTable)
    .innerJoin(usersTable, eq(usersTable.id, feedCommentsTable.authorId))
    .where(eq(feedCommentsTable.postId, parsed.data.id))
    .orderBy(feedCommentsTable.createdAt);
  const comments = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      postId: row.postId,
      author: await authorFor({
        id: row.authorId,
        name: row.authorName,
        profileImageUrl: row.authorProfileImageUrl,
        customBadge: row.authorCustomBadge,
        role: row.authorRole,
        city: row.authorCity,
        orgUnitId: row.authorOrgUnitId,
      }),
      text: row.text,
      createdAt: row.createdAt.toISOString(),
    })),
  );
  res.json(comments);
});

router.post("/feed/:id/comments", authenticate, async (req, res): Promise<void> => {
  const params = CreateFeedPostCommentParams.safeParse(req.params);
  const body = CreateFeedPostCommentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid comment" });
    return;
  }
  const [comment] = await db
    .insert(feedCommentsTable)
    .values({
      postId: params.data.id,
      authorId: req.user!.id,
      text: body.data.text.trim(),
    })
    .returning({ id: feedCommentsTable.id });
  if (!comment) {
    res.status(500).json({ error: "Unable to create comment" });
    return;
  }
  const rows = await db
    .select({
      id: feedCommentsTable.id,
      postId: feedCommentsTable.postId,
      text: feedCommentsTable.text,
      createdAt: feedCommentsTable.createdAt,
      authorId: usersTable.id,
      authorName: usersTable.name,
      authorProfileImageUrl: usersTable.profileImageUrl,
      authorCustomBadge: usersTable.customBadge,
      authorRole: usersTable.role,
      authorCity: usersTable.city,
      authorOrgUnitId: usersTable.orgUnitId,
    })
    .from(feedCommentsTable)
    .innerJoin(usersTable, eq(usersTable.id, feedCommentsTable.authorId))
    .where(eq(feedCommentsTable.id, comment.id));
  const row = rows[0]!;
  res.status(201).json({
    id: row.id,
    postId: row.postId,
    author: await authorFor({
      id: row.authorId,
      name: row.authorName,
      profileImageUrl: row.authorProfileImageUrl,
      customBadge: row.authorCustomBadge,
      role: row.authorRole,
      city: row.authorCity,
      orgUnitId: row.authorOrgUnitId,
    }),
    text: row.text,
    createdAt: row.createdAt.toISOString(),
  });
});

router.post("/feed/:id/share", optionalAuthenticate, async (req, res): Promise<void> => {
  const parsed = ShareFeedPostParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (req.user) {
    await db
      .insert(feedPostSharesTable)
      .values({
        postId: parsed.data.id,
        userId: req.user.id,
      })
      .onConflictDoNothing({
        target: [feedPostSharesTable.postId, feedPostSharesTable.userId],
      });
  }
  const [likes, shares] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(feedPostLikesTable).where(eq(feedPostLikesTable.postId, parsed.data.id)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedPostSharesTable)
      .where(
        and(
          eq(feedPostSharesTable.postId, parsed.data.id),
          isNotNull(feedPostSharesTable.userId),
        ),
      ),
  ]);
  res.json({ liked: false, likes: likes[0]?.count ?? 0, shares: shares[0]?.count ?? 0 });
});

export default router;
