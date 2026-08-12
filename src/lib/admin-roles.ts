// Edge-safe role constants (no Node.js dependencies)
export const ROLE_HIERARCHY: Record<string, number> = {
  USER: 0,
  MODERATOR: 1,
  CONTENT_MANAGER: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
};

export type AdminRole = "MODERATOR" | "CONTENT_MANAGER" | "ADMIN" | "SUPERADMIN";

// Roles allowed to access the admin panel
export const ADMIN_ROLES: AdminRole[] = ["MODERATOR", "CONTENT_MANAGER", "ADMIN", "SUPERADMIN"];

// Roles allowed to manage users (only admins+)
export const USER_MANAGEMENT_ROLES: AdminRole[] = ["ADMIN", "SUPERADMIN"];

// Roles allowed to manage content (content managers+)
export const CONTENT_MANAGEMENT_ROLES: AdminRole[] = ["CONTENT_MANAGER", "ADMIN", "SUPERADMIN"];

// Roles allowed to manage featured content (admins+)
export const FEATURED_MANAGEMENT_ROLES: AdminRole[] = ["ADMIN", "SUPERADMIN"];

// Roles allowed to manage homepage rows (admins+)
export const HOMEPAGE_MANAGEMENT_ROLES: AdminRole[] = ["ADMIN", "SUPERADMIN"];

export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

export function hasMinRole(userRole: string, minRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const minLevel = ROLE_HIERARCHY[minRole] ?? 0;
  return userLevel >= minLevel;
}