import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const TENANTS_COLLECTION = 'tenants';
const CREDIT_TRANSACTIONS_COLLECTION = 'creditTransactions';

/**
 * POST - Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret === 'whsec_your_webhook_secret') {
      // In development, skip signature verification
      console.warn('Webhook secret not configured - skipping signature verification');
    }

    let event: Stripe.Event;

    try {
      if (webhookSecret && webhookSecret !== 'whsec_your_webhook_secret') {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } else {
        // Parse without verification in development
        event = JSON.parse(body) as Stripe.Event;
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const db = getAdminFirestore();

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const { type, tenantId, credits, planId, packId } = metadata;

        if (!tenantId) {
          console.error('Missing tenantId in session metadata');
          break;
        }

        const creditsToAdd = parseInt(credits || '0', 10);
        const tenantRef = db.collection(TENANTS_COLLECTION).doc(tenantId);
        const tenantSnap = await tenantRef.get();
        const tenantData = tenantSnap.exists ? tenantSnap.data() : {};

        if (type === 'topoff') {
          // Add top-off credits (never expire)
          const currentTopOff = tenantData?.topOffCredits || 0;
          const newTopOff = currentTopOff + creditsToAdd;

          await tenantRef.set({
            ...tenantData,
            topOffCredits: newTopOff,
            updatedAt: new Date(),
          }, { merge: true });

          // Record transaction
          await db.collection(CREDIT_TRANSACTIONS_COLLECTION).add({
            tenantId,
            type: 'topoff',
            creditPool: 'topoff',
            amount: creditsToAdd,
            subscriptionBalance: tenantData?.subscriptionCredits || 0,
            topOffBalance: newTopOff,
            description: `Purchased ${creditsToAdd} top-off credits`,
            createdAt: new Date(),
            stripeSessionId: session.id,
            stripePaymentId: session.payment_intent as string,
          });

          console.log(`Added ${creditsToAdd} top-off credits to tenant ${tenantId}`);
        }

        if (type === 'subscription') {
          // Set up new subscription credits
          const now = new Date();
          const nextBillingDate = new Date(now);
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

          await tenantRef.set({
            ...tenantData,
            plan: planId || 'starter',
            subscriptionCredits: creditsToAdd,
            currentBillingStart: now,
            nextBillingDate,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status: 'active',
            updatedAt: now,
          }, { merge: true });

          // Record transaction
          await db.collection(CREDIT_TRANSACTIONS_COLLECTION).add({
            tenantId,
            type: 'subscription',
            creditPool: 'subscription',
            amount: creditsToAdd,
            subscriptionBalance: creditsToAdd,
            topOffBalance: tenantData?.topOffCredits || 0,
            description: `Subscription started: ${creditsToAdd} monthly credits (${planId} plan)`,
            createdAt: now,
            stripeSessionId: session.id,
            stripeSubscriptionId: session.subscription as string,
          });

          console.log(`Subscription started for tenant ${tenantId}: ${planId} plan with ${creditsToAdd} credits`);
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        // Handle recurring subscription payments
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.billing_reason === 'subscription_cycle') {
          // This is a renewal payment
          const subscriptionId = invoice.subscription as string;

          // Find tenant by subscription ID
          const tenantsQuery = await db
            .collection(TENANTS_COLLECTION)
            .where('stripeSubscriptionId', '==', subscriptionId)
            .limit(1)
            .get();

          if (!tenantsQuery.empty) {
            const tenantDoc = tenantsQuery.docs[0];
            const tenantData = tenantDoc.data();
            const tenantId = tenantDoc.id;

            // Get the subscription to find the plan
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const planMetadata = subscription.metadata || {};
            const planId = planMetadata.planId || tenantData.plan || 'starter';

            // Calculate credits based on plan
            const planCredits: Record<string, number> = {
              starter: 175,
              growth: 575,
              professional: 1400,
              enterprise: 4500,
            };
            const creditsToAdd = planCredits[planId] || 175;

            // Expire old subscription credits, add new ones
            const expiredCredits = tenantData.subscriptionCredits || 0;
            const now = new Date();
            const nextBillingDate = new Date(now);
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

            await tenantDoc.ref.update({
              subscriptionCredits: creditsToAdd,
              currentBillingStart: now,
              nextBillingDate,
              updatedAt: now,
            });

            // Record expiry if there were remaining credits
            if (expiredCredits > 0) {
              await db.collection(CREDIT_TRANSACTIONS_COLLECTION).add({
                tenantId,
                type: 'expiry',
                creditPool: 'subscription',
                amount: -expiredCredits,
                subscriptionBalance: 0,
                topOffBalance: tenantData.topOffCredits || 0,
                description: `Expired ${expiredCredits} unused subscription credits`,
                createdAt: now,
              });
            }

            // Record renewal
            await db.collection(CREDIT_TRANSACTIONS_COLLECTION).add({
              tenantId,
              type: 'subscription',
              creditPool: 'subscription',
              amount: creditsToAdd,
              subscriptionBalance: creditsToAdd,
              topOffBalance: tenantData.topOffCredits || 0,
              description: `Monthly subscription renewal: ${creditsToAdd} credits`,
              createdAt: now,
              stripeInvoiceId: invoice.id,
            });

            console.log(`Subscription renewed for tenant ${tenantId}: ${creditsToAdd} credits`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Handle subscription cancellation
        const subscription = event.data.object as Stripe.Subscription;

        const tenantsQuery = await db
          .collection(TENANTS_COLLECTION)
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();

        if (!tenantsQuery.empty) {
          const tenantDoc = tenantsQuery.docs[0];

          await tenantDoc.ref.update({
            status: 'cancelled',
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          });

          console.log(`Subscription cancelled for tenant ${tenantDoc.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}