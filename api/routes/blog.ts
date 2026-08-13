import { Router, type IRouter } from "../http";
import { eq, desc } from "@workspace/db";
import { db, blogTable } from "@workspace/db";
import {
  ListPostsQueryParams,
  ListPostsResponse,
  GetPostParams,
  GetPostResponse,
} from "../lib/api-zod";

const router: IRouter = Router();

router.get("/blog", async (req, res): Promise<void> => {
  const query = ListPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db.select().from(blogTable).orderBy(desc(blogTable.createdAt));
  const limited = rows.slice(0, query.data.limit ?? 10);

  res.json(
    ListPostsResponse.parse(
      limited.map((r) => ({
        ...r,
        imageUrl: r.imageUrl ?? null,
        tags: r.tags ?? [],
      }))
    )
  );
});

router.get("/blog/:slug", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const params = GetPostParams.safeParse({ slug: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db.select().from(blogTable).where(eq(blogTable.slug, params.data.slug));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json(
    GetPostResponse.parse({
      ...post,
      imageUrl: post.imageUrl ?? null,
      tags: post.tags ?? [],
    })
  );
});

export default router;
