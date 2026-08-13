import { Router, type IRouter } from "../http";
import { asc, inArray, sql } from "@workspace/db";
import { db, usersTable } from "@workspace/db";
import { ListTeamResponse } from "../lib/api-zod";

const router: IRouter = Router();

router.get("/team", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      profileImageUrl: usersTable.profileImageUrl,
       customBadge: usersTable.customBadge,
      description: usersTable.description,
      thoughtTemplateId: usersTable.thoughtTemplateId,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
      .where(inArray(usersTable.role, ["super_admin", "admin", "volunteer", "member"]))
    .orderBy(
       asc(
         sql`case
           when ${usersTable.role} = 'super_admin' then 0
           when ${usersTable.role} = 'admin' then 1
           when ${usersTable.role} = 'volunteer' then 2
           else 3
         end`,
       ),
      asc(usersTable.createdAt),
    );

  res.json(
    ListTeamResponse.parse(
      rows.map((member, order) => ({
        id: member.id,
        name: member.name,
         role:
          member.role === "admin" || member.role === "super_admin"
            ? "Admin"
            : member.role === "volunteer"
              ? "Volunteer"
              : "Member",
         customBadge: member.customBadge,
        bio: member.description ?? null,
        thoughtTemplateId: member.thoughtTemplateId ?? member.id % 15,
        imageUrl: member.profileImageUrl ?? null,
        order,
        category: "volunteer" as const,
      }))
    )
  );
});

export default router;
