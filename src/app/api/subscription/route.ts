import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserActiveSubscription, cancelUserSubscription } from "@/lib/services/subscriptionService";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const subscription = await getUserActiveSubscription(user.id);
    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        message: "No active subscription found. Free ad-supported tier active.",
      });
    }

    return NextResponse.json({
      subscription: {
        ...subscription,
        plan: {
          ...subscription.plan,
          price: subscription.plan.price.toString(),
        },
      },
    });
  } catch (error) {
    console.error("Failed to query subscription:", error);
    return NextResponse.json({ error: "Failed to load subscription details" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const updatedSub = await cancelUserSubscription(user.id, body.subscriptionId);

    return NextResponse.json({
      success: true,
      message: "Subscription renewal cancelled. Access will remain active until current period ends.",
      subscription: {
        ...updatedSub,
        plan: {
          ...updatedSub.plan,
          price: updatedSub.plan.price.toString(),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to cancel subscription" }, { status: 400 });
  }
}
