// app/api/auth/login/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { getJwtSecretKey } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, deviceUuid, deviceName, deviceType, requiredRole } = body;

    if (!email || !password || !deviceUuid || !deviceName) {
      return NextResponse.json(
        { error: "Email, password, device footprint data, and context are mandatory." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail, isActive: true },
      include: {
        profiles: { where: { deletedAt: null } },
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid login credentials provided." }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid login credentials provided." }, { status: 401 });
    }

    const isStaffUser = ["ADMIN", "SUPERADMIN", "MODERATOR", "CONTENT_MANAGER"].includes(user.role);

    if (requiredRole) {
      const allowedRoles = requiredRole === "ADMIN" ? ["ADMIN", "SUPERADMIN", "MODERATOR", "CONTENT_MANAGER"] : [requiredRole];
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: `Access Denied: This account does not possess matching ${requiredRole} privileges.` },
          { status: 403 }
        );
      }
    }

    if (!requiredRole && isStaffUser) {
      return NextResponse.json(
        { error: "Administrative accounts must authenticate via the management portal." },
        { status: 403 }
      );
    }

    const deviceSessionRef = crypto.randomBytes(40).toString("hex");
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";

    const runtimeSession = await prisma.deviceSession.upsert({
      where: {
        userId_deviceUuid: {
          userId: user.id,
          deviceUuid,
        },
      },
      update: {
        deviceName,
        deviceType: deviceType || "WEB",
        ipAddress,
        refreshToken: deviceSessionRef,
        lastActiveAt: new Date(),
      },
      create: {
        userId: user.id,
        deviceUuid,
        deviceName,
        deviceType: deviceType || "WEB",
        ipAddress,
        refreshToken: deviceSessionRef,
      },
    });

    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionRef: deviceSessionRef,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(getJwtSecretKey());

    const cookieStore = await cookies();
    const targetCookieName = isStaffUser ? "admin_token" : "token";

    // Set the appropriate session token
    cookieStore.set(targetCookieName, token, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    // NOTE: We intentionally DO NOT clear the alternative cookie here.
    // Admin and Customer sessions are kept independent so both can be
    // authenticated simultaneously in the same browser. The /api/auth/me
    // endpoint resolves each token independently without collisions.

    const { passwordHash: _, ...sanitizedUser } = user;

    return NextResponse.json(
      {
        message: "Authentication successful.",
        session: {
          token,
          expiresAt: runtimeSession.lastActiveAt,
        },
        user: {
          id: sanitizedUser.id,
          email: sanitizedUser.email,
          role: sanitizedUser.role,
          isCreator: sanitizedUser.isCreator,
          profiles: sanitizedUser.profiles,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login Endpoint Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}