import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { desc, eq, sql } from "@workspace/db";
import {
  campaignsTable,
  db,
  donationsTable,
  usersTable,
} from "@workspace/db";
import { Router, HttpError, type IRouter } from "../http";
import { optionalAuthenticate } from "../middlewares/auth";

const router: IRouter = Router();
const RAZORPAY_API = "https://api.razorpay.com/v1";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
};

type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
};

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new HttpError(503, "Online donations are not configured yet.");
  }
  return { keyId, keySecret };
}

async function razorpayRequest<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${authorization}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const providerError = await response.text();
    console.error("Razorpay API request failed", {
      path,
      status: response.status,
      response: providerError.slice(0, 500),
    });
    throw new HttpError(502, "Razorpay could not process this donation.");
  }

  return response.json() as Promise<T>;
}

function readPositiveInteger(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isInteger(amount) && amount > 0 ? amount : null;
}

function readText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function signatureMatches(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

router.post(
  "/payments/razorpay/order",
  optionalAuthenticate,
  async (req, res): Promise<void> => {
    const campaignId = readPositiveInteger(req.body?.campaignId);
    const amountInr = readPositiveInteger(req.body?.amountInr);

    if (!campaignId || !amountInr) {
      res.status(400).json({ error: "A valid campaign and donation amount are required." });
      return;
    }

    const [campaign] = await db
      .select({
        id: campaignsTable.id,
        title: campaignsTable.title,
        goalAmountInr: campaignsTable.goalAmountInr,
        raisedAmountInr: campaignsTable.raisedAmountInr,
        status: campaignsTable.status,
      })
      .from(campaignsTable)
      .where(eq(campaignsTable.id, campaignId))
      .limit(1);

    if (!campaign) {
      res.status(404).json({ error: "Campaign not found." });
      return;
    }
    if (campaign.status !== "active") {
      res.status(400).json({ error: "This campaign is not accepting donations." });
      return;
    }

    const order = await razorpayRequest<RazorpayOrder>("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: amountInr * 100,
        currency: "INR",
        receipt: `donation-${campaignId}-${randomUUID()}`,
        notes: {
          campaignId: String(campaignId),
          campaignTitle: campaign.title,
        },
      }),
    });

    res.json({
      keyId: getRazorpayCredentials().keyId,
      orderId: order.id,
      amountInr,
      amountInPaisa: order.amount,
      currency: order.currency,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        raisedAmountInr: campaign.raisedAmountInr,
        goalAmountInr: campaign.goalAmountInr,
      },
    });
  },
);

router.post(
  "/payments/razorpay/verify",
  optionalAuthenticate,
  async (req, res): Promise<void> => {
    const campaignId = readPositiveInteger(req.body?.campaignId);
    const orderId = readText(req.body?.razorpayOrderId, 100);
    const paymentId = readText(req.body?.razorpayPaymentId, 100);
    const signature = readText(req.body?.razorpaySignature, 200);
    const donorName = readText(req.body?.donorName, 120);
    const donorEmail = readText(req.body?.donorEmail, 240) || null;

    if (!campaignId || !orderId || !paymentId || !signature || !donorName) {
      res.status(400).json({ error: "Payment and donor details are required." });
      return;
    }
    if (donorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }

    const { keySecret } = getRazorpayCredentials();
    if (!signatureMatches(orderId, paymentId, signature, keySecret)) {
      res.status(400).json({ error: "Payment verification failed." });
      return;
    }

    const [order, payment] = await Promise.all([
      razorpayRequest<RazorpayOrder>(`/orders/${encodeURIComponent(orderId)}`, { method: "GET" }),
      razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`, { method: "GET" }),
    ]);

    if (
      order.id !== orderId ||
      order.currency !== "INR" ||
      order.notes?.campaignId !== String(campaignId) ||
      payment.order_id !== orderId ||
      payment.amount !== order.amount ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      res.status(400).json({ error: "This payment could not be confirmed as successful." });
      return;
    }

    const amountInr = order.amount / 100;
    if (!Number.isInteger(amountInr) || amountInr <= 0) {
      res.status(400).json({ error: "The payment amount is invalid." });
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: donationsTable.id,
          amountInr: donationsTable.amountInr,
          campaignId: donationsTable.campaignId,
        })
        .from(donationsTable)
        .where(eq(donationsTable.paymentReference, paymentId))
        .limit(1);

      if (existing) {
        if (existing.campaignId !== campaignId) {
          throw new HttpError(400, "This payment is linked to a different campaign.");
        }
        const [campaign] = await tx
          .select({
            id: campaignsTable.id,
            raisedAmountInr: campaignsTable.raisedAmountInr,
            goalAmountInr: campaignsTable.goalAmountInr,
          })
          .from(campaignsTable)
          .where(eq(campaignsTable.id, campaignId))
          .limit(1);
        return { donation: existing, campaign, duplicate: true };
      }

      const [campaign] = await tx
        .select({ id: campaignsTable.id })
        .from(campaignsTable)
        .where(eq(campaignsTable.id, campaignId))
        .limit(1);
      if (!campaign) {
        throw new HttpError(404, "Campaign not found.");
      }

      const [donation] = await tx
        .insert(donationsTable)
        .values({
          userId: req.user?.id ?? null,
          campaignId,
          amountInr,
          donorName,
          donorEmail,
          paymentReference: paymentId,
        })
        .returning({
          id: donationsTable.id,
          amountInr: donationsTable.amountInr,
          campaignId: donationsTable.campaignId,
        });

      const [updatedCampaign] = await tx
        .update(campaignsTable)
        .set({
          raisedAmountInr: sql`${campaignsTable.raisedAmountInr} + ${amountInr}`,
        })
        .where(eq(campaignsTable.id, campaignId))
        .returning({
          id: campaignsTable.id,
          raisedAmountInr: campaignsTable.raisedAmountInr,
          goalAmountInr: campaignsTable.goalAmountInr,
        });

      return { donation, campaign: updatedCampaign, duplicate: false };
    });

    res.json({
      success: true,
      duplicate: result.duplicate,
      donation: result.donation,
      campaign: result.campaign,
    });
  },
);

router.get("/payments/campaigns/:id/donors", async (req, res): Promise<void> => {
  const campaignId = readPositiveInteger(req.params.id);
  if (!campaignId) {
    res.status(400).json({ error: "Invalid campaign ID." });
    return;
  }

  const [campaign] = await db
    .select({
      id: campaignsTable.id,
      title: campaignsTable.title,
      goalAmountInr: campaignsTable.goalAmountInr,
      raisedAmountInr: campaignsTable.raisedAmountInr,
    })
    .from(campaignsTable)
    .where(eq(campaignsTable.id, campaignId))
    .limit(1);
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found." });
    return;
  }

  const donors = await db
    .select({
      id: donationsTable.id,
      name: sql<string>`coalesce(${donationsTable.donorName}, ${usersTable.name}, 'Anonymous donor')`,
      amount: donationsTable.amountInr,
      donatedAt: donationsTable.donatedAt,
    })
    .from(donationsTable)
    .leftJoin(usersTable, eq(usersTable.id, donationsTable.userId))
    .where(eq(donationsTable.campaignId, campaignId))
    .orderBy(desc(donationsTable.donatedAt));

  res.json({
    campaign,
    donors: donors.map((donor) => ({
      ...donor,
      donatedAt: donor.donatedAt.toISOString(),
    })),
  });
});

export default router;