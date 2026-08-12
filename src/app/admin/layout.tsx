import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { getJwtSecretKey } from "@/lib/auth";
import AdminNavbar from "@/components/Navbar/AdminNavbar";
import { ADMIN_ROLES } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The middleware already handles auth redirection for admin routes.
  // This layout only needs to render the admin shell UI.
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_token")?.value;

  // If there IS an admin token, verify it's valid
  if (adminToken) {
    try {
      const { payload } = await jwtVerify(adminToken, getJwtSecretKey());
      const sessionRef = payload.sessionRef as string;

      if (sessionRef) {
        const session = await prisma.deviceSession.findUnique({
          where: { refreshToken: sessionRef },
          include: { user: true },
        });

        if (session?.user && session.user.isActive && ADMIN_ROLES.includes(session.user.role as any)) {
          return (
            <>
              <AdminNavbar />
              <div style={{ paddingTop: "65px" }}>{children}</div>
            </>
          );
        }
      }
    } catch (error) {
      // Invalid token - let middleware handle the redirect
    }
  }

  // If no valid admin session, just render children without the admin navbar.
  // The middleware will redirect /admin/* (except /admin/login) to /admin/login.
  return <>{children}</>;
}