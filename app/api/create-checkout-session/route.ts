import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const ALLOWED_AMOUNTS = [5, 15, 30] as const;
type AllowedAmount = (typeof ALLOWED_AMOUNTS)[number];

function isAllowedAmount(value: unknown): value is AllowedAmount {
  return ALLOWED_AMOUNTS.includes(value as AllowedAmount);
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);

  let amount: unknown;
  try {
    const body = (await req.json()) as { amount?: unknown };
    amount = body.amount;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isAllowedAmount(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? "";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amount * 100,
          product_data: {
            name: "Soutenir At-tasbih / Support At-tasbih",
            description: "Don volontaire / Voluntary donation",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/donate?success=true`,
    cancel_url: `${origin}/donate`,
  });

  return NextResponse.json({ url: session.url });
}
