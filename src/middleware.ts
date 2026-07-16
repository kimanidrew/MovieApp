import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that skip session extraction requirements
const publicRoutes = ["/login", "/register", "/admin/login"];

export function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const { pathname } = nextUrl;

  // 1. Expose auth API routes so credentials can be set or cleared without interference
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const consumerToken = cookies.get("token")?.value;
  const adminToken = cookies.get("admin_token")?.value;
  const profileId = cookies.get("profile_id")?.value; // 👈 Read the active profile cookie

  const isAdminSpace =
  pathname.startsWith("/admin") ||
  pathname.startsWith("/api/admin");
  const currentSpaceToken = isAdminSpace ? adminToken : consumerToken;

  // 2. Secure Route Guard (Unauthenticated redirects)
  if (!currentSpaceToken && !isPublicRoute) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const fallbackPath = isAdminSpace ? "/admin/login" : "/login";
    const loginUrl = new URL(fallbackPath, request.url);
    
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Prevent logged-in users from hitting login pages
  if (pathname === "/admin/login" && adminToken) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if ((pathname === "/login" || pathname === "/register") && consumerToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 4. 👉 PROFILE SELECTION FORCED GATE
  // If customer is logged in, but has not selected a profile, protect streaming routes
  if (consumerToken && !profileId && !isAdminSpace) {
    const streamingRoutes = ["/", "/tv", "/movies", "/my-list"];
    const isTryingToStream = streamingRoutes.includes(pathname);

    if (isTryingToStream) {
      return NextResponse.redirect(new URL("/profiles", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svgs, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};