import { NextResponse } from "next/server";
import { getActiveSubscriptionPlans } from "@/lib/services/subscriptionService";

export async function GET() {
  try {
    const plans = await getActiveSubscriptionPlans();
    const formattedPlans = plans.map((p) => ({
      ...p,
      price: p.price.toString(),
    }));
    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error("Failed to load plans:", error);
    return NextResponse.json({ error: "Failed to load subscription plans" }, { status: 500 });
  }
}