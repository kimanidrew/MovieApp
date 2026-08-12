import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { initiateSubscriptionPayment, initiateRentalPayment } from "@/lib/services/paymentService";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const body = await req.json();
    const { type, planId, contentId, paymentMethod = "MPESA", phone, couponCode } = body;

    if (type === "RENTAL" && contentId) {
      const result = await initiateRentalPayment({
        userId: user.id,
        contentId,
        paymentMethod,
        phone,
        couponCode,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (type === "SUBSCRIPTION" && planId) {
      const result = await initiateSubscriptionPayment({
        userId: user.id,
        planId,
        paymentMethod,
        phone,
        couponCode,
      });
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: "Invalid payment request parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("Payment initiation error:", error);
    return NextResponse.json({ error: error.message || "Failed to initiate payment" }, { status: 500 });
  }
}
