import type { AuthUser } from "@/lib/auth-context";

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

export function profileImageSrc(url: string | null) {
  return url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) ? url : null;
}

export function memberTypeLabel(role: AuthUser["role"]): "Member" | "Volunteer" | "Admin" | "Super user" {
  if (role === "super_admin") return "Super user";
  if (role === "admin") return "Admin";
  if (role === "volunteer") return "Volunteer";
  return "Member";
}

export function memberDisplayLabel(user: Pick<AuthUser, "role" | "customBadge">) {
  return user.customBadge || memberTypeLabel(user.role);
}

export function memberId(user: AuthUser) {
  return `MSRF-${String(user.id).padStart(6, "0")}`;
}