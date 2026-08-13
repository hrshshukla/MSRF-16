import { and, desc, eq, inArray, ne } from "@workspace/db";
import { Router, type IRouter } from "../http";
import { db, feedPostsTable, usersTable } from "@workspace/db";
import { authenticate } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";

const router: IRouter = Router();
const memberRoles = ["member", "volunteer"] as const;

function isMemberRole(role: string): role is (typeof memberRoles)[number] {
  return memberRoles.includes(role as (typeof memberRoles)[number]);
}

function safeMember(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    profileImageUrl: user.profileImageUrl,
    customBadge: user.customBadge,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get(
  "/admin/badges",
  authenticate,
  requireRole("super_admin"),
  async (_req, res): Promise<void> => {
    const users = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));

    res.json({ members: users.map(safeMember) });
  },
);

router.patch(
  "/admin/members/:id/badge",
  authenticate,
  requireRole("super_admin"),
  async (req, res): Promise<void> => {
    const memberId = Number(req.params.id);
    const badge = req.body?.badge;

    if (!Number.isInteger(memberId) || memberId <= 0) {
      res.status(400).json({ error: "Invalid member ID" });
      return;
    }

    if (
      badge !== null &&
      badge !== undefined &&
      (typeof badge !== "string" || badge.trim().length > 40)
    ) {
      res.status(400).json({ error: "Badge must be 40 characters or fewer" });
      return;
    }

    const nextBadge =
      badge === null || badge === undefined || !badge.trim()
        ? null
        : badge.trim();

    const [updatedMember] = await db
      .update(usersTable)
      .set({ customBadge: nextBadge })
      .where(eq(usersTable.id, memberId))
      .returning();

    if (!updatedMember) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    res.json({ member: safeMember(updatedMember) });
  },
);

router.get(
  "/admin/members",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const usersQuery = db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));
    const users = req.user!.role === "super_admin"
      ? await usersQuery
      : await usersQuery.where(inArray(usersTable.role, memberRoles));

    res.json({ members: users.map(safeMember) });
  },
);

router.patch(
  "/admin/members/:id/role",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const memberId = Number(req.params.id);
    if (!Number.isInteger(memberId) || memberId <= 0) {
      res.status(400).json({ error: "Invalid member ID" });
      return;
    }

    const requestedRole = req.body?.role;
    if (requestedRole !== "admin" && requestedRole !== "member") {
      res.status(400).json({ error: "Role must be admin or member" });
      return;
    }

    const [member] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, memberId))
      .limit(1);

    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    if (member.id === req.user!.id) {
      res.status(400).json({ error: "You cannot change your own role" });
      return;
    }

    if (req.user!.role === "admin" && !isMemberRole(member.role)) {
      res.status(403).json({ error: "Admins can only manage member and volunteer accounts" });
      return;
    }

    if (requestedRole === "admin" && !isMemberRole(member.role)) {
      res.status(409).json({ error: "Only member accounts can be promoted" });
      return;
    }

    if (requestedRole === "member" && (member.role === "super_admin" || isMemberRole(member.role))) {
      res.status(409).json({ error: "Only admin accounts can be made members" });
      return;
    }

    const [updatedMember] = await db
      .update(usersTable)
      .set({ role: requestedRole === "admin" ? "admin" : "member" })
      .where(eq(usersTable.id, memberId))
      .returning();

    res.json({ member: safeMember(updatedMember!) });
  },
);

router.delete(
  "/admin/members/:id",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req, res): Promise<void> => {
    const memberId = Number(req.params.id);
    if (!Number.isInteger(memberId) || memberId <= 0) {
      res.status(400).json({ error: "Invalid member ID" });
      return;
    }

    if (memberId === req.user!.id) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }

    const [member] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, memberId))
      .limit(1);

    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    if (member.role === "super_admin") {
      res.status(409).json({ error: "Super user accounts cannot be deleted" });
      return;
    }

    if (req.user!.role === "admin" && !isMemberRole(member.role)) {
      res.status(403).json({ error: "Admins can only delete member and volunteer accounts" });
      return;
    }

    await db.transaction(async (tx) => {
      await tx.delete(feedPostsTable).where(eq(feedPostsTable.authorId, memberId));
      await tx
        .delete(usersTable)
        .where(
          and(
            eq(usersTable.id, memberId),
            ne(usersTable.role, "super_admin"),
          ),
        );
    });

    res.json({ message: "Member account deleted" });
  },
);

export default router;