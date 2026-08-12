import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin(req);
    if (error) return error;

    // 1. Calculate Active Subscribers Count
    const activeSubscribers = await prisma.subscription.count({
      where: { status: "ACTIVE" },
    });

    // 2. Calculate Gross Subscription & Rental Revenues
    const subscriptionLedgers = await prisma.payment.aggregate({
      where: { paymentStatus: "SUCCESS", subscriptionId: { not: null } },
      _sum: { amount: true },
    });

    const rentalLedgers = await prisma.payment.aggregate({
      where: { paymentStatus: "SUCCESS", rentalId: { not: null } },
      _sum: { amount: true },
    });

    // 3. Calculate Financial Ledger Net Totals
    const ledgerAgg = await prisma.financialLedger.aggregate({
      _sum: {
        grossRevenue: true,
        gatewayFee: true,
        creatorRevShare: true,
        netPlatformRev: true,
      },
    });

    // 4. Calculate MRR & ARR estimate based on active subscription plans
    const activeSubsWithPlans = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    });

    let mrr = new Prisma.Decimal("0.00");
    for (const sub of activeSubsWithPlans) {
      if (sub.plan) {
        mrr = mrr.add(sub.plan.price);
      }
    }
    const arr = mrr.mul(12);

    const grossSubscriptionRev = subscriptionLedgers._sum.amount || new Prisma.Decimal("0.00");
    const grossRentalRev = rentalLedgers._sum.amount || new Prisma.Decimal("0.00");
    const totalGross = (ledgerAgg._sum.grossRevenue || new Prisma.Decimal("0.00")).toString();
    const gatewayFees = (ledgerAgg._sum.gatewayFee || new Prisma.Decimal("0.00")).toString();
    const creatorRevShare = (ledgerAgg._sum.creatorRevShare || new Prisma.Decimal("0.00")).toString();
    const netPlatformRevenue = (ledgerAgg._sum.netPlatformRev || new Prisma.Decimal("0.00")).toString();

    return NextResponse.json({
      activeSubscribers,
      mrr: mrr.toString(),
      arr: arr.toString(),
      grossSubscriptionRevenue: grossSubscriptionRev.toString(),
      grossRentalRevenue: grossRentalRev.toString(),
      totalGrossRevenue: totalGross,
      totalGatewayFees: gatewayFees,
      totalCreatorRevShare: creatorRevShare,
      netPlatformRevenue,
      currency: "KES",
    });
  } catch (err: any) {
    console.error("Admin revenue stats error:", err);
    return NextResponse.json({ error: "Failed to query admin revenue analytics" }, { status: 500 });
  }
}
