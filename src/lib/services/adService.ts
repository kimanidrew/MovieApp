import prisma from "@/lib/prisma";
import { AdType, AdEventType } from "@/app/generated/prisma";

export async function getActiveAds(placement: AdType = "PRE_ROLL") {
  const now = new Date();
  return prisma.advertisement.findMany({
    where: {
      placement,
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export async function recordAdEvent(params: {
  advertisementId: string;
  userId?: string;
  profileId?: string;
  contentId?: string;
  eventType: AdEventType;
}) {
  const { advertisementId, userId, profileId, contentId, eventType } = params;

  // Asynchronous non-blocking write
  return prisma.advertisementEvent.create({
    data: {
      advertisementId,
      userId,
      profileId,
      contentId,
      eventType,
    },
  });
}
