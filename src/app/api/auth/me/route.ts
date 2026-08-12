import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getConsumerUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // 1. Resolve both users independently using dedicated resolvers
    const resolvedAdmin = await getAdminUser(req);
    const resolvedCustomer = await getConsumerUser(req);

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