import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_ROLES } from "@/lib/admin-roles";

// Admin API routes that are always protected
const adminProtectedApiPrefixes = [
  "/api/admin/stats",
  "/api/admin/revenue",
  "/api/admin/subscriptions",
  "/api/admin/creators",
  "/api/admin/payments",
  "/api/admin/content",
  "/api/admin/users",
  "/api/admin/media",
  "/api/admin/metadata",
];

function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET || "fallback-secret-use-env-variable-in-production";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const { pathname } = nextUrl;

  // 1. ABSOLUTE BYPASS: Let login, public pricing, webhooks, plans, and auth API paths pass through immediately.
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname === "/api/plans" ||
    pathname === "/pricing"
  ) {
    return NextResponse.next();
  }

  // 2. Secure admin API routes with JWT verification + role check
  if (adminProtectedApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    const adminToken = cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(adminToken, getJwtSecretKey());
      const role = payload.role as string;
      if (!ADMIN_ROLES.includes(role as any)) {
        return NextResponse.json({ error: "Access denied: Admin privileges required" }, { status: 403 });
      }
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }
  }

  // 3. Other API routes still need a token
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/admin")) {
    const token = cookies.get("token")?.value || cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const consumerToken = cookies.get("token")?.value;
  const adminToken = cookies.get("admin_token")?.value;
  const profileId = cookies.get("profile_id")?.value;

  const isAdminPageRoute = pathname.startsWith("/admin") && !pathname.startsWith("/api/admin");
  const isCreatorPageRoute = pathname.startsWith("/creator") && !pathname.startsWith("/api/creator");

  // 4. Secure Route Guard (Unauthenticated redirects)
  // Admin pages require admin_token; consumer pages require token
  if (isAdminPageRoute && !adminToken) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Consumer pages (non-admin, non-creator) require consumer token
  if (!isAdminPageRoute && !isCreatorPageRoute && !consumerToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Creator space uses consumer token
  if (isCreatorPageRoute && !consumerToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Profile Selection Forced Gate
  if (consumerToken && !profileId && !isAdminPageRoute && !isCreatorPageRoute) {
    const streamingRoutes = ["/", "/tv", "/movies", "/my-list", "/video"];
    const isTryingToStream = streamingRoutes.includes(pathname);

    if (isTryingToStream) {
      return NextResponse.redirect(new URL("/profiles", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};