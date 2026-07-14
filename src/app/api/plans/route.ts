import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { priceCents: "asc" },
    });

    // Fallback seed inside the API if your DB is empty during local development
    if (plans.length === 0) {
      const defaultPlans = [
        { name: "Standard With Ads", slug: "standard-ads", maxSimultaneousScreens: 2, maxResolution: "1080p", allowsDownloads: false, priceCents: 699, currency: "USD" },
        { name: "Standard Basic", slug: "standard", maxSimultaneousScreens: 2, maxResolution: "1080p", allowsDownloads: true, priceCents: 1549, currency: "USD" },
        { name: "Premium Ultra 4K", slug: "premium-ultra-4k", maxSimultaneousScreens: 4, maxResolution: "UHD_4K", allowsDownloads: true, priceCents: 2299, currency: "USD" },
      ];

      await prisma.subscriptionPlan.createMany({ data: defaultPlans });
      const seededPlans = await prisma.subscriptionPlan.findMany({ orderBy: { priceCents: "asc" } });
      return NextResponse.json({ plans: seededPlans });
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Failed to query active plans registry:", error);
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}