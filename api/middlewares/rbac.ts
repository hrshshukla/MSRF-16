import type { Request, Response, NextFunction } from "../http";
import {
  hasPermission,
  hasMinRole,
  ROLE_HIERARCHY,
  type Permission,
  type UserRole,
} from "../lib/permissions";

/** Requires ALL listed permissions. Returns 401/403 otherwise. */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const granted = permissions.every((p) =>
      hasPermission(req.user!.role, p),
    );
    if (!granted) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

/** Requires the user to have one of the listed exact roles. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient role" });
      return;
    }
    next();
  };
}

/** Requires the user's role to be at or above minRole in the hierarchy. */
export function requireMinRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!hasMinRole(req.user.role, minRole)) {
      res
        .status(403)
        .json({
          error: `This action requires at least ${minRole} level access`,
        });
      return;
    }
    next();
  };
}

/**
 * Restricts access to org-unit scoped data.
 * A user can only access data for their own org unit and below,
 * unless they are admin or super_admin (unrestricted).
 */
export function requireOrgUnitAccess(getOrgUnitId: (req: Request) => number | null) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Admin-level+ have unrestricted access
    if (ROLE_HIERARCHY[req.user.role] >= ROLE_HIERARCHY["admin"]) {
      next();
      return;
    }

    const targetOrgUnitId = getOrgUnitId(req);
    if (targetOrgUnitId !== null && req.user.orgUnitId !== targetOrgUnitId) {
      res.status(403).json({ error: "Access restricted to your org unit" });
      return;
    }

    next();
  };
}
