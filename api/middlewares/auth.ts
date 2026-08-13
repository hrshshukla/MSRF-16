import type { Request, Response, NextFunction } from "../http";
import { verifyAccessToken, type UserRole } from "../lib/jwt";

export interface AuthUser {
  id: number;
  role: UserRole;
  orgUnitId: number | null;
}

// Augment Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Requires a valid Bearer JWT. Returns 401 if missing/invalid. */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      orgUnitId: payload.orgUnitId,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Attaches user if a valid Bearer JWT is present; does NOT reject missing tokens. */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        role: payload.role,
        orgUnitId: payload.orgUnitId,
      };
    } catch {
      // ok — continue without user
    }
  }
  next();
}
