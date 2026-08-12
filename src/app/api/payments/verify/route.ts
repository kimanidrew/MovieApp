import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { confirmPaymentTransaction } from "@/lib/services/paymentService";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const body = await req.json();
    const { providerTransactionId } = body;

    if (!providerTransactionId) {
      return NextResponse.json({ error: "Missing providerTransactionId" }, { status: 400 });
    }

    // Verify transaction server-side
    const result = await confirmPaymentTransaction(providerTransactionId, "SUCCESS");

    return NextResponse.json({
      success: true,
      status: result.status,
      alreadyProcessed: result.alreadyProcessed,
      paymentId: result.payment?.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to verify payment" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        subscription: { include: { plan: true } },
        rental: { include: { content: true } },
      },
    });

    const formattedPayments = payments.map((p) => ({
      ...p,
      amount: p.amount.toString(),
      rental: p.rental
        ? {
            ...p.rental,
            price: p.rental.price.toString(),
          }
        : null,
    }));

    return NextResponse.json({ payments: formattedPayments });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payment history" }, { status: 500 });
  }
}
