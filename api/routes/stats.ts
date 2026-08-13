import { Router, type IRouter } from "../http";
import { db } from "@workspace/db";
import { campaignsTable, eventsTable, projectsTable, teamTable } from "@workspace/db";
import { GetStatsResponse } from "../lib/api-zod";
import { sql } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const [campaigns] = await db.select({ count: sql<number>`count(*)::int` }).from(campaignsTable);
  const [events] = await db.select({ count: sql<number>`count(*)::int` }).from(eventsTable);
  const [team] = await db.select({ count: sql<number>`count(*)::int` }).from(teamTable);
  const [active] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(campaignsTable)
    .where(sql`status = 'active'`);

  const stats = GetStatsResponse.parse({
    totalMembers: (team.count ?? 0) * 150,
    totalCampaigns: campaigns.count ?? 0,
    totalEvents: events.count ?? 0,
    totalDonationsInr: 5000000,
    activeCampaigns: active.count ?? 0,
    statesReached: 12,
    volunteersServed: 2500,
    yearsOfSeva: 8,
  });

  res.json(stats);
});

export default router;
