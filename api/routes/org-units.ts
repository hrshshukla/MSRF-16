import { Router, type IRouter } from "../http";
import { eq, and, asc } from "@workspace/db";
import {
  db,
  orgUnitsTable,
  orgUnitBearersTable,
  orgUnitMembersTable,
  campaignsTable,
  eventsTable,
  galleryTable,
} from "@workspace/db";
import {
  ListOrgUnitsQueryParams,
  ListOrgUnitsResponse,
  GetOrgUnitParams,
  GetOrgUnitResponse as GetOrgUnitDetailResponse,
  GetOrgUnitChildrenResponse,
  GetOrgUnitMembersResponse,
  GetOrgUnitCampaignsResponse,
  GetOrgUnitEventsResponse,
  GetOrgUnitGalleryResponse,
} from "../lib/api-zod";

const router: IRouter = Router();

// List org units — filter by level and/or parentId
router.get("/org-units", async (req, res): Promise<void> => {
  const query = ListOrgUnitsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { level, parentId } = query.data;

  let dbQuery = db
    .select()
    .from(orgUnitsTable)
    .orderBy(asc(orgUnitsTable.order), asc(orgUnitsTable.name))
    .$dynamic();

  const conditions = [eq(orgUnitsTable.isActive, true)];
  if (level) conditions.push(eq(orgUnitsTable.level, level));
  if (parentId != null) conditions.push(eq(orgUnitsTable.parentId, parentId));

  const rows = await dbQuery.where(and(...conditions));

  res.json(ListOrgUnitsResponse.parse(rows));
});

// Get single org unit with bearers
router.get("/org-units/:id", async (req, res): Promise<void> => {
  const raw = req.params.id;
  const params = GetOrgUnitParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [unit] = await db
    .select()
    .from(orgUnitsTable)
    .where(eq(orgUnitsTable.id, params.data.id));

  if (!unit) {
    res.status(404).json({ error: "Org unit not found" });
    return;
  }

  const bearers = await db
    .select()
    .from(orgUnitBearersTable)
    .where(eq(orgUnitBearersTable.orgUnitId, unit.id))
    .orderBy(asc(orgUnitBearersTable.order));

  const childrenCount = (
    await db
      .select({ id: orgUnitsTable.id })
      .from(orgUnitsTable)
      .where(and(eq(orgUnitsTable.parentId, unit.id), eq(orgUnitsTable.isActive, true)))
  ).length;

  const membersCount = (
    await db
      .select({ id: orgUnitMembersTable.id })
      .from(orgUnitMembersTable)
      .where(and(eq(orgUnitMembersTable.orgUnitId, unit.id), eq(orgUnitMembersTable.isActive, true)))
  ).length;

  res.json(
    GetOrgUnitDetailResponse.parse({
      ...unit,
      bearers,
      childrenCount,
      membersCount,
    })
  );
});

// Get direct children of an org unit
router.get("/org-units/:id/children", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const rows = await db
    .select()
    .from(orgUnitsTable)
    .where(and(eq(orgUnitsTable.parentId, id), eq(orgUnitsTable.isActive, true)))
    .orderBy(asc(orgUnitsTable.order), asc(orgUnitsTable.name));

  res.json(GetOrgUnitChildrenResponse.parse(rows));
});

// Get members of an org unit
router.get("/org-units/:id/members", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const rows = await db
    .select()
    .from(orgUnitMembersTable)
    .where(and(eq(orgUnitMembersTable.orgUnitId, id), eq(orgUnitMembersTable.isActive, true)))
    .orderBy(asc(orgUnitMembersTable.createdAt));

  res.json(GetOrgUnitMembersResponse.parse(rows));
});

// Get campaigns for an org unit
router.get("/org-units/:id/campaigns", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const rows = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.orgUnitId, id));

  res.json(
    GetOrgUnitCampaignsResponse.parse(
      rows.map((r) => ({
        ...r,
        goalAmountInr: r.goalAmountInr ?? 0,
        raisedAmountInr: r.raisedAmountInr ?? 0,
        isUpcoming: r.status === "upcoming",
      }))
    )
  );
});

// Get events for an org unit
router.get("/org-units/:id/events", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const rows = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.orgUnitId, id));

  res.json(
    GetOrgUnitEventsResponse.parse(
      rows.map((r) => ({
        ...r,
        isUpcoming: r.isUpcoming === "true",
        attendeesCount: r.attendeesCount ?? null,
      }))
    )
  );
});

// Get gallery for an org unit
router.get("/org-units/:id/gallery", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const rows = await db
    .select()
    .from(galleryTable)
    .where(eq(galleryTable.orgUnitId, id));

  res.json(GetOrgUnitGalleryResponse.parse(rows));
});

export default router;
