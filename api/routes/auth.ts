import { Router, type IRouter } from "../http";
import { eq, and, gt, isNull } from "@workspace/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import {
  db,
  usersTable,
  refreshTokensTable,
  passwordResetTokensTable,
} from "@workspace/db";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiry,
  type UserRole,
} from "../lib/jwt";
import { authenticate } from "../middlewares/auth";
import { ImageKitService, MediaConfigurationError } from "../lib/mediaProvider";
import {
  roleForRegistration,
  synchronizeUserRole,
} from "../lib/superAdminBootstrap";

const router: IRouter = Router();
const THOUGHT_TEMPLATE_COUNT = 15;
const MAX_PROFILE_DESCRIPTION_LENGTH = 150;
const DEFAULT_CITY = "Nagpur";

function randomThoughtTemplateId(): number {
  return Math.floor(Math.random() * THOUGHT_TEMPLATE_COUNT);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function issueTokens(
  user: { id: number; role: UserRole; orgUnitId: number | null },
  rememberMe = false,
) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    orgUnitId: user.orgUnitId,
  });
  const refreshToken = signRefreshToken({ sub: user.id, jti: "" }, rememberMe);
  return { accessToken, refreshToken };
}

async function saveRefreshToken(
  userId: number,
  token: string,
  rememberMe = false,
  deviceInfo?: string,
): Promise<number> {
  const [row] = await db
    .insert(refreshTokensTable)
    .values({
      userId,
      token,
      expiresAt: refreshTokenExpiry(rememberMe),
      deviceInfo,
    })
    .returning({ id: refreshTokensTable.id });
  return row!.id;
}

function safeUser(user: typeof usersTable.$inferSelect) {
  // Never expose passwordHash to the client
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}

async function ensureCityIfMissing(user: typeof usersTable.$inferSelect) {
  if (user.city) return user;

  const [updatedUser] = await db
    .update(usersTable)
    .set({ city: DEFAULT_CITY, cityDetectedAutomatically: false })
    .where(and(eq(usersTable.id, user.id), isNull(usersTable.city)))
    .returning();
  return updatedUser ?? user;
}

// ─── Register ────────────────────────────────────────────────────────────────

router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password, phone } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  };

  const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

  if (!name?.trim() || !normalizedEmail || !password || !phone) {
    res.status(400).json({ error: "name, email, phone and password are required" });
    return;
  }

  const normalizedPhone = phone.trim();
  if (!/^\d{10}$/.test(normalizedPhone)) {
    res.status(400).json({ error: "Phone number must contain exactly 10 digits" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const [user] = await db
      .insert(usersTable)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
        role: roleForRegistration(normalizedEmail),
        thoughtTemplateId: randomThoughtTemplateId(),
        city: DEFAULT_CITY,
        cityDetectedAutomatically: false,
      })
      .returning();

    res.status(201).json({ user: safeUser(user!) });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      const constraint =
        "constraint" in error && typeof error.constraint === "string"
          ? error.constraint
          : "";
      res.status(409).json({
        error: constraint.includes("phone")
          ? "Phone number already registered"
          : "Email already registered",
      });
      return;
    }

    throw error;
  }
});

// ─── Email + Password Login ──────────────────────────────────────────────────

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password, rememberMe = false, deviceInfo } = req.body as {
    email?: string;
    password?: string;
    rememberMe?: boolean;
    deviceInfo?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: "Account is disabled. Contact support." });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const synchronizedUser = await ensureCityIfMissing(await synchronizeUserRole(user));

  const { accessToken, refreshToken } = issueTokens(
    {
      id: synchronizedUser.id,
      role: synchronizedUser.role as UserRole,
      orgUnitId: synchronizedUser.orgUnitId,
    },
    rememberMe,
  );
  await saveRefreshToken(synchronizedUser.id, refreshToken, rememberMe, deviceInfo);

  res.json({
    accessToken,
    refreshToken,
    user: safeUser(synchronizedUser),
  });
});

// ─── Refresh Access Token ─────────────────────────────────────────────────────

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  // Check the token exists and isn't revoked
  const [tokenRow] = await db
    .select()
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.token, refreshToken),
        eq(refreshTokensTable.isRevoked, false),
        gt(refreshTokensTable.expiresAt, new Date()),
      ),
    );

  if (!tokenRow) {
    res.status(401).json({ error: "Refresh token revoked or expired" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.sub));

  if (!user || !user.isActive) {
    res.status(403).json({ error: "Account unavailable" });
    return;
  }

  const synchronizedUser = await ensureCityIfMissing(await synchronizeUserRole(user));

  // Rotate: revoke old, issue new
  await db
    .update(refreshTokensTable)
    .set({ isRevoked: true })
    .where(eq(refreshTokensTable.id, tokenRow.id));

  const newAccessToken = signAccessToken({
    sub: synchronizedUser.id,
    role: synchronizedUser.role as UserRole,
    orgUnitId: synchronizedUser.orgUnitId,
  });
  const newRefreshToken = signRefreshToken({ sub: synchronizedUser.id, jti: "" });
  await saveRefreshToken(
    synchronizedUser.id,
    newRefreshToken,
    false,
    tokenRow.deviceInfo ?? undefined,
  );

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

router.post("/auth/logout", async (req, res): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (refreshToken) {
    await db
      .update(refreshTokensTable)
      .set({ isRevoked: true })
      .where(eq(refreshTokensTable.token, refreshToken));
  }

  res.json({ message: "Logged out successfully" });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const normalized = email.toLowerCase().trim();
  const [user] = await db
    .select({ id: usersTable.id, isActive: usersTable.isActive })
    .from(usersTable)
    .where(eq(usersTable.email, normalized));

  // Always respond 200 to prevent email enumeration
  if (!user || !user.isActive) {
    res.json({ message: "If that email is registered, a reset link has been sent" });
    return;
  }

  // Invalidate old reset tokens
  await db
    .update(passwordResetTokensTable)
    .set({ isUsed: true })
    .where(
      and(
        eq(passwordResetTokensTable.userId, user.id),
        eq(passwordResetTokensTable.isUsed, false),
      ),
    );

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokensTable).values({
    userId: user.id,
    token,
    expiresAt,
  });

  // In dev: log the reset token; in prod: send email
  if (process.env["NODE_ENV"] !== "production") {
    console.log(`[PASSWORD RESET] token for ${normalized}: ${token}  (expires in 1 hour)`);
  } else {
    // TODO: send reset email with link: `${APP_URL}/reset-password?token=${token}`
    console.log(`[PASSWORD RESET] would send email to ${normalized}`);
  }

  res.json({ message: "If that email is registered, a reset link has been sent" });
});

// ─── Reset Password ───────────────────────────────────────────────────────────

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || !password) {
    res.status(400).json({ error: "token and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [resetRow] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.token, token),
        eq(passwordResetTokensTable.isUsed, false),
        gt(passwordResetTokensTable.expiresAt, new Date()),
      ),
    );

  if (!resetRow) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, resetRow.userId));

  await db
    .update(passwordResetTokensTable)
    .set({ isUsed: true })
    .where(eq(passwordResetTokensTable.id, resetRow.id));

  // Revoke all refresh tokens for security
  await db
    .update(refreshTokensTable)
    .set({ isRevoked: true })
    .where(eq(refreshTokensTable.userId, resetRow.userId));

  res.json({ message: "Password reset successfully. Please log in." });
});

// ─── Get Current User ─────────────────────────────────────────────────────────

router.get("/auth/me", authenticate, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id));

  if (!user || !user.isActive) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const synchronizedUser = await ensureCityIfMissing(await synchronizeUserRole(user));
  const accessToken =
    synchronizedUser.role !== req.user!.role
      ? signAccessToken({
          sub: synchronizedUser.id,
          role: synchronizedUser.role as UserRole,
          orgUnitId: synchronizedUser.orgUnitId,
        })
      : undefined;

  res.json({
    user: safeUser(synchronizedUser),
    ...(accessToken ? { accessToken } : {}),
  });
});

// ─── Update Current User Profile ─────────────────────────────────────────────

router.patch("/auth/me", authenticate, async (req, res): Promise<void> => {
  const { name, email, phone, profileImageUrl, description, city } = req.body as {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    profileImageUrl?: unknown;
    description?: unknown;
    city?: unknown;
  };

  if (email !== undefined || phone !== undefined) {
    res.status(400).json({ error: "Email address and phone number cannot be changed" });
    return;
  }

  const [currentUser] = await db
    .select({ city: usersTable.city, cityDetectedAutomatically: usersTable.cityDetectedAutomatically })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id));

  if (!currentUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (
    (name !== undefined && (typeof name !== "string" || !name.trim())) ||
    (
      profileImageUrl !== undefined &&
      profileImageUrl !== null &&
      typeof profileImageUrl !== "string"
    )
    || (
      description !== undefined &&
      description !== null &&
      (typeof description !== "string" || description.length > MAX_PROFILE_DESCRIPTION_LENGTH)
    )
    || (
      city !== undefined &&
      city !== null &&
      (typeof city !== "string" || city.length > 120)
    )
  ) {
    res.status(400).json({ error: "Invalid profile details" });
    return;
  }

  const updates: {
    name?: string;
    email?: string;
    phone?: string | null;
    profileImageUrl?: string | null;
    description?: string | null;
    city?: string | null;
    cityDetectedAutomatically?: boolean;
  } = {};

  if (name !== undefined) updates.name = (name as string).trim();
  if (profileImageUrl !== undefined) {
    updates.profileImageUrl =
      profileImageUrl === null || !(profileImageUrl as string).trim()
        ? null
        : (profileImageUrl as string).trim();
  }
  if (description !== undefined) {
    updates.description =
      description === null || !(description as string).trim()
        ? null
        : (description as string).trim();
  }
  if (city !== undefined) {
    const nextCity = city === null || !(city as string).trim() ? DEFAULT_CITY : (city as string).trim();
    updates.city = nextCity;
    updates.cityDetectedAutomatically =
      nextCity === currentUser.city
        ? currentUser.cityDetectedAutomatically
        : false;
  }

  if (updates.profileImageUrl) {
    try {
      const media = new ImageKitService();
      if (!media.validatePublicUrl(updates.profileImageUrl, req.user!.id, "profile")) {
        res.status(400).json({ error: "Invalid profile image URL" });
        return;
      }
    } catch (error) {
      if (error instanceof MediaConfigurationError) {
        res.status(503).json({ error: "Media storage is not configured." });
        return;
      }
      throw error;
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No profile changes provided" });
    return;
  }

  const [updatedUser] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  if (!updatedUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user: safeUser(updatedUser) });
});

router.post("/auth/change-password", authenticate, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: unknown;
    newPassword?: unknown;
  };

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    res.status(400).json({ error: "Current password and new password are required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id, passwordHash: usersTable.passwordHash })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id));

  if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, req.user!.id));
  await db
    .update(refreshTokensTable)
    .set({ isRevoked: true })
    .where(eq(refreshTokensTable.userId, req.user!.id));

  res.json({ message: "Password updated successfully. Please sign in again on other devices." });
});

export default router;
