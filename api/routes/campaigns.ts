import { Router, type IRouter } from "../http";
import { eq, desc } from "@workspace/db";
import { db, campaignsTable, insertCampaignSchema } from "@workspace/db";
import {
  ListCampaignsQueryParams,
  ListCampaignsResponse,
  GetCampaignParams,
  GetCampaignResponse,
} from "../lib/api-zod";
import { authenticate } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";
import { ImageKitService, MediaValidationError, type MediaUploadMetadata } from "../lib/mediaProvider";

const router: IRouter = Router();

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

const editableStatuses = ["active", "completed", "upcoming", "stopped"] as const;

function readImageMetadata(body: Record<string, unknown>, userId: number): MediaUploadMetadata | null {
  if (body.imageMetadata === undefined || body.imageMetadata === null) return null;
  return new ImageKitService().validateUploadMetadata({
    userId,
    purpose: "campaign",
    metadata: body.imageMetadata,
  });
}

async function cleanupImage(fileId: string | null | undefined) {
  if (!fileId) return;
  try {
    await new ImageKitService().deleteFile(fileId);
  } catch (error) {
    console.error("Unable to delete ImageKit campaign image", error);
  }
}

async function createUniqueSlug(title: string) {
  const base = slugify(title) || "campaign";
  let slug = base;
  let suffix = 2;

  while (true) {
    const [existing] = await db
      .select({ id: campaignsTable.id })
      .from(campaignsTable)
      .where(eq(campaignsTable.slug, slug))
      .limit(1);
    if (!existing) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

router.get(
  "/campaigns/manage",
  authenticate,
  requireRole("admin", "super_admin"),
  async (_req, res): Promise<void> => {
    const campaigns = await db
      .select()
      .from(campaignsTable)
      .orderBy(desc(campaignsTable.createdAt));

    res.json({ campaigns });
  },
);

router.post(
  "/campaigns",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const body = req.body ?? {};
    let imageMetadata: MediaUploadMetadata | null = null;
    try {
      imageMetadata = readImageMetadata(body, req.user!.id);
    } catch (error) {
      if (error instanceof MediaValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
    if (imageMetadata === null && typeof body.imageUrl === "string" && body.imageUrl.trim()) {
      res.status(400).json({ error: "Campaign images must be uploaded through ImageKit." });
      return;
    }
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const startDate = new Date().toISOString().slice(0, 10);
    const goalAmountInr = Number(body.goalAmountInr);

    if (!title || title.length > 160) {
      res.status(400).json({ error: "Title is required and must be 160 characters or fewer" });
      return;
    }
    if (!description) {
      res.status(400).json({ error: "Description is required" });
      return;
    }
    if (!Number.isInteger(goalAmountInr) || goalAmountInr < 0) {
      res.status(400).json({ error: "Goal amount must be a non-negative whole number" });
      return;
    }
    if (body.status !== undefined && !editableStatuses.includes(body.status)) {
      res.status(400).json({ error: "Status must be active, completed, upcoming, or stopped" });
      return;
    }

    const payload = {
      title,
      slug: await createUniqueSlug(title),
      description,
      goalAmountInr,
      raisedAmountInr: 0,
      status: typeof body.status === "string" && body.status.trim() ? body.status.trim() : "active",
      imageUrl: imageMetadata?.mediaUrl ?? normalizeOptionalText(body.imageUrl),
      imageFileId: imageMetadata?.fileId ?? null,
      imageFilePath: imageMetadata?.filePath ?? null,
      startDate,
      endDate: normalizeOptionalText(body.endDate),
      location: normalizeOptionalText(body.location),
      category: typeof body.category === "string" && body.category.trim() ? body.category.trim() : "general",
      orgUnitId: null,
    };
    const parsed = insertCampaignSchema.safeParse(payload);
    if (!parsed.success) {
      res.status(400).json({ error: "Please check the campaign details and try again" });
      return;
    }

    const [campaign] = await db.insert(campaignsTable).values(parsed.data).returning();
    res.status(201).json({ campaign });
  },
);

router.delete(
  "/campaigns/:id",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid campaign ID" });
      return;
    }

    const [existing] = await db
      .select({ imageFileId: campaignsTable.imageFileId })
      .from(campaignsTable)
      .where(eq(campaignsTable.id, id))
      .limit(1);
    const [deleted] = await db
      .delete(campaignsTable)
      .where(eq(campaignsTable.id, id))
      .returning({ id: campaignsTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    await cleanupImage(existing?.imageFileId);
    res.json({ message: "Campaign deleted" });
  },
);

router.patch(
  "/campaigns/:id",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid campaign ID" });
      return;
    }

    const body = req.body ?? {};
    const [existing] = await db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    let imageMetadata: MediaUploadMetadata | null = null;
    try {
      imageMetadata = readImageMetadata(body, req.user!.id);
    } catch (error) {
      if (error instanceof MediaValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
    if (
      imageMetadata === null &&
      body.imageUrl !== undefined &&
      typeof body.imageUrl === "string" &&
      body.imageUrl.trim()
    ) {
      res.status(400).json({ error: "Campaign images must be uploaded through ImageKit." });
      return;
    }

    const title = typeof body.title === "string" ? body.title.trim() : existing.title;
    const description = typeof body.description === "string" ? body.description.trim() : existing.description;
    const goalAmountInr = body.goalAmountInr === undefined
      ? existing.goalAmountInr
      : Number(body.goalAmountInr);
    const status = body.status === undefined ? existing.status : body.status;

    if (!title || title.length > 160) {
      res.status(400).json({ error: "Title is required and must be 160 characters or fewer" });
      return;
    }
    if (!description) {
      res.status(400).json({ error: "Description is required" });
      return;
    }
    if (!Number.isInteger(goalAmountInr) || goalAmountInr < 0) {
      res.status(400).json({ error: "Goal amount must be a non-negative whole number" });
      return;
    }
    if (typeof status !== "string" || !editableStatuses.includes(status as typeof editableStatuses[number])) {
      res.status(400).json({ error: "Status must be active, completed, upcoming, or stopped" });
      return;
    }

    const slug = title === existing.title ? existing.slug : await createUniqueSlug(title);
    const [campaign] = await db
      .update(campaignsTable)
      .set({
        title,
        slug,
        description,
        goalAmountInr,
        status,
        imageUrl: body.imageMetadata !== undefined
          ? imageMetadata?.mediaUrl ?? null
          : body.imageUrl === undefined
            ? existing.imageUrl
            : normalizeOptionalText(body.imageUrl),
        imageFileId: body.imageMetadata !== undefined
          ? imageMetadata?.fileId ?? null
          : body.imageUrl === undefined
            ? existing.imageFileId
            : null,
        imageFilePath: body.imageMetadata !== undefined
          ? imageMetadata?.filePath ?? null
          : body.imageUrl === undefined
            ? existing.imageFilePath
            : null,
        endDate: body.endDate === undefined ? existing.endDate : normalizeOptionalText(body.endDate),
        location: body.location === undefined ? existing.location : normalizeOptionalText(body.location),
        category: body.category === undefined ? existing.category : (normalizeOptionalText(body.category) ?? "general"),
      })
      .where(eq(campaignsTable.id, id))
      .returning();

    if (
      (body.imageMetadata !== undefined || body.imageUrl !== undefined) &&
      existing.imageFileId &&
      existing.imageFileId !== campaign.imageFileId
    ) {
      await cleanupImage(existing.imageFileId);
    }
    res.json({ campaign });
  },
);

router.get("/campaigns", async (req, res): Promise<void> => {
  const query = ListCampaignsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(campaignsTable).orderBy(desc(campaignsTable.createdAt));

  const rows = await dbQuery;

  const filtered = query.data.status
    ? rows.filter((r) => r.status === query.data.status)
    : rows;

  const limited = filtered.slice(0, query.data.limit ?? 10);

  res.json(
    ListCampaignsResponse.parse(
      limited.map((r) => ({
        ...r,
        goalAmountInr: r.goalAmountInr ?? 0,
        raisedAmountInr: r.raisedAmountInr ?? 0,
        isUpcoming: r.status === "upcoming",
      }))
    )
  );
});

router.get("/campaigns/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCampaignParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, params.data.id));

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  res.json(GetCampaignResponse.parse(campaign));
});

export default router;
