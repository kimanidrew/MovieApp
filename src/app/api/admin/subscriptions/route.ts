import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin(req);
    if (error) return error;

    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: { select: { id: true, email: true } },
        plan: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = subscriptions.map((s) => ({
      ...s,
      plan: {
        ...s.plan,
        price: s.plan.price.toString(),
      },
    }));

    return NextResponse.json({ subscriptions: formatted });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }
}
