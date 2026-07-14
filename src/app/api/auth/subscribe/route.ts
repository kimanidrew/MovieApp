import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";


export async function POST(request: Request) {
  try {
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Missing plan configuration key (planId)" },
        { status: 400 }
      );
    }

    // 1. Recover token data straight from client cookie space
    const cookieStore = await cookies(); // <-- Add 'await' right here
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized access path. Please register or sign in." },
        { status: 401 }
      );
    }

    // 2. Locate the active registration entry.
    // Replace this mock query with your production JWT token verify() payload decoding.
    const activeUser = await prisma.user.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });

    if (!activeUser) {
      return NextResponse.json(
        { error: "Active registration user session not found." },
        { status: 404 }
      );
    }

    // 3. Atomically bind the chosen configuration plan to the active user profile
    const updatedUser = await prisma.user.update({
      where: { id: activeUser.id },
      data: { subscriptionPlanId: planId },
      include: {
        subscriptionPlan: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Subscription configuration successfully bound.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionPlanId: updatedUser.subscriptionPlanId
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Critical Subscription Link Failure:", error);
    return NextResponse.json(
      { error: "An unexpected system fault interrupted tier mapping assignment." },
      { status: 500 }
    );
  }
}