import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

const DAY_IN_MS = 86_400_000;

export async function POST() {
  try {
    const { userId } = auth();

    if (!userId) return new NextResponse("Unauthorized.", { status: 401 });

    const now = Date.now();
    const periodEnd = new Date(now + 30 * DAY_IN_MS);

    // Upsert a dummy subscription valid for 30 days
    await db.userSubscription.upsert({
      where: { userId },
      update: {
        stripeSubscriptionId: "dummy_sub_test",
        stripeCustomerId: "dummy_cus_test",
        stripePriceId: "dummy_price_test",
        stripeCurrentPeriodEnd: periodEnd,
      },
      create: {
        userId,
        stripeSubscriptionId: "dummy_sub_test",
        stripeCustomerId: "dummy_cus_test",
        stripePriceId: "dummy_price_test",
        stripeCurrentPeriodEnd: periodEnd,
      },
    });

    return NextResponse.json({ success: true, periodEnd }, { status: 200 });
  } catch (error: unknown) {
    console.error("[DUMMY_SUB_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}


