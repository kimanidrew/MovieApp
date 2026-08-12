import prisma from "@/lib/prisma";
import { Prisma, PaymentStatus, PaymentMethod, PaymentProvider, SubscriptionStatus } from "@/app/generated/prisma";
import { getPaymentProvider, InitiatePaymentParams } from "./paymentProviders";

export interface CreateSubscriptionPaymentOptions {
  userId: string;
  planId: string;
  paymentMethod: PaymentMethod;
  phone?: string;
  couponCode?: string;
}

export interface CreateRentalPaymentOptions {
  userId: string;
  contentId: string;
  paymentMethod: PaymentMethod;
  phone?: string;
  couponCode?: string;
}

/**
 * Initiate payment for a Subscription Plan
 */
export async function initiateSubscriptionPayment(options: CreateSubscriptionPaymentOptions) {
  const { userId, planId, paymentMethod, phone, couponCode } = options;

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan || !plan.isActive) {
    throw new Error("Subscription plan is unavailable");
  }

  let finalAmount = new Prisma.Decimal(plan.price.toString());
  let couponId: string | undefined;

  // Apply Coupon if provided
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (coupon && coupon.isActive) {
      if (coupon.discountType === "PERCENTAGE") {
        const pct = new Prisma.Decimal(coupon.discountValue.toString()).div(100);
        const discountAmt = finalAmount.mul(pct);
        finalAmount = finalAmount.sub(discountAmt);
      } else {
        finalAmount = finalAmount.sub(new Prisma.Decimal(coupon.discountValue.toString()));
      }
      if (finalAmount.lessThan(0)) finalAmount = new Prisma.Decimal("0.00");
      couponId = coupon.id;
    }
  }

  const providerEnum: PaymentProvider = paymentMethod === "MPESA" ? "MPESA_DARAJA" : "FLUTTERWAVE";
  const provider = getPaymentProvider(providerEnum);

  const initResult = await provider.initiatePayment({
    userId,
    amount: finalAmount,
    currency: plan.currency || "KES",
    phone,
    description: `MovieFlix Subscription - ${plan.name}`,
    paymentMethod,
    metadata: { planId, type: "SUBSCRIPTION", couponId },
  });

  // Create PENDING payment record in DB
  const payment = await prisma.payment.create({
    data: {
      userId,
      amount: finalAmount,
      currency: plan.currency || "KES",
      provider: providerEnum,
      providerTransactionId: initResult.providerTransactionId,
      providerRef: initResult.providerRef,
      paymentStatus: "PENDING",
      paymentMethod,
      metadata: {
        planId,
        type: "SUBSCRIPTION",
        couponId,
        customerMessage: initResult.customerMessage,
      },
    },
  });

  return {
    paymentId: payment.id,
    providerTransactionId: payment.providerTransactionId,
    status: payment.paymentStatus,
    amount: payment.amount.toString(),
    currency: payment.currency,
    customerMessage: initResult.customerMessage,
    checkoutUrl: initResult.checkoutUrl,
  };
}

/**
 * Initiate payment for a Pay-Per-View Rental (TVOD)
 */
export async function initiateRentalPayment(options: CreateRentalPaymentOptions) {
  const { userId, contentId, paymentMethod, phone } = options;

  const content = await prisma.content.findUnique({
    where: { id: contentId },
  });

  if (!content || !content.rentalPrice) {
    throw new Error("Content is not available for rental");
  }

  const finalAmount = new Prisma.Decimal(content.rentalPrice.toString());
  const providerEnum: PaymentProvider = paymentMethod === "MPESA" ? "MPESA_DARAJA" : "FLUTTERWAVE";
  const provider = getPaymentProvider(providerEnum);

  const initResult = await provider.initiatePayment({
    userId,
    amount: finalAmount,
    currency: content.currency || "KES",
    phone,
    description: `Rental: ${content.title}`,
    paymentMethod,
    metadata: { contentId, type: "RENTAL" },
  });

  const payment = await prisma.payment.create({
    data: {
      userId,
      amount: finalAmount,
      currency: content.currency || "KES",
      provider: providerEnum,
      providerTransactionId: initResult.providerTransactionId,
      providerRef: initResult.providerRef,
      paymentStatus: "PENDING",
      paymentMethod,
      metadata: { contentId, type: "RENTAL" },
    },
  });

  return {
    paymentId: payment.id,
    providerTransactionId: payment.providerTransactionId,
    status: payment.paymentStatus,
    amount: payment.amount.toString(),
    currency: payment.currency,
    customerMessage: initResult.customerMessage,
  };
}

/**
 * Server-Side Payment Confirmation & Webhook Processing (Idempotent)
 */
export async function confirmPaymentTransaction(
  providerTransactionId: string,
  providerStatus: "SUCCESS" | "FAILED" | "CANCELLED" = "SUCCESS",
  metadataOverride?: Record<string, any>
) {
  // 1. Fetch Payment Record
  const payment = await prisma.payment.findUnique({
    where: { providerTransactionId },
    include: { user: true },
  });

  if (!payment) {
    throw new Error(`Payment transaction not found: ${providerTransactionId}`);
  }

  // 2. IDEMPOTENCY CHECK: If payment is already processed, do NOT re-process
  if (payment.paymentStatus === "SUCCESS") {
    return { status: "SUCCESS", alreadyProcessed: true, payment };
  }

  if (providerStatus === "FAILED" || providerStatus === "CANCELLED") {
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: providerStatus === "CANCELLED" ? "CANCELLED" : "FAILED",
        failedAt: new Date(),
      },
    });
    return { status: updatedPayment.paymentStatus, alreadyProcessed: false, payment: updatedPayment };
  }

  const meta = (payment.metadata as Record<string, any>) || {};
  const paymentType = meta.type || "SUBSCRIPTION";

  // Use a Prisma Transaction to ensure financial consistency across Subscription, Rental, Rev-Share, and Ledger
  const result = await prisma.$transaction(async (tx) => {
    // A. Update Payment status to SUCCESS
    const confirmedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: "SUCCESS",
        paidAt: new Date(),
        metadata: { ...meta, ...metadataOverride },
      },
    });

    let createdSubscriptionId: string | null = null;
    let createdRentalId: string | null = null;

    // B. Handle Subscription fulfillment
    if (paymentType === "SUBSCRIPTION" && meta.planId) {
      const plan = await tx.subscriptionPlan.findUnique({ where: { id: meta.planId } });
      if (plan) {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

        // Deactivate previous active subscriptions for the user
        await tx.subscription.updateMany({
          where: { userId: payment.userId, status: "ACTIVE" },
          data: { status: "EXPIRED" },
        });

        const newSub = await tx.subscription.create({
          data: {
            userId: payment.userId,
            planId: plan.id,
            status: "ACTIVE",
            startDate,
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
            endDate,
            autoRenew: true,
            externalProvider: payment.provider,
            externalSubscriptionId: providerTransactionId,
          },
        });
        createdSubscriptionId = newSub.id;

        // Link payment to subscription
        await tx.payment.update({
          where: { id: payment.id },
          data: { subscriptionId: newSub.id },
        });
      }
    }

    // C. Handle Pay-Per-View Rental fulfillment (TVOD)
    if (paymentType === "RENTAL" && meta.contentId) {
      const content = await tx.content.findUnique({ where: { id: meta.contentId } });
      if (content) {
        const hours = content.rentalDurationHours || 48;
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

        const newRental = await tx.rental.create({
          data: {
            userId: payment.userId,
            contentId: content.id,
            paymentId: payment.id,
            price: payment.amount,
            currency: payment.currency,
            expiresAt,
            isActive: true,
          },
        });
        createdRentalId = newRental.id;

        // Process Creator Revenue Share for TVOD
        const ownerships = await tx.contentOwnership.findMany({
          where: { contentId: content.id },
          include: { creator: true },
        });

        for (const ownership of ownerships) {
          const sharePct = new Prisma.Decimal(ownership.revenueSharePct.toString()).div(100);
          const creatorAmount = payment.amount.mul(sharePct);

          await tx.creatorEarning.create({
            data: {
              creatorId: ownership.creatorId,
              contentId: content.id,
              amount: creatorAmount,
              currency: payment.currency,
              sourceType: "RENTAL",
              paymentId: payment.id,
            },
          });

          // Update creator balance
          await tx.creatorProfile.update({
            where: { id: ownership.creatorId },
            data: {
              currentBalance: { increment: creatorAmount },
            },
          });
        }
      }
    }

    // D. Record Auditable Financial Ledger Entry
    const grossRevenue = payment.amount;
    const gatewayFeeRate = payment.provider === "MPESA_DARAJA" ? new Prisma.Decimal("0.015") : new Prisma.Decimal("0.029"); // 1.5% vs 2.9%
    const gatewayFee = grossRevenue.mul(gatewayFeeRate);
    const creatorRevShare = new Prisma.Decimal("0.00");
    const netPlatformRev = grossRevenue.sub(gatewayFee).sub(creatorRevShare);

    await tx.financialLedger.create({
      data: {
        paymentId: payment.id,
        grossRevenue,
        gatewayFee,
        creatorRevShare,
        netPlatformRev,
        currency: payment.currency,
      },
    });

    return {
      payment: confirmedPayment,
      subscriptionId: createdSubscriptionId,
      rentalId: createdRentalId,
    };
  });

  return { status: "SUCCESS", alreadyProcessed: false, ...result };
}
