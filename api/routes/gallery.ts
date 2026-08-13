import { Router, type IRouter } from "../http";
import { desc } from "@workspace/db";
import { db, galleryTable } from "@workspace/db";
import { ListGalleryQueryParams, ListGalleryResponse } from "../lib/api-zod";

const router: IRouter = Router();

router.get("/gallery", async (req, res): Promise<void> => {
  const query = ListGalleryQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db.select().from(galleryTable).orderBy(desc(galleryTable.createdAt));

  const filtered = query.data.category
    ? rows.filter((r) => r.category === query.data.category)
    : rows;

  const limited = filtered.slice(0, query.data.limit ?? 20);

  res.json(
    ListGalleryResponse.parse(
      limited.map((r) => ({
        ...r,
        caption: r.caption ?? null,
        eventId: r.eventId ?? null,
        takenAt: r.takenAt ?? null,
      }))
    )
  );
});

export default router;
