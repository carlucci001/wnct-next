import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const TENANTS_COLLECTION = 'tenants';
const CREDIT_TRANSACTIONS_COLLECTION = 'creditTransactions';

/**
 * GET - Fetch credit balance and usage data for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default';

    const db = getAdminFirestore();

    // Get tenant data
    const tenantRef = db.collection(TENANTS_COLLECTION).doc(tenantId);
    const tenantSnap = await tenantRef.get();

    let balance = {
      tenantId,
      subscriptionCredits: 100, // Default starting credits
      topOffCredits: 0,
      totalCredits: 100,
      lastUpdated: new Date(),
    };

    let plan = 'starter';
    let daysUntilRenewal = 30;

    if (tenantSnap.exists) {
      const data = tenantSnap.data();
      balance = {
        tenantId,
        subscriptionCredits: data?.subscriptionCredits || 100,
        topOffCredits: data?.topOffCredits || 0,
        totalCredits: (data?.subscriptionCredits || 100) + (data?.topOffCredits || 0),
        lastUpdated: data?.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      };
      plan = data?.plan || 'starter';

      // Calculate days until renewal
      if (data?.nextBillingDate) {
        const nextBilling = data.nextBillingDate.toDate ? data.nextBillingDate.toDate() : new Date(data.nextBillingDate);
        const now = new Date();
        const diff = nextBilling.getTime() - now.getTime();
        daysUntilRenewal = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
    } else {
      // Initialize default tenant if not exists
      const defaultTenant = {
        id: tenantId,
        name: 'Default Tenant',
        slug: tenantId,
        status: 'active',
        plan: 'starter',
        subscriptionCredits: 100,
        topOffCredits: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };
      await tenantRef.set(defaultTenant);
    }

    // Get recent transactions
    const transactionsQuery = db
      .collection(CREDIT_TRANSACTIONS_COLLECTION)
      .where('tenantId', '==', tenantId)
      .orderBy('createdAt', 'desc')
      .limit(50);

    const transactionsSnap = await transactionsQuery.get();
    const transactions = transactionsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      };
    });

    // Calculate usage stats for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usageQuery = db
      .collection(CREDIT_TRANSACTIONS_COLLECTION)
      .where('tenantId', '==', tenantId)
      .where('type', '==', 'usage')
      .where('createdAt', '>=', startOfMonth)
      .orderBy('createdAt', 'desc');

    const usageSnap = await usageQuery.get();

    const byFeature: Record<string, number> = {};
    let totalUsed = 0;

    usageSnap.docs.forEach(doc => {
      const data = doc.data();
      const amount = Math.abs(data.amount || 0);
      totalUsed += amount;

      if (data.feature) {
        byFeature[data.feature] = (byFeature[data.feature] || 0) + amount;
      }
    });

    return NextResponse.json({
      success: true,
      balance,
      plan,
      daysUntilRenewal,
      transactions,
      usageStats: {
        totalUsed,
        byFeature,
      },
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}