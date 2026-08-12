import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";

// Role hierarchy for permission checks
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

/**
 * Authenticates a request and verifies the user has admin-level access.
 * Returns the user object if authorized, or a NextResponse error if not.
 */
export async function requireAdmin(request: Request | NextRequest) {
  // ALWAYS use the admin token specifically for admin API routes
  const user = await getAdminUser(request);
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }

  if (!hasRole(user.role, ADMIN_ROLES)) {
    return { user: null, error: NextResponse.json({ error: "Access denied: Admin privileges required" }, { status: 403 }) };
  }

  return { user, error: null };
}

/**
 * Authenticates and verifies the user has a specific role or higher.
 */
export async function requireRole(request: Request | NextRequest, allowedRoles: string[]) {
  const { user, error } = await requireAdmin(request);
  if (error) return { user: null, error };

  if (!hasRole(user!.role, allowedRoles)) {
    return { user: null, error: NextResponse.json({ error: `Access denied: Requires ${allowedRoles.join(" or ")} role` }, { status: 403 }) };
  }

  return { user, error: null };
}

/**
 * Authenticates and verifies the user has at least the minimum role level.
 */
export async function requireMinRole(request: Request | NextRequest, minRole: string) {
  const { user, error } = await requireAdmin(request);
  if (error) return { user: null, error };

  if (!hasMinRole(user!.role, minRole)) {
    return { user: null, error: NextResponse.json({ error: `Access denied: Requires at least ${minRole} role` }, { status: 403 }) };
  }

  return { user, error: null };
}