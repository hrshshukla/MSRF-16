import { and, eq, inArray, isNull } from "@workspace/db";
import { db, usersTable, volunteerApplicationsTable } from "@workspace/db";
import type { UserRole } from "./jwt";
import { logger } from "./logger";

const SUPER_ADMIN_EMAIL_ENV = "SUPER_ADMIN_EMAIL";

function configuredEmail(): string | null {
  const value = process.env[SUPER_ADMIN_EMAIL_ENV]?.trim().toLowerCase();
  return value || null;
}

/**
 * Returns the role that should be used when creating an account.
 *
 * The configured email is intentionally read only on the server and is never
 * included in a response or sent to the client.
 */
export function roleForRegistration(email: string): UserRole {
  const normalizedEmail = email.trim().toLowerCase();
  return configuredEmail() === normalizedEmail ? "super_admin" : "member";
}

/**
 * Repairs the configured account if it already exists.
 *
 * Super Admin permissions are role-derived in this application, so restoring
 * the role restores the complete permission set automatically.
 */
export async function bootstrapSuperAdmin(): Promise<void> {
  const email = configuredEmail();

  if (!email) {
    logger.warn(
      `Server configuration is missing ${SUPER_ADMIN_EMAIL_ENV}; Super Admin bootstrap skipped`,
    );
    return;
  }

  const [configuredUser] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!configuredUser) {
    logger.info("Super Admin account not found yet; bootstrap will run again on registration");
    return;
  }

  if (configuredUser.role !== "super_admin") {
    await db
      .update(usersTable)
      .set({ role: "super_admin" })
      .where(eq(usersTable.id, configuredUser.id));

    logger.info({ userId: configuredUser.id }, "Super Admin role repaired");
    return;
  }

  logger.info({ userId: configuredUser.id }, "Super Admin bootstrap verified");
}

/**
 * Keeps accounts approved through the volunteer workflow represented by the
 * dedicated volunteer role. Existing administrators and the Super Admin are
 * intentionally left unchanged.
 */
export async function synchronizeApprovedVolunteerRoles(): Promise<void> {
  const decidedApplications = await db
    .select({
      id: volunteerApplicationsTable.id,
      userId: volunteerApplicationsTable.userId,
      status: volunteerApplicationsTable.status,
      createdAt: volunteerApplicationsTable.createdAt,
      reviewedAt: volunteerApplicationsTable.reviewedAt,
      userRole: usersTable.role,
    })
    .from(volunteerApplicationsTable)
    .innerJoin(usersTable, eq(usersTable.id, volunteerApplicationsTable.userId))
    .where(
      inArray(volunteerApplicationsTable.status, ["approved", "rejected"]),
    );

  if (decidedApplications.length === 0) return;

  await db.transaction(async (tx) => {
    for (const application of decidedApplications) {
      await tx
        .update(usersTable)
        .set({
          volunteerApplicationStatus: application.status,
          volunteerApplicationSubmittedAt: application.createdAt,
          volunteerApplicationReviewedAt: application.reviewedAt,
          ...(application.status === "approved" && application.userRole === "member"
            ? { role: "volunteer" as const }
            : {}),
        })
        .where(eq(usersTable.id, application.userId));
    }

    await tx
      .delete(volunteerApplicationsTable)
      .where(
        inArray(
          volunteerApplicationsTable.id,
          decidedApplications.map(({ id }) => id),
        ),
      );
  });
}

/**
 * Gives legacy accounts a stable default-thought selection without touching
 * their custom description.
 */
export async function synchronizeThoughtTemplateIds(): Promise<void> {
  const usersWithoutTemplate = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(isNull(usersTable.thoughtTemplateId));

  if (usersWithoutTemplate.length === 0) return;

  await db.transaction(async (tx) => {
    for (const user of usersWithoutTemplate) {
      await tx
        .update(usersTable)
        .set({ thoughtTemplateId: user.id % 15 })
        .where(
          and(
            eq(usersTable.id, user.id),
            isNull(usersTable.thoughtTemplateId),
          ),
        );
    }
  });
}

/**
 * Ensures a configured account is never issued a lower role during login.
 * This also repairs an account that was demoted after application startup.
 */
export async function synchronizeSuperAdminRole(
  user: typeof usersTable.$inferSelect,
): Promise<typeof usersTable.$inferSelect> {
  if (roleForRegistration(user.email) !== "super_admin" || user.role === "super_admin") {
    return user;
  }

  const [updatedUser] = await db
    .update(usersTable)
    .set({ role: "super_admin" })
    .where(eq(usersTable.id, user.id))
    .returning();

  if (!updatedUser) {
    throw new Error("Configured Super Admin account could not be synchronized");
  }

  logger.info({ userId: user.id }, "Super Admin role repaired during authentication");
  return updatedUser;
}

/**
 * Promotes a regular member when they have an approved volunteer application.
 * Elevated roles remain authoritative and are never changed by this workflow.
 */
export async function synchronizeApprovedVolunteerRole(
  user: typeof usersTable.$inferSelect,
): Promise<typeof usersTable.$inferSelect> {
  if (
    user.role !== "member" ||
    user.volunteerApplicationStatus !== "approved"
  ) {
    return user;
  }

  const [updatedUser] = await db
    .update(usersTable)
    .set({ role: "volunteer" })
    .where(and(eq(usersTable.id, user.id), eq(usersTable.role, "member")))
    .returning();

  return updatedUser ?? user;
}

export async function synchronizeUserRole(
  user: typeof usersTable.$inferSelect,
): Promise<typeof usersTable.$inferSelect> {
  const superAdminSynchronized = await synchronizeSuperAdminRole(user);
  return synchronizeApprovedVolunteerRole(superAdminSynchronized);
}