// app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import { cookies } from "next/headers";
import { SignJWT } from "jose"; 

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-use-env-variable-in-production"
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, deviceUuid, deviceName, deviceType, requiredRole } = body;

    // 1. Validation check
    if (!email || !password || !deviceUuid || !deviceName) {
      return NextResponse.json(
        { error: 'Email, password, device footprint data, and context are mandatory.' },
        { status: 400 }
      );
    }

    // 2. Locate user and include necessary relational structures
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim(), isActive: true },
      include: {
        subscriptionPlan: true,
        profiles: { where: { deletedAt: null } },
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid login credentials provided.' }, { status: 401 });
    }

    // 3. Verify password validity
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid login credentials provided.' }, { status: 401 });
    }

    // 4. Role Separation Strategy
    // Fixed: Group all administrative/moderation staff together so they get assigned the correct token type
    const isStaffUser = ["ADMIN", "SUPERADMIN", "MODERATOR", "CONTENT_MANAGER"].includes(user.role);

    // Flexible validation: Checks if the user's role meets requirements (handles SUPERADMIN vs ADMIN)
    if (requiredRole) {
      const allowedRoles = requiredRole === "ADMIN" ? ["ADMIN", "SUPERADMIN"] : [requiredRole];
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: `Access Denied: This account does not possess matching ${requiredRole} privileges.` },
          { status: 403 }
        );
      }
    }

    // Protect standard endpoints from accidental staff stream sessions
    if (!requiredRole && isStaffUser) {
      return NextResponse.json(
        { error: 'Administrative accounts must authenticate via the management portal.' },
        { status: 403 }
      );
    }

    // 5. Concurrent-screen enforcement check
    if (!isStaffUser && user.subscriptionPlan) {
      const activeScreensCount = await prisma.deviceSession.count({
        where: {
          userId: user.id,
          NOT: { deviceUuid }, 
          lastActiveAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Active in last 15 mins
          },
        },
      });

      if (activeScreensCount >= user.subscriptionPlan.maxSimultaneousScreens) {
        return NextResponse.json(
          {
            error: `Streaming screen limit reached (${user.subscriptionPlan.maxSimultaneousScreens}). Please disconnect another active device.`,
          },
          { status: 403 }
        );
      }
    }

    // 6. Generate device reference string (Used exclusively for backend device lookups/invalidations)
    const deviceSessionRef = crypto.randomBytes(40).toString('hex');
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // 7. Locate or create device tracking layout records
    const existingSession = await prisma.deviceSession.findFirst({
      where: {
        userId: user.id,
        deviceUuid: deviceUuid,
      },
    });

    const runtimeSession = await prisma.deviceSession.upsert({
      where: {
        refreshToken: existingSession ? existingSession.refreshToken : "NEW_SESSION_FALLBACK",
      },
      update: {
        deviceName,
        deviceType: deviceType || 'WEB',
        ipAddress,
        refreshToken: deviceSessionRef,
        lastActiveAt: new Date(),
      },
      create: {
        userId: user.id,
        deviceUuid,
        deviceName,
        deviceType: deviceType || 'WEB',
        ipAddress,
        refreshToken: deviceSessionRef,
      },
    });

    // 8. MIDDLEWARE COMPATIBILITY FIX: BAKE THE JWT VALUE
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionRef: deviceSessionRef, // Binds the token context to this specific database device block
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    // 9. THE CRITICAL MULTI-TENANT FIX: Compute isolated cookie namespaces
    // Staff roles get stored under 'admin_token' while regular viewers use 'token'
    const targetCookieName = isStaffUser ? "admin_token" : "token";

    // Save signed token string safely into client HTTP-Only Cookie storage
    const cookieStore = await cookies();
    cookieStore.set(targetCookieName, token, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 Days
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });

    // Strip secure password traces before returning payload
    const { passwordHash: _, ...sanitizedUser } = user;

    return NextResponse.json(
      {
        message: 'Authentication successful.',
        session: {
          token: token, // Client receives verifiable payload mapping
          expiresAt: runtimeSession.lastActiveAt,
        },
        user: {
          id: sanitizedUser.id,
          email: sanitizedUser.email,
          role: sanitizedUser.role,
          subscriptionPlanId: sanitizedUser.subscriptionPlanId,
          profiles: sanitizedUser.profiles 
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login Endpoint Verification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}