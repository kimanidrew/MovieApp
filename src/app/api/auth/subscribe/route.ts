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
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Subscription plan not found." },
        { status: 404 }
      );
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subscription = await prisma.subscription.create({
      data: {
        userId: activeUser.id,
        planId: plan.id,
        status: "ACTIVE",
        startDate: new Date(),
        endDate,
        autoRenew: true,
      },
      include: {
        plan: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Subscription configuration successfully bound.",
      user: {
        id: activeUser.id,
        email: activeUser.email,
        subscription: {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          endDate: subscription.endDate
        }
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