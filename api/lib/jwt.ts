import jwt from "jsonwebtoken";

export type UserRole =
  | "super_admin"
  | "admin"
  | "volunteer"
  | "member";

export interface AccessTokenPayload {
  sub: number; // userId
  role: UserRole;
  orgUnitId: number | null;
}

export interface RefreshTokenPayload {
  sub: number; // userId
  jti: string; // unique token id (db token row id as string)
}

const ACCESS_SECRET =
  process.env["JWT_SECRET"] ??
  (() => {
    if (process.env["NODE_ENV"] === "production")
      throw new Error("JWT_SECRET must be set in production");
    return "dev-jwt-secret-change-in-production";
  })();

const REFRESH_SECRET =
  process.env["JWT_REFRESH_SECRET"] ??
  (() => {
    if (process.env["NODE_ENV"] === "production")
      throw new Error("JWT_REFRESH_SECRET must be set in production");
    return "dev-jwt-refresh-secret-change-in-production";
  })();

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";
const REFRESH_EXPIRY_REMEMBER_ME = "30d";

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function signRefreshToken(
  payload: RefreshTokenPayload,
  rememberMe = false,
): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: rememberMe ? REFRESH_EXPIRY_REMEMBER_ME : REFRESH_EXPIRY,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as unknown as RefreshTokenPayload;
}

/** Returns the expiry Date for a new refresh token. */
export function refreshTokenExpiry(rememberMe = false): Date {
  const ms = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}
