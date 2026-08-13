import { and, desc, eq, sql } from "@workspace/db";
import { Router, type IRouter } from "../http";
import {
  db,
  donationsTable,
  eventParticipationsTable,
  eventsTable,
  feedPostsTable,
  campaignsTable,
} from "@workspace/db";
import { authenticate } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/account/dashboard", authenticate, async (req, res): Promise<void> => {
  const [donationSummary, postSummary, donations, participations] = await Promise.all([
    db
      .select({
        totalAmountInr: sql<number>`coalesce(sum(${donationsTable.amountInr}), 0)::int`,
        donationCount: sql<number>`count(*)::int`,
      })
      .from(donationsTable)
      .where(eq(donationsTable.userId, req.user!.id)),
    db
      .select({ postCount: sql<number>`count(*)::int` })
      .from(feedPostsTable)
      .where(eq(feedPostsTable.authorId, req.user!.id)),
    db
      .select({
        id: donationsTable.id,
        amountInr: donationsTable.amountInr,
        donatedAt: donationsTable.donatedAt,
        campaignTitle: campaignsTable.title,
        location: campaignsTable.location,
      })
      .from(donationsTable)
      .leftJoin(campaignsTable, eq(campaignsTable.id, donationsTable.campaignId))
      .where(eq(donationsTable.userId, req.user!.id))
      .orderBy(desc(donationsTable.donatedAt)),
    db
      .select({
        id: eventParticipationsTable.id,
        status: eventParticipationsTable.status,
        participatedAt: eventParticipationsTable.participatedAt,
        eventId: eventsTable.id,
        eventTitle: eventsTable.title,
        eventDate: eventsTable.date,
        location: eventsTable.location,
      })
      .from(eventParticipationsTable)
      .innerJoin(eventsTable, eq(eventsTable.id, eventParticipationsTable.eventId))
      .where(eq(eventParticipationsTable.userId, req.user!.id))
      .orderBy(desc(eventParticipationsTable.participatedAt)),
  ]);

  res.json({
    summary: {
      totalDonatedInr: donationSummary[0]?.totalAmountInr ?? 0,
      donationCount: donationSummary[0]?.donationCount ?? 0,
      participationCount: participations.length,
      postCount: postSummary[0]?.postCount ?? 0,
    },
    donations: donations.map((donation) => ({
      ...donation,
      donatedAt: donation.donatedAt.toISOString(),
    })),
    participations: participations.map((participation) => ({
      ...participation,
      participatedAt: participation.participatedAt.toISOString(),
    })),
  });
});

export default router;