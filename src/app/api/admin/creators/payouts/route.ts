import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin(req);
    if (error) return error;

    const payouts = await prisma.creatorPayoutRecord.findMany({
      include: {
        creator: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = payouts.map((p) => ({
      ...p,
      amount: p.amount.toString(),
    }));

    return NextResponse.json({ payouts: formatted });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load creator payout requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin(req);
    if (error) return error;

    const body = await req.json();
    const { payoutId, status, providerRef, failureReason } = body;

    const payout = await prisma.creatorPayoutRecord.findUnique({
      where: { id: payoutId },
    });

    if (!payout) return NextResponse.json({ error: "Payout record not found" }, { status: 404 });

    const updated = await prisma.creatorPayoutRecord.update({
      where: { id: payoutId },
      data: {
        status,
        providerRef,
        processedAt: status === "PAID" ? new Date() : undefined,
        failureReason,
      },
    });

    // If rejected/failed, refund the amount back to creator balance
    if (status === "FAILED" || status === "CANCELLED") {
      await prisma.creatorProfile.update({
        where: { id: payout.creatorId },
        data: { currentBalance: { increment: payout.amount } },
      });
    }

    return NextResponse.json({
      success: true,
      payout: { ...updated, amount: updated.amount.toString() },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process payout status" }, { status: 500 });
  }
}
