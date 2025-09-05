import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user)
      return new NextResponse("Unauthorized.", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const currency: string = (body?.currency || "INR").toString().toLowerCase();
    const amountNumber: number = Number.isFinite(Number(body?.amount))
      ? Math.max(1, Math.floor(Number(body?.amount)))
      : 199; // default amount in major units

    // Stripe expects minor units (paise/cents)
    const unitAmountMinor = amountNumber * 100;

    const successUrl = absoluteUrl("/test-checkout?status=success");
    const cancelUrl = absoluteUrl("/test-checkout?status=cancel");

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: user.emailAddresses[0].emailAddress,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Genius Pro (Test)",
              description: "Unlimited AI Generations (Test Mode).",
            },
            unit_amount: unitAmountMinor,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        testMode: "true",
        selectedCurrency: currency,
      },
    });

    return NextResponse.json({ url: stripeSession.url }, { status: 200 });
  } catch (error: unknown) {
    console.error("[STRIPE_TEST_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}


