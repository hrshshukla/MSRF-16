import { and, count, desc, eq, inArray, isNull } from "@workspace/db";
import { Router, type IRouter } from "../http";
import {
  db,
  usersTable,
  volunteerApplicationsTable,
} from "@workspace/db";
import { authenticate } from "../middlewares/auth";
import { requirePermission } from "../middlewares/rbac";

const router: IRouter = Router();

function cleanText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new Error(`${field} is required`);
  }
  const text = value.trim();
  if (!text) {
    throw new Error(`${field} is required`);
  }
  if (text.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or fewer`);
  }
  return text;
}

router.post(
  "/volunteer-applications",
  authenticate,
  async (req, res): Promise<void> => {
    let skills: string;
    let message: string;
    try {
      skills = cleanText(req.body?.skills, "Skills and experience", 2000);
      message = cleanText(req.body?.message, "Why you want to volunteer", 4000);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid application",
      });
      return;
    }

    const [existing] = await db
      .select({ id: volunteerApplicationsTable.id, status: volunteerApplicationsTable.status })
      .from(volunteerApplicationsTable)
      .where(
        and(
          eq(volunteerApplicationsTable.userId, req.user!.id),
        ),
      )
      .orderBy(desc(volunteerApplicationsTable.createdAt))
      .limit(1);

    const [userState] = await db
      .select({
        volunteerApplicationStatus: usersTable.volunteerApplicationStatus,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);

    if (existing || userState?.volunteerApplicationStatus) {
      const existingStatus = existing?.status ?? userState?.volunteerApplicationStatus;
      res.status(409).json({
        error:
          existingStatus === "approved"
            ? "Your volunteer application has already been approved."
            : existingStatus === "rejected"
              ? "Your volunteer application has already been reviewed."
              : "You already have a volunteer application under review.",
      });
      return;
    }

    const [application] = await db
      .insert(volunteerApplicationsTable)
      .values({
        userId: req.user!.id,
        skills,
        message,
      })
      .returning({
        id: volunteerApplicationsTable.id,
        status: volunteerApplicationsTable.status,
      });

    await db
      .update(usersTable)
      .set({
        volunteerApplicationStatus: "pending",
        volunteerApplicationSubmittedAt: new Date(),
        volunteerApplicationReviewedAt: null,
      })
      .where(eq(usersTable.id, req.user!.id));

    res.status(201).json({ application });
  },
);

router.get(
  "/volunteer-applications/me",
  authenticate,
  async (req, res): Promise<void> => {
    const [application] = await db
      .select({
        id: volunteerApplicationsTable.id,
        status: volunteerApplicationsTable.status,
        createdAt: volunteerApplicationsTable.createdAt,
        reviewedAt: volunteerApplicationsTable.reviewedAt,
      })
      .from(volunteerApplicationsTable)
      .where(eq(volunteerApplicationsTable.userId, req.user!.id))
      .orderBy(desc(volunteerApplicationsTable.createdAt))
      .limit(1);

    if (application) {
      res.json({
        application: {
          ...application,
          createdAt: application.createdAt.toISOString(),
          reviewedAt: application.reviewedAt?.toISOString() ?? null,
        },
      });
      return;
    }

    const [user] = await db
      .select({
        id: usersTable.id,
        volunteerApplicationStatus: usersTable.volunteerApplicationStatus,
        volunteerApplicationSubmittedAt: usersTable.volunteerApplicationSubmittedAt,
        volunteerApplicationReviewedAt: usersTable.volunteerApplicationReviewedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);

    const persistedStatus = user?.volunteerApplicationStatus;
    res.json({
      application: persistedStatus && user?.volunteerApplicationSubmittedAt
        ? {
            id: 0,
            status: persistedStatus,
            createdAt: user.volunteerApplicationSubmittedAt.toISOString(),
            reviewedAt: user.volunteerApplicationReviewedAt?.toISOString() ?? null,
          }
        : null,
    });
  },
);

router.get(
  "/volunteer-applications/unread-count",
  authenticate,
  requirePermission("admin:access"),
  async (_req, res): Promise<void> => {
    const [result] = await db
      .select({ count: count() })
      .from(volunteerApplicationsTable)
      .where(isNull(volunteerApplicationsTable.readAt));

    res.json({ count: Number(result?.count ?? 0) });
  },
);

router.post(
  "/volunteer-applications/read",
  authenticate,
  requirePermission("admin:access"),
  async (_req, res): Promise<void> => {
    const updated = await db
      .update(volunteerApplicationsTable)
      .set({ readAt: new Date() })
      .where(isNull(volunteerApplicationsTable.readAt))
      .returning({ id: volunteerApplicationsTable.id });

    res.json({ success: true, readCount: updated.length });
  },
);

router.get(
  "/volunteer-applications",
  authenticate,
  requirePermission("admin:access"),
  async (_req, res): Promise<void> => {
    const applications = await db
      .select({
        id: volunteerApplicationsTable.id,
        userId: volunteerApplicationsTable.userId,
        applicantName: usersTable.name,
        applicantProfileImageUrl: usersTable.profileImageUrl,
        applicantEmail: usersTable.email,
        applicantPhone: usersTable.phone,
        skills: volunteerApplicationsTable.skills,
        message: volunteerApplicationsTable.message,
        status: volunteerApplicationsTable.status,
        reviewedAt: volunteerApplicationsTable.reviewedAt,
        createdAt: volunteerApplicationsTable.createdAt,
        readAt: volunteerApplicationsTable.readAt,
      })
      .from(volunteerApplicationsTable)
      .innerJoin(usersTable, eq(usersTable.id, volunteerApplicationsTable.userId))
      .where(eq(volunteerApplicationsTable.status, "pending"))
      .orderBy(desc(volunteerApplicationsTable.createdAt));

    const decidedUsers = await db
      .select({
        userId: usersTable.id,
        applicantName: usersTable.name,
        applicantProfileImageUrl: usersTable.profileImageUrl,
        applicantEmail: usersTable.email,
        applicantPhone: usersTable.phone,
        status: usersTable.volunteerApplicationStatus,
        reviewedAt: usersTable.volunteerApplicationReviewedAt,
        createdAt: usersTable.volunteerApplicationSubmittedAt,
      })
      .from(usersTable)
      .where(inArray(usersTable.volunteerApplicationStatus, ["approved", "rejected"]));

    res.json({
      applications: [
        ...applications.map((application) => ({
          ...application,
          reviewedAt: application.reviewedAt?.toISOString() ?? null,
          createdAt: application.createdAt.toISOString(),
          readAt: application.readAt?.toISOString() ?? null,
        })),
        ...decidedUsers
          .filter(
            (application): application is typeof application & {
              status: "approved" | "rejected";
              createdAt: Date;
            } => Boolean(application.status && application.createdAt),
          )
          .map((application) => ({
            id: 0,
            userId: application.userId,
            applicantName: application.applicantName,
            applicantProfileImageUrl: application.applicantProfileImageUrl,
            applicantEmail: application.applicantEmail,
            applicantPhone: application.applicantPhone,
            skills: "",
            message: "",
            status: application.status,
            reviewedAt: application.reviewedAt?.toISOString() ?? null,
            createdAt: application.createdAt.toISOString(),
            readAt: application.reviewedAt?.toISOString() ?? null,
          })),
      ],
    });
  },
);

router.patch(
  "/volunteer-applications/:id",
  authenticate,
  requirePermission("admin:access"),
  async (req, res): Promise<void> => {
    const applicationId = Number(req.params.id);
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      res.status(400).json({ error: "Invalid application ID" });
      return;
    }

    const status = req.body?.status;
    if (status !== "approved" && status !== "rejected") {
      res.status(400).json({ error: "Status must be approved or rejected" });
      return;
    }

    const [pendingApplication] = await db
      .select({
        id: volunteerApplicationsTable.id,
        userId: volunteerApplicationsTable.userId,
      })
      .from(volunteerApplicationsTable)
      .where(
        and(
          eq(volunteerApplicationsTable.id, applicationId),
          eq(volunteerApplicationsTable.status, "pending"),
        ),
      )
      .limit(1);

    if (!pendingApplication) {
      res.status(404).json({ error: "Pending application not found" });
      return;
    }

    const reviewedAt = new Date();
    const [applicant] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, pendingApplication.userId))
      .limit(1);

    if (!applicant) {
      res.status(404).json({ error: "Applicant account not found" });
      return;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({
          volunteerApplicationStatus: status,
          volunteerApplicationReviewedAt: reviewedAt,
          ...(status === "approved" && applicant.role === "member"
            ? { role: "volunteer" as const }
            : {}),
        })
        .where(eq(usersTable.id, applicant.id));

      await tx
        .delete(volunteerApplicationsTable)
        .where(
          and(
            eq(volunteerApplicationsTable.id, applicationId),
            eq(volunteerApplicationsTable.status, "pending"),
          ),
        );
    });

    res.json({ application: { id: applicationId, status } });
  },
);

export default router;