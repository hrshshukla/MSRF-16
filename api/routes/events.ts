import { Router, type IRouter } from "../http";
import { eq, desc } from "@workspace/db";
import { db, eventsTable, insertEventSchema } from "@workspace/db";
import {
  ListEventsQueryParams,
  ListEventsResponse,
  GetEventParams,
  GetEventResponse,
} from "../lib/api-zod";
import { authenticate } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";

const router: IRouter = Router();

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function createUniqueSlug(title: string) {
  const base = slugify(title) || "event";
  let slug = base;
  let suffix = 2;

  while (true) {
    const [existing] = await db
      .select({ id: eventsTable.id })
      .from(eventsTable)
      .where(eq(eventsTable.slug, slug))
      .limit(1);
    if (!existing) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function readOptionalInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? numberValue : null;
}

function normalizeUpcomingFlag(dateValue: string) {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? "true"
    : date.getTime() > Date.now()
      ? "true"
      : "false";
}

router.get(
  "/events/manage",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt));

    res.json({
      events: rows.map((r) => ({
        ...r,
        isUpcoming: r.isUpcoming === "true",
        attendeesCount: r.attendeesCount ?? null,
      })),
    });
  },
);

router.get("/events", async (req, res): Promise<void> => {
  const query = ListEventsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt));

  const filtered =
    query.data.upcoming !== undefined
      ? rows.filter((r) => (r.isUpcoming === "true") === query.data.upcoming)
      : rows;

  const limited = filtered.slice(0, query.data.limit ?? 10);

  res.json(
    ListEventsResponse.parse(
      limited.map((r) => ({
        ...r,
        isUpcoming: r.isUpcoming === "true",
        attendeesCount: r.attendeesCount ?? null,
      }))
    )
  );
});

router.get("/events/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetEventParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, params.data.id));

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json(
    GetEventResponse.parse({
      ...event,
      isUpcoming: event.isUpcoming === "true",
      attendeesCount: event.attendeesCount ?? null,
    })
  );
});

router.post(
  "/events",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const body = req.body ?? {};

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "general";
    const attendeesCount = readOptionalInteger(body.attendeesCount);
    const imageUrl = normalizeOptionalText(body.imageUrl);

    if (!title || title.length > 160 || !description || !date || !location) {
      res.status(400).json({ error: "Title, description, date, and location are required." });
      return;
    }

    const parsed = insertEventSchema.safeParse({
      title,
      slug: await createUniqueSlug(title),
      description,
      date,
      location,
      imageUrl,
      isUpcoming: normalizeUpcomingFlag(date),
      category: category || "general",
      attendeesCount,
      orgUnitId: null,
    });

    if (!parsed.success) {
      res.status(400).json({ error: "Please check the event details and try again." });
      return;
    }

    const [event] = await db.insert(eventsTable).values(parsed.data).returning();
    res.status(201).json({ event });
  },
);

router.patch(
  "/events/:id",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid event ID" });
      return;
    }

    const [existing] = await db.select().from(eventsTable).where(eq(eventsTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const body = req.body ?? {};
    const title = typeof body.title === "string" ? body.title.trim() : existing.title;
    const description = typeof body.description === "string" ? body.description.trim() : existing.description;
    const date = typeof body.date === "string" ? body.date.trim() : existing.date;
    const location = typeof body.location === "string" ? body.location.trim() : existing.location;
    const category = typeof body.category === "string" ? body.category.trim() : existing.category;
    const attendeesCount = body.attendeesCount === undefined ? existing.attendeesCount : readOptionalInteger(body.attendeesCount);
    const imageUrl = body.imageUrl === undefined ? existing.imageUrl : normalizeOptionalText(body.imageUrl);

    if (!title || title.length > 160 || !description || !date || !location) {
      res.status(400).json({ error: "Title, description, date, and location are required." });
      return;
    }

    const [event] = await db.update(eventsTable).set({
      title,
      slug: title === existing.title ? existing.slug : await createUniqueSlug(title),
      description,
      date,
      location,
      imageUrl,
      isUpcoming: normalizeUpcomingFlag(date),
      category: category || "general",
      attendeesCount,
    }).where(eq(eventsTable.id, id)).returning();

    res.json({ event });
  },
);

router.delete(
  "/events/:id",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid event ID" });
      return;
    }

    const [existing] = await db.select().from(eventsTable).where(eq(eventsTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    await db.delete(eventsTable).where(eq(eventsTable.id, id));
    res.status(204).send();
  },
);

export default router;
