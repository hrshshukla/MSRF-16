import { type ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth, type UserRole } from "../lib/auth-context";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Redirect here if not authenticated. Defaults to /login */
  redirectTo?: string;
  /** If set, user must have at least this role level */
  minRole?: UserRole;
  /** If set, user must have one of these exact roles */
  roles?: UserRole[];
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 90,
  volunteer: 10,
  member: 10,
};

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  minRole,
  roles,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to={redirectTo} />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Redirect to="/unauthorized" />;
  }

  if (minRole && user) {
    const userLevel = ROLE_HIERARCHY[user.role];
    const minLevel = ROLE_HIERARCHY[minRole];
    if (userLevel < minLevel) {
      return <Redirect to="/unauthorized" />;
    }
  }

  return <>{children}</>;
}
