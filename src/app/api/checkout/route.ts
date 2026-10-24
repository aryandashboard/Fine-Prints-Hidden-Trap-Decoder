import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const PLANS = {
  price_plus: {
    name: 'Plus',
    amountCents: 1200,
  },
  price_pro: {
    name: 'Pro',
    amountCents: 2900,
  },
} as const;

type PlanId = keyof typeof PLANS;

function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && value in PLANS;
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-08-26.dahlia',
  });
}

function getAppOrigin(request: Request) {
  const configuredUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  const rawOrigin =
    configuredUrl || (process.env.NODE_ENV === 'development' ? request.headers.get('origin') : null);

  if (!rawOrigin) {
    return null;
  }

  try {
    const origin = new URL(rawOrigin);

    if (origin.protocol !== 'https:' && origin.protocol !== 'http:') {
      return null;
    }

    return origin.origin;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { planId?: unknown } | null;

    if (!body || !isPlanId(body.planId)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const origin = getAppOrigin(request);

    if (!origin) {
      return NextResponse.json({ error: 'App URL is not configured' }, { status: 500 });
    }

    const plan = PLANS[body.planId];
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Fine Prints Decoder - ${plan.name} Plan`,
              description: 'AI-powered contract risk analysis.',
            },
            unit_amount: plan.amountCents,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      integration_identifier: 'fineprints_checkout_qjvmtxla',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown checkout error';
    console.error('Stripe Checkout Error:', message);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}
