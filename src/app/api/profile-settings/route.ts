// app/api/profile-settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const profileId = req.nextUrl.searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          error: "profileId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const settings = await prisma.profileSettings.findUnique({
      where: {
        profileId,
      },
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profile settings.",
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

    const settings = await prisma.profileSettings.update({
      where: {
        profileId: body.profileId,
      },
      data: {
        interfaceLanguage: body.interfaceLanguage,
        audioLanguage: body.audioLanguage,
        subtitleLanguage: body.subtitleLanguage,
        autoplayNext: body.autoplayNext,
        autoplayPreviews: body.autoplayPreviews,
      },
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile settings.",
      },
      {
        status: 500,
      }
    );
  }
}