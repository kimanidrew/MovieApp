import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

export async function getUserReferralCode(userId: string) {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, email: true },
  });

  if (!user?.referralCode) {
    const newCode = `FLIX_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    user = await prisma.user.update({
      where: { id: userId },
      data: { referralCode: newCode },
      select: { referralCode: true, email: true },
    });
  }

  const referralCount = await prisma.referral.count({
    where: { referrerId: userId, status: "CONVERTED" },
  });

  return {
    referralCode: user.referralCode,
    referralCount,
  };
}

export async function validateCouponCode(code: string, originalAmount: number | string) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: { plans: true },
  });

  if (!coupon || !coupon.isActive) {
    return { valid: false, reason: "Invalid or inactive coupon code" };
  }

  const now = new Date();
  if (coupon.startDate && coupon.startDate > now) {
    return { valid: false, reason: "Coupon is not active yet" };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { valid: false, reason: "Coupon has expired" };
  }
  if (coupon.redemptionCount >= coupon.maxRedemptions) {
    return { valid: false, reason: "Coupon redemption limit reached" };
  }

  const baseAmt = new Prisma.Decimal(originalAmount.toString());
  let discountAmt = new Prisma.Decimal("0.00");

  if (coupon.discountType === "PERCENTAGE") {
    const pct = new Prisma.Decimal(coupon.discountValue.toString()).div(100);
    discountAmt = baseAmt.mul(pct);
  } else {
    discountAmt = new Prisma.Decimal(coupon.discountValue.toString());
  }

  if (discountAmt.greaterThan(baseAmt)) discountAmt = baseAmt;
  const finalPrice = baseAmt.sub(discountAmt);

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue.toString(),
    discountAmount: discountAmt.toString(),
    finalPrice: finalPrice.toString(),
    currency: coupon.currency,
  };
}
