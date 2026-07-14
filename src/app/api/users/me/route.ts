// app/api/users/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const firebaseUid = req.nextUrl.searchParams.get("firebaseUid");

    if (!firebaseUid) {
      return NextResponse.json(
        {
          success: false,
          error: "firebaseUid is required.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        firebaseUid,
      },
      include: {
        subscriptionPlan: true,

        profiles: {
          where: {
            deletedAt: null,
          },
          include: {
            settings: true,
            maxMaturity: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },

        sessions: {
          orderBy: {
            lastActiveAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load user.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      firebaseUid,
      email,
      subscriptionPlanId,
    } = body;

    if (!firebaseUid || !email || !subscriptionPlanId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields.",
        },
        {
          status: 400,
        }
      );
    }

    const existing = await prisma.user.findUnique({
      where: {
        firebaseUid,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        user: existing,
      });
    }

    const user = await prisma.user.create({
      data: {
        firebaseUid,
        email,
        subscriptionPlanId,
      },
      include: {
        subscriptionPlan: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const user = await prisma.user.update({
      where: {
        id: body.id,
      },
      data: {
        role: body.role,
        subscriptionPlanId: body.subscriptionPlanId,
        isActive: body.isActive,
      },
      include: {
        subscriptionPlan: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "User id is required.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user.",
      },
      {
        status: 500,
      }
    );
  }
}