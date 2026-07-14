import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose"; 
import prisma from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-use-env-variable-in-production"
);

// Helper function to resolve a token to a sanitized user object
async function resolveUserFromToken(token: string | undefined) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const sessionRef = payload.sessionRef as string;
    if (!sessionRef) return null;

    const session = await prisma.deviceSession.findUnique({
      where: { refreshToken: sessionRef },
      include: {
        user: {
          include: {
            profiles: { where: { deletedAt: null } },
            subscriptionPlan: true,
          },
        },
      },
    });

    if (!session || !session.user || !session.user.isActive) {
      return null;
    }

    // Update heartbeat timestamp
    await prisma.deviceSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    const { passwordHash, ...safeUser } = session.user;
    return safeUser;
  } catch (err) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminToken = req.cookies.get("admin_token")?.value;
    const consumerToken = req.cookies.get("token")?.value;

    // 1. Resolve both users independently
    const resolvedAdmin = await resolveUserFromToken(adminToken);
    const resolvedCustomer = await resolveUserFromToken(consumerToken);

    // 2. Double-check admin privileges (Security Gate)
    const isStaffUser = resolvedAdmin && ["ADMIN", "SUPERADMIN", "MODERATOR", "CONTENT_MANAGER"].includes(resolvedAdmin.role);
    const adminUserPayload = isStaffUser ? resolvedAdmin : null;

    // 3. Return the payload matching the exact keys AuthProvider expects
    return NextResponse.json(
      { 
        adminUser: adminUserPayload, 
        customerUser: resolvedCustomer 
      }, 
      { status: 200 }
    );

  } catch (err) {
    console.error("Session profile fetch failure:", err);
    return NextResponse.json({ adminUser: null, customerUser: null }, { status: 401 });
  }
}