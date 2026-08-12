import prisma from "@/lib/prisma";
import { VideoResolution } from "@/app/generated/prisma";

export interface ContentAccessResult {
  canWatch: boolean;
  reason?: string;
  accessType: "FREE" | "SUBSCRIPTION" | "PREMIUM" | "RENTAL" | "PURCHASE" | "ADMIN_ONLY";
  requiresPayment?: boolean;
  rentalPrice?: number;
  rentalDurationHours?: number;
  purchasePrice?: number;
  currency?: string;
  allowedMaxResolution?: VideoResolution;
  adsEnabled?: boolean;
  activeRentalExpiresAt?: Date | null;
  subscriptionPlanName?: string | null;
}

const RESOLUTION_HIERARCHY: Record<VideoResolution, number> = {
  P240: 1,
  P360: 2,
  P480: 3,
  P720: 4,
  P1080: 5,
  UHD_4K: 6,
  UHD_8K: 7,
};

/**
 * Server-side authorization check to determine if a user can stream content.
 * Frontends must NEVER make access decisions.
 */
export async function canUserWatchContent(
  userId: string | null | undefined,
  profileId: string | null | undefined,
  contentId: string
): Promise<ContentAccessResult> {
  // 1. Fetch target content details
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      accessType: true,
      requiredPlanId: true,
      rentalPrice: true,
      rentalDurationHours: true,
      purchasePrice: true,
      currency: true,
      status: true,
    },
  });

  if (!content) {
    return {
      canWatch: false,
      reason: "Content not found",
      accessType: "FREE",
    };
  }

  const accessType = content.accessType || "FREE";
  const rentalPrice = content.rentalPrice ? Number(content.rentalPrice) : undefined;
  const purchasePrice = content.purchasePrice ? Number(content.purchasePrice) : undefined;
  const currency = content.currency || "KES";
  const rentalDurationHours = content.rentalDurationHours || 48;

  // 2. Unauthenticated check for FREE content
  if (accessType === "FREE") {
    // If user is authenticated, check their plan for ads and resolution settings
    let allowedMaxResolution: VideoResolution = "P720";
    let adsEnabled = true;

    if (userId) {
      const activeSub = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ["ACTIVE", "TRIALING"] },
        },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      });

      if (activeSub?.plan) {
        allowedMaxResolution = activeSub.plan.maxResolution;
        adsEnabled = activeSub.plan.adsEnabled;
      }
    }

    return {
      canWatch: true,
      accessType: "FREE",
      allowedMaxResolution,
      adsEnabled,
    };
  }

  // If user is not authenticated and content is NOT free
  if (!userId) {
    return {
      canWatch: false,
      reason: "Authentication required to access this content",
      accessType,
      requiresPayment: true,
      rentalPrice,
      rentalDurationHours,
      purchasePrice,
      currency,
    };
  }

  // 3. Admin bypass check
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return {
      canWatch: false,
      reason: "User account is suspended or inactive",
      accessType,
    };
  }

  if (["ADMIN", "SUPERADMIN", "CONTENT_MANAGER"].includes(user.role)) {
    return {
      canWatch: true,
      accessType,
      allowedMaxResolution: "UHD_4K",
      adsEnabled: false,
    };
  }

  if (accessType === "ADMIN_ONLY") {
    return {
      canWatch: false,
      reason: "This content is exclusively available to system administrators",
      accessType: "ADMIN_ONLY",
    };
  }

  // 4. Check for active TVOD Rental
  const activeRental = await prisma.rental.findFirst({
    where: {
      userId,
      contentId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
  });

  if (activeRental) {
    return {
      canWatch: true,
      accessType: "RENTAL",
      activeRentalExpiresAt: activeRental.expiresAt,
      allowedMaxResolution: "P1080",
      adsEnabled: false,
    };
  }

  // 5. Fetch user active subscription
  const activeSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
      OR: [
        { currentPeriodEnd: { gte: new Date() } },
        { currentPeriodEnd: null },
      ],
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  // 6. Access Type handling based on Subscription
  if (accessType === "SUBSCRIPTION" || accessType === "PREMIUM") {
    if (!activeSub) {
      return {
        canWatch: false,
        reason: "An active subscription is required to watch this content",
        accessType,
        requiresPayment: true,
        rentalPrice,
        rentalDurationHours,
        currency,
      };
    }

    // If PREMIUM access required, check if user's plan supports premium content
    if (accessType === "PREMIUM" && !activeSub.plan.isPremiumAccess) {
      return {
        canWatch: false,
        reason: "This title requires a Premium Subscription plan",
        accessType: "PREMIUM",
        requiresPayment: true,
        subscriptionPlanName: activeSub.plan.name,
      };
    }

    // Check device limits if profileId provided
    if (profileId) {
      const profileCount = await prisma.profile.count({
        where: { userId, deletedAt: null },
      });

      if (profileCount > activeSub.plan.maxProfiles) {
        return {
          canWatch: false,
          reason: `Your ${activeSub.plan.name} plan allows a maximum of ${activeSub.plan.maxProfiles} profile(s).`,
          accessType,
        };
      }
    }

    return {
      canWatch: true,
      accessType,
      allowedMaxResolution: activeSub.plan.maxResolution,
      adsEnabled: activeSub.plan.adsEnabled,
      subscriptionPlanName: activeSub.plan.name,
    };
  }

  // 7. Pay-Per-View Rental required
  if (accessType === "RENTAL" || accessType === "PURCHASE") {
    return {
      canWatch: false,
      reason: "Pay-Per-View rental required to unlock this title",
      accessType,
      requiresPayment: true,
      rentalPrice,
      rentalDurationHours,
      purchasePrice,
      currency,
    };
  }

  return {
    canWatch: false,
    reason: "Unauthorized access",
    accessType,
  };
}

/**
 * Server-side determination whether to serve ads for a given user
 */
export async function shouldShowAds(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return true;

  const activeSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  if (!activeSub) return true;
  return activeSub.plan.adsEnabled;
}
