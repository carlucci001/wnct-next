import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured, getBaseUrl } from '@/lib/stripe';
import { SUBSCRIPTION_TIERS, TOPOFF_PACKS } from '@/config/creditPricing';

export const dynamic = 'force-dynamic';

/**
 * POST - Create a Stripe Checkout session for subscription or top-off
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        {
          error: 'Stripe is not configured',
          message: 'Please add your Stripe API keys to the environment variables. Visit https://dashboard.stripe.com/apikeys to get your keys.'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { type, planId, packId, tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl();

    if (type === 'subscription') {
      // Find the subscription tier
      const tier = SUBSCRIPTION_TIERS.find(t => t.id === planId);
      if (!tier) {
        return NextResponse.json(
          { error: 'Invalid plan ID' },
          { status: 400 }
        );
      }

      // Create Stripe Checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${tier.name} Plan`,
                description: `${tier.totalCredits} credits/month (includes ${tier.bonusCredits} bonus credits)`,
                metadata: {
                  tierId: tier.id,
                  credits: tier.totalCredits.toString(),
                },
              },
              unit_amount: tier.monthlyPrice,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'subscription',
          tenantId,
          planId: tier.id,
          credits: tier.totalCredits.toString(),
        },
        success_url: `${baseUrl}/admin?tab=credits&success=subscription&plan=${tier.id}`,
        cancel_url: `${baseUrl}/admin?tab=credits&canceled=true`,
        allow_promotion_codes: true,
      });

      return NextResponse.json({ url: session.url });
    }

    if (type === 'topoff') {
      // Find the top-off pack
      const pack = TOPOFF_PACKS.find(p => p.id === packId);
      if (!pack) {
        return NextResponse.json(
          { error: 'Invalid pack ID' },
          { status: 400 }
        );
      }

      // Create Stripe Checkout session for one-time purchase
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${pack.name} Credit Pack`,
                description: `${pack.credits} credits (never expire)`,
                metadata: {
                  packId: pack.id,
                  credits: pack.credits.toString(),
                },
              },
              unit_amount: pack.price,
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'topoff',
          tenantId,
          packId: pack.id,
          credits: pack.credits.toString(),
        },
        success_url: `${baseUrl}/admin?tab=credits&success=topoff&credits=${pack.credits}`,
        cancel_url: `${baseUrl}/admin?tab=credits&canceled=true`,
        allow_promotion_codes: true,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "subscription" or "topoff"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}