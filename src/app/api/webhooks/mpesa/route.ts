import { NextRequest, NextResponse } from "next/server";
import { confirmPaymentTransaction } from "@/lib/services/paymentService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("M-Pesa Webhook Received:", JSON.stringify(body));

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid Payload" }, { status: 400 });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;

    if (resultCode === 0) {
      // Payment Successful
      await confirmPaymentTransaction(checkoutRequestId, "SUCCESS", {
        mpesaCallbackData: stkCallback,
      });
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    } else {
      // Payment Failed or Cancelled by user
      await confirmPaymentTransaction(checkoutRequestId, "FAILED", {
        mpesaResultDesc: stkCallback.ResultDesc,
      });
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Payment failure acknowledged" });
    }
  } catch (error) {
    console.error("M-Pesa Webhook Error:", error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal Server Error" }, { status: 500 });
  }
}
