import { Router, type IRouter } from "../http";
import { count, desc, isNull, eq } from "@workspace/db";
import { db, contactsTable } from "@workspace/db";
import {
  ListContactMessagesResponse,
  MarkContactMessagesReadResponse,
  SubmitContactBody,
  SubmitContactResponse,
  ToggleFeedPostLikeParams,
} from "../lib/api-zod";
import { authenticate } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";

const router: IRouter = Router();

router.get(
  "/contact/messages",
  authenticate,
  requireRole("admin", "super_admin"),
  async (_req, res): Promise<void> => {
    const messages = await db
      .select()
      .from(contactsTable)
      .orderBy(desc(contactsTable.createdAt));

    res.json(ListContactMessagesResponse.parse(messages));
  },
);

router.get(
  "/contact/messages/unread-count",
  authenticate,
  requireRole("admin", "super_admin"),
  async (_req, res): Promise<void> => {
    const [result] = await db
      .select({ count: count() })
      .from(contactsTable)
      .where(isNull(contactsTable.readAt));

    res.json({ count: Number(result?.count ?? 0) });
  },
);

router.post(
  "/contact/messages/read",
  authenticate,
  requireRole("admin", "super_admin"),
  async (_req, res): Promise<void> => {
    const updated = await db
      .update(contactsTable)
      .set({ readAt: new Date() })
      .where(isNull(contactsTable.readAt))
      .returning({ id: contactsTable.id });

    res.json(MarkContactMessagesReadResponse.parse({ success: true, readCount: updated.length }));
  },
);

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SubmitContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.insert(contactsTable).values({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  res.status(201).json(
    SubmitContactResponse.parse({
      success: true,
      message: "Thank you for contacting us. We will get back to you soon. Jai Mahakal!",
    })
  );
});

router.delete(
  "/contact/messages/:id",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const parsed = ToggleFeedPostLikeParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [message] = await db
      .select({ id: contactsTable.id })
      .from(contactsTable)
      .where(eq(contactsTable.id, parsed.data.id));

    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    await db.delete(contactsTable).where(eq(contactsTable.id, parsed.data.id));
    res.status(204).send();
  },
);

export default router;
