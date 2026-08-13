import { Router, type IRouter } from "../http";
import { desc } from "@workspace/db";
import { db, testimonialsTable } from "@workspace/db";
import { ListTestimonialsResponse } from "../lib/api-zod";

const router: IRouter = Router();

router.get("/testimonials", async (_req, res): Promise<void> => {
  const rows = await db.select().from(testimonialsTable).orderBy(desc(testimonialsTable.createdAt));

  res.json(
    ListTestimonialsResponse.parse(
      rows.map((r) => ({
        ...r,
        role: r.role ?? null,
        location: r.location ?? null,
        imageUrl: r.imageUrl ?? null,
      }))
    )
  );
});

export default router;
