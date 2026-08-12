import { NextRequest, NextResponse } from "next/server";
import { getActiveAds, recordAdEvent } from "@/lib/services/adService";
import { AdType, AdEventType } from "@/app/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = (searchParams.get("placement") as AdType) || "PRE_ROLL";
    const ads = await getActiveAds(placement);
    return NextResponse.json({ ads });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load advertisements" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { advertisementId, profileId, contentId, eventType } = body;

    if (!advertisementId || !eventType) {
      return NextResponse.json({ error: "Missing required event fields" }, { status: 400 });
    }

    await recordAdEvent({
      advertisementId,
      profileId,
      contentId,
      eventType: eventType as AdEventType,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record ad event" }, { status: 500 });
  }
}
