// src/app/api/init-admin/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // Only allow in development or when explicitly enabled
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_INIT_ADMIN !== "true") {
      return NextResponse.json(
        { success: false, error: "This endpoint is disabled in production" },
        { status: 403 }
      );
    }

    const email = process.env.ADMIN_EMAIL || "admin@movieflix.com";
    const plainPassword = process.env.ADMIN_PASSWORD || "admin123";
    const role = "ADMIN";

    // 1. Securely hash the plain text password using 10 salt rounds
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // 2. Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    let result;
    if (existingUser) {
      // 3. Update role and password if they exist
      result = await prisma.user.update({
        where: { email },
        data: { role: role as any, passwordHash, isActive: true, deletedAt: null },
        select: { id: true, email: true, role: true },
      });
    } else {
      // 4. Insert record with hashed password
      result = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: role as any,
          isActive: true,
        },
        select: { id: true, email: true, role: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Superuser configured securely with hashed password!",
      data: result,
    });
  } catch (error: any) {
    console.error("Admin initialization failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Database execution failed" },
      { status: 500 }
    );
  }
}