import type { UserRole } from "./jwt";

/** Numeric hierarchy level — higher = more authority. */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 90,
  volunteer: 10,
  member: 10,
};

export type Permission =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "volunteers:read"
  | "volunteers:approve"
  | "campaigns:read"
  | "campaigns:write"
  | "campaigns:delete"
  | "events:read"
  | "events:write"
  | "events:delete"
  | "donations:read"
  | "donations:write"
  | "content:read"
  | "content:write"
  | "content:delete"
  | "org-units:read"
  | "org-units:write"
  | "reports:read"
  | "admin:access";

const ALL_PERMISSIONS: Permission[] = [
  "users:read", "users:write", "users:delete",
  "volunteers:read", "volunteers:approve",
  "campaigns:read", "campaigns:write", "campaigns:delete",
  "events:read", "events:write", "events:delete",
  "donations:read", "donations:write",
  "content:read", "content:write", "content:delete",
  "org-units:read", "org-units:write",
  "reports:read", "admin:access",
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: ALL_PERMISSIONS,

  admin: ALL_PERMISSIONS,

  member: [
    "campaigns:read",
    "events:read",
    "content:read",
  ],

  volunteer: [
    "campaigns:read",
    "events:read",
    "content:read",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasMinRole(role: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
}

export { ROLE_PERMISSIONS };
export type { UserRole };
