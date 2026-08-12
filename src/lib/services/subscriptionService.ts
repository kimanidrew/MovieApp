import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

export async function ensureDefaultPlansExist() {
  const count = await prisma.subscriptionPlan.count();
  if (count > 0) return;

  const defaultPlans = [
    {
      name: "FREE",
      slug: "free",
      description: "Ad-supported free access to selected titles in SD quality.",
      durationDays: 30,
      price: new Prisma.Decimal("0.00"),
      priceCents: 0,
      currency: "KES",
      billingInterval: "MONTHLY" as const,
      maxResolution: "P720" as const,
      maxProfiles: 1,
      maxDevices: 1,
      adsEnabled: true,
      allowsDownloads: false,
      isPremiumAccess: false,
      isActive: true,
      displayOrder: 1,
    },
    {
      name: "BASIC",
      slug: "basic",
      description: "Full HD streaming for 1 screen with limited ads.",
      durationDays: 30,
      price: new Prisma.Decimal("199.00"),
      priceCents: 19900,
      currency: "KES",
      billingInterval: "MONTHLY" as const,
      maxResolution: "P1080" as const,
      maxProfiles: 2,
      maxDevices: 2,
      adsEnabled: true,
      allowsDownloads: false,
      isPremiumAccess: false,
      isActive: true,
      displayOrder: 2,
    },
    {
      name: "STANDARD",
      slug: "standard",
      description: "Full HD ad-free streaming on multiple screens.",
      durationDays: 30,
      price: new Prisma.Decimal("399.00"),
      priceCents: 39900,
      currency: "KES",
      billingInterval: "MONTHLY" as const,
      maxResolution: "P1080" as const,
      maxProfiles: 4,
      maxDevices: 3,
      adsEnabled: false,
      allowsDownloads: true,
      isPremiumAccess: true,
      isActive: true,
      displayOrder: 3,
    },
    {
      name: "PREMIUM 4K",
      slug: "premium",
      description: "Ultra HD (4K) ad-free streaming, offline downloads, maximum screens.",
      durationDays: 30,
      price: new Prisma.Decimal("699.00"),
      priceCents: 69900,
      currency: "KES",
      billingInterval: "MONTHLY" as const,
      maxResolution: "UHD_4K" as const,
      maxProfiles: 5,
      maxDevices: 5,
      adsEnabled: false,
      allowsDownloads: true,
      isPremiumAccess: true,
      isActive: true,
      displayOrder: 4,
    },
  ];

  for (const planData of defaultPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: planData.slug },
      update: {},
      create: planData,
    });
  }
}

export async function getActiveSubscriptionPlans() {
  await ensureDefaultPlansExist();
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getUserActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function cancelUserSubscription(userId: string, subscriptionId?: string) {
  const targetSub = subscriptionId
    ? await prisma.subscription.findFirst({ where: { id: subscriptionId, userId } })
    : await getUserActiveSubscription(userId);

  if (!targetSub) {
    throw new Error("No active subscription found to cancel");
  }

  return prisma.subscription.update({
    where: { id: targetSub.id },
    data: {
      autoRenew: false,
      cancelledAt: new Date(),
    },
    include: { plan: true },
  });
}
