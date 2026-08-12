import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { canUserWatchContent } from "@/lib/services/entitlementService";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: contentId } = await params;
    const user = await getAuthenticatedUser(req);
    const profileId = req.cookies.get("profile_id")?.value;

    const accessResult = await canUserWatchContent(
      user?.id || null,
      profileId || null,
      contentId
    );

    return NextResponse.json(accessResult);
  } catch (error) {
    console.error("Content access authorization error:", error);
    return NextResponse.json({ canWatch: false, reason: "Failed to authorize access" }, { status: 500 });
  }
}
