import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

export async function getCreatorDashboardData(creatorUserId: string) {
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: creatorUserId },
    include: {
      ownerships: {
        include: {
          content: {
            include: {
              images: true,
              movies: true,
              show: true,
            },
          },
        },
      },
      earnings: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      payoutRecords: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!creator) {
    throw new Error("Creator profile not found");
  }

  // Aggregate Total Views and Watch Seconds across creator content
  const contentIds = creator.ownerships.map((o) => o.contentId);

  const aggregateStats = await prisma.content.aggregate({
    where: { id: { in: contentIds } },
    _sum: {
      viewCount: true,
      watchSeconds: true,
      playCount: true,
    },
  });

  const totalEarnings = creator.earnings.reduce((acc, curr) => acc.add(curr.amount), new Prisma.Decimal("0.00"));

  return {
    creatorId: creator.id,
    channelName: creator.channelName,
    bio: creator.bio,
    currentBalance: creator.currentBalance.toString(),
    isVerified: creator.isVerified,
    contentCount: creator.ownerships.length,
    totalViews: aggregateStats._sum.viewCount?.toString() || "0",
    totalWatchSeconds: aggregateStats._sum.watchSeconds?.toString() || "0",
    totalEarnings: totalEarnings.toString(),
    ownerships: creator.ownerships,
    recentEarnings: creator.earnings,
    payoutRecords: creator.payoutRecords,
  };
}

export async function requestCreatorPayout(creatorUserId: string, amountRequested: number | string) {
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: creatorUserId },
  });

  if (!creator) throw new Error("Creator profile not found");

  const requestedDecimal = new Prisma.Decimal(amountRequested.toString());
  if (requestedDecimal.lessThanOrEqualTo(0) || requestedDecimal.greaterThan(creator.currentBalance)) {
    throw new Error("Invalid payout amount or insufficient balance");
  }

  return prisma.$transaction(async (tx) => {
    // Deduct balance
    const updatedCreator = await tx.creatorProfile.update({
      where: { id: creator.id },
      data: {
        currentBalance: { decrement: requestedDecimal },
      },
    });

    // Create payout record
    const payoutRecord = await tx.creatorPayoutRecord.create({
      data: {
        creatorId: creator.id,
        amount: requestedDecimal,
        currency: "KES",
        status: "PENDING",
      },
    });

    return payoutRecord;
  });
}
