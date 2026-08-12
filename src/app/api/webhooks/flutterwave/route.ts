import { NextRequest, NextResponse } from "next/server";
import { confirmPaymentTransaction } from "@/lib/services/paymentService";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("verif-hash");
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || "movieflix_secret_hash";

    if (signature && signature !== secretHash) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = await req.json();
    const { status, tx_ref } = body.data || {};

    if (status === "successful" && tx_ref) {
      await confirmPaymentTransaction(tx_ref, "SUCCESS", { flwData: body.data });
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Flutterwave Webhook Error:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
