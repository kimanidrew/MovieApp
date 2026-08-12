// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import crypto from "crypto";
import { getJwtSecretKey } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, deviceUuid, deviceName, deviceType } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required fields." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let defaultMaturity = await prisma.maturityRating.findFirst({
      orderBy: { severityRank: "asc" },
    });

    if (!defaultMaturity) {
      defaultMaturity = await prisma.maturityRating.create({
        data: { code: "G", system: "MPAA", severityRank: 10, description: "General" },
      });
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "USER",
        isActive: true,
        profiles: {
          create: {
            name: "Guest",
            maxMaturityId: defaultMaturity.id,
          },
        },
      },
      include: {
        profiles: true,
      },
    });

    const resolvedDeviceUuid = deviceUuid || crypto.randomUUID();
    const resolvedDeviceName = deviceName || "Web Browser";
    const resolvedDeviceType = deviceType || "WEB";
    const deviceSessionRef = crypto.randomBytes(40).toString("hex");
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";

    await prisma.deviceSession.create({
      data: {
        userId: user.id,
        deviceUuid: resolvedDeviceUuid,
        deviceName: resolvedDeviceName,
        deviceType: resolvedDeviceType,
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
    cookieStore.set("token", token, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    const { passwordHash: _, ...sanitizedUser } = user;

    return NextResponse.json(
      {
        message: "User account initialized successfully.",
        user: {
          ...sanitizedUser,
          profiles: user.profiles,
          isCreator: false,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration Pipeline Exception:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}