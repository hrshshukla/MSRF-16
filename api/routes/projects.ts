import { Router, type IRouter } from "../http";
import { eq, desc } from "@workspace/db";
import { db, projectsTable, insertProjectSchema } from "@workspace/db";
import {
  ListProjectsResponse,
  GetProjectParams,
  GetProjectResponse,
} from "../lib/api-zod";
import { authenticate } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";
import { ImageKitService, MediaValidationError, type MediaUploadMetadata } from "../lib/mediaProvider";

const router: IRouter = Router();

const editableStatuses = ["ongoing", "completed", "planned"] as const;

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function readOptionalCount(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
}

function isValidOptionalCount(value: number | null) {
  return value === null || (Number.isInteger(value) && value >= 0);
}

function readImageMetadata(body: Record<string, unknown>, userId: number): MediaUploadMetadata | null {
  if (body.imageMetadata === undefined || body.imageMetadata === null) return null;
  return new ImageKitService().validateUploadMetadata({
    userId,
    purpose: "project",
    metadata: body.imageMetadata,
  });
}

async function cleanupImage(fileId: string | null | undefined) {
  if (!fileId) return;
  try {
    await new ImageKitService().deleteFile(fileId);
  } catch (error) {
    console.error("Unable to delete ImageKit project image", error);
  }
}

async function createUniqueSlug(title: string) {
  const base = slugify(title) || "project";
  let slug = base;
  let suffix = 2;
  while (true) {
    const [existing] = await db.select({ id: projectsTable.id }).from(projectsTable).where(eq(projectsTable.slug, slug)).limit(1);
    if (!existing) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

router.get(
  "/projects/manage",
  authenticate,
  requireRole("admin", "super_admin"),
  async (_req, res): Promise<void> => {
    const projects = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));
    res.json({ projects });
  },
);

router.post(
  "/projects",
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
    if (typeof body.imageUrl === "string" && body.imageUrl.trim() && !imageMetadata) {
      res.status(400).json({ error: "Project images must be uploaded through ImageKit." });
      return;
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const status = typeof body.status === "string" ? body.status : "ongoing";
    const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : "seva";
    const startYear = Number(body.startYear);
    const beneficiariesCount = body.beneficiariesCount === "" || body.beneficiariesCount === null || body.beneficiariesCount === undefined
      ? null
      : Number(body.beneficiariesCount);
    const endYear = readOptionalCount(body.endYear);
    const budgetInr = readOptionalCount(body.budgetInr);
    const location = normalizeOptionalText(body.location);
    const membersInvolvedCount = readOptionalCount(body.membersInvolvedCount);

    if (!title || title.length > 160 || !description) {
      res.status(400).json({ error: "Title and description are required; title must be 160 characters or fewer." });
      return;
    }
    if (!editableStatuses.includes(status as typeof editableStatuses[number])) {
      res.status(400).json({ error: "Status must be ongoing, completed, or planned." });
      return;
    }
    if (!Number.isInteger(startYear) || startYear < 1900 || startYear > 2200) {
      res.status(400).json({ error: "Start year must be a valid year." });
      return;
    }
    if (beneficiariesCount !== null && (!Number.isInteger(beneficiariesCount) || beneficiariesCount < 0)) {
      res.status(400).json({ error: "Beneficiaries must be a non-negative whole number." });
      return;
    }
    if (!isValidOptionalCount(endYear) || !isValidOptionalCount(budgetInr) || !isValidOptionalCount(membersInvolvedCount)) {
      res.status(400).json({ error: "Project metrics must be non-negative whole numbers." });
      return;
    }
    if (endYear !== null && endYear < startYear) {
      res.status(400).json({ error: "End year cannot be earlier than the start year." });
      return;
    }

    const parsed = insertProjectSchema.safeParse({
      title,
      slug: await createUniqueSlug(title),
      description,
      imageUrl: imageMetadata?.mediaUrl ?? null,
      imageFileId: imageMetadata?.fileId ?? null,
      imageFilePath: imageMetadata?.filePath ?? null,
      status,
      category,
      beneficiariesCount,
      startYear,
      endYear,
      budgetInr,
      location,
      membersInvolvedCount,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Please check the project details and try again." });
      return;
    }

    const [project] = await db.insert(projectsTable).values(parsed.data).returning();
    res.status(201).json({ project });
  },
);

router.patch(
  "/projects/:id",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }
    const [existing] = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

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
    if (
      imageMetadata === null &&
      body.imageUrl !== undefined &&
      typeof body.imageUrl === "string" &&
      body.imageUrl.trim()
    ) {
      res.status(400).json({ error: "Project images must be uploaded through ImageKit." });
      return;
    }

    const title = typeof body.title === "string" ? body.title.trim() : existing.title;
    const description = typeof body.description === "string" ? body.description.trim() : existing.description;
    const status = body.status === undefined ? existing.status : body.status;
    const startYear = body.startYear === undefined ? existing.startYear : Number(body.startYear);
    const beneficiariesCount = body.beneficiariesCount === undefined
      ? existing.beneficiariesCount
      : body.beneficiariesCount === "" || body.beneficiariesCount === null
        ? null
        : Number(body.beneficiariesCount);
    const endYear = body.endYear === undefined ? existing.endYear : readOptionalCount(body.endYear);
    const budgetInr = body.budgetInr === undefined ? existing.budgetInr : readOptionalCount(body.budgetInr);
    const location = body.location === undefined ? existing.location : normalizeOptionalText(body.location);
    const membersInvolvedCount = body.membersInvolvedCount === undefined
      ? existing.membersInvolvedCount
      : readOptionalCount(body.membersInvolvedCount);

    if (!title || title.length > 160 || !description) {
      res.status(400).json({ error: "Title and description are required; title must be 160 characters or fewer." });
      return;
    }
    if (typeof status !== "string" || !editableStatuses.includes(status as typeof editableStatuses[number])) {
      res.status(400).json({ error: "Status must be ongoing, completed, or planned." });
      return;
    }
    if (!Number.isInteger(startYear) || startYear < 1900 || startYear > 2200) {
      res.status(400).json({ error: "Start year must be a valid year." });
      return;
    }
    if (beneficiariesCount !== null && (!Number.isInteger(beneficiariesCount) || beneficiariesCount < 0)) {
      res.status(400).json({ error: "Beneficiaries must be a non-negative whole number." });
      return;
    }
    if (!isValidOptionalCount(endYear) || !isValidOptionalCount(budgetInr) || !isValidOptionalCount(membersInvolvedCount)) {
      res.status(400).json({ error: "Project metrics must be non-negative whole numbers." });
      return;
    }
    if (endYear !== null && endYear < startYear) {
      res.status(400).json({ error: "End year cannot be earlier than the start year." });
      return;
    }

    const [project] = await db.update(projectsTable).set({
      title,
      slug: title === existing.title ? existing.slug : await createUniqueSlug(title),
      description,
      status,
      category: body.category === undefined ? existing.category : (normalizeOptionalText(body.category) ?? "seva"),
      startYear,
      beneficiariesCount,
      endYear,
      budgetInr,
      location,
      membersInvolvedCount,
      imageUrl: body.imageMetadata !== undefined
        ? imageMetadata?.mediaUrl ?? null
        : body.imageUrl === undefined
          ? existing.imageUrl
          : null,
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
    }).where(eq(projectsTable.id, id)).returning();

    if (
      (body.imageMetadata !== undefined || body.imageUrl !== undefined) &&
      existing.imageFileId &&
      existing.imageFileId !== project.imageFileId
    ) {
      await cleanupImage(existing.imageFileId);
    }
    res.json({ project });
  },
);

router.delete(
  "/projects/:id",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid project ID" });
      return;
    }
    const [existing] = await db.select({ imageFileId: projectsTable.imageFileId }).from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
    const [deleted] = await db.delete(projectsTable).where(eq(projectsTable.id, id)).returning({ id: projectsTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    await cleanupImage(existing?.imageFileId);
    res.json({ message: "Project deleted" });
  },
);

router.get("/projects", async (_req, res): Promise<void> => {
  const rows = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));

  res.json(
    ListProjectsResponse.parse(
      rows.map((r) => ({
        ...r,
        beneficiariesCount: r.beneficiariesCount ?? null,
        imageUrl: r.imageUrl ?? null,
        endYear: r.endYear ?? null,
        budgetInr: r.budgetInr ?? null,
        location: r.location ?? null,
        membersInvolvedCount: r.membersInvolvedCount ?? null,
      }))
    )
  );
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(
    GetProjectResponse.parse({
      ...project,
      beneficiariesCount: project.beneficiariesCount ?? null,
      imageUrl: project.imageUrl ?? null,
      endYear: project.endYear ?? null,
      budgetInr: project.budgetInr ?? null,
      location: project.location ?? null,
      membersInvolvedCount: project.membersInvolvedCount ?? null,
    })
  );
});

export default router;
