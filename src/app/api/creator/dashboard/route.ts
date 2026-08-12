import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getCreatorDashboardData, requestCreatorPayout } from "@/lib/services/creatorService";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.isCreator) {
      return NextResponse.json({ error: "Access denied. Creator privileges required." }, { status: 403 });
    }

    const data = await getCreatorDashboardData(user.id);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load creator dashboard" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.isCreator) {
      return NextResponse.json({ error: "Access denied. Creator privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { amount } = body;

    const payoutRecord = await requestCreatorPayout(user.id, amount);
    return NextResponse.json({
      success: true,
      message: "Payout request submitted successfully.",
      payout: {
        ...payoutRecord,
        amount: payoutRecord.amount.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit payout request" }, { status: 400 });
  }
}