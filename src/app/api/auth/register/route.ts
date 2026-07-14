// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers"; // Added to manage your login cookie state

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, subscriptionPlanId } = body;

    // 1. Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required fields.' },
        { status: 400 }
      );
    }

    // 2. Prevent unique constraint violations on email
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ 
      where: { email: normalizedEmail } 
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // 3. Securely encrypt credentials
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Resolve a baseline maturity rating for the default profile
    let defaultMaturity = await prisma.maturityRating.findFirst({
      orderBy: { severityRank: 'asc' }
    });

    // Fallback if metadata tables aren't pre-populated yet
    if (!defaultMaturity) {
      defaultMaturity = await prisma.maturityRating.create({
        data: { code: "G", system: "MPAA", severityRank: 10, description: "General" }
      });
    }

    // 5. Provision the primary User AND their first default viewing profile atomically
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        subscriptionPlanId: subscriptionPlanId || null,
        role: 'USER',
        profiles: {
          create: {
            name: "Guest",
            maxMaturityId: defaultMaturity.id,
            // avatarUrl: can be a default asset string here if desired
          }
        }
      },
      include: {
        profiles: true // Pull the nested profile list to share back to your frontend layout context
      }
    });

    // 6. Generate the session cookie to ensure the user is logged in
    const response = NextResponse.json(
      { 
        message: 'User account initialized successfully.', 
        user: {
          id: user.id, // Fixed: Changed from userId to id to match common client schemas
          email: user.email,
          role: user.role,
          subscriptionPlanId: user.subscriptionPlanId,
          profiles: user.profiles // Fixed: Included profiles so client-side mapping doesn't break
        } 
      },
      { status: 201 }
    );

    // Drop the JWT token into browser cookie storage
    const cookieStore = await cookies();
    cookieStore.set("token", "mock-jwt-session-string-for-auth", {
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: true // Keeps script access locked away for safety
    });

    return response;

  } catch (error: any) {
    console.error('Registration Pipeline Exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}