import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
} from 'firebase/firestore';
import {
  CreditTransaction,
  CreditTransactionType,
  CreditFeature,
  CreditBalance,
  CreditPoolType,
} from '@/types/tenant';
import { CREDIT_COSTS, calculateTTSCredits, getSubscriptionCredits } from '@/config/creditPricing';

const TENANTS_COLLECTION = 'tenants';
const CREDIT_TRANSACTIONS_COLLECTION = 'creditTransactions';

// ============================================================================
// Credit Balance Operations (Dual Pool)
// ============================================================================

/**
 * Get the current credit balance for a tenant (both pools)
 */
export async function getCreditBalance(tenantId: string): Promise<CreditBalance> {
  try {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);
    const tenantSnap = await getDoc(tenantRef);

    if (!tenantSnap.exists()) {
      console.error(`Tenant ${tenantId} not found`);
      return {
        tenantId,
        subscriptionCredits: 0,
        topOffCredits: 0,
        totalCredits: 0,
        lastUpdated: new Date(),
      };
    }

    const data = tenantSnap.data();
    const subscriptionCredits = data.subscriptionCredits || 0;
    const topOffCredits = data.topOffCredits || 0;

    return {
      tenantId,
      subscriptionCredits,
      topOffCredits,
      totalCredits: subscriptionCredits + topOffCredits,
      lastUpdated: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    };
  } catch (error) {
    console.error('Error getting credit balance:', error);
    return {
      tenantId,
      subscriptionCredits: 0,
      topOffCredits: 0,
      totalCredits: 0,
      lastUpdated: new Date(),
    };
  }
}

/**
 * Get total available credits (subscription + top-off)
 */
export async function getTotalCredits(tenantId: string): Promise<number> {
  const balance = await getCreditBalance(tenantId);
  return balance.totalCredits;
}

/**
 * Check if tenant has enough credits for an operation
 */
export async function hasEnoughCredits(
  tenantId: string,
  requiredCredits: number
): Promise<boolean> {
  const balance = await getCreditBalance(tenantId);
  return balance.totalCredits >= requiredCredits;
}

/**
 * Check if tenant can perform a specific feature
 */
export async function canUseFeature(
  tenantId: string,
  feature: CreditFeature,
  quantity: number = 1
): Promise<{ allowed: boolean; required: number; balance: CreditBalance }> {
  const required = CREDIT_COSTS[feature] * quantity;
  const balance = await getCreditBalance(tenantId);

  return {
    allowed: balance.totalCredits >= required,
    required,
    balance,
  };
}

/**
 * Check TTS credits needed based on character count
 */
export async function canUseTTS(
  tenantId: string,
  characterCount: number
): Promise<{ allowed: boolean; required: number; balance: CreditBalance }> {
  const required = calculateTTSCredits(characterCount);
  const balance = await getCreditBalance(tenantId);

  return {
    allowed: balance.totalCredits >= required,
    required,
    balance,
  };
}

// ============================================================================
// Credit Deduction Operations (Subscription First, Then Top-Off)
// ============================================================================

interface DeductionResult {
  success: boolean;
  transactionId: string;
  subscriptionCredits: number;
  topOffCredits: number;
  totalCredits: number;
  deductedFromSubscription: number;
  deductedFromTopOff: number;
}

/**
 * Deduct credits for a feature usage (atomic transaction)
 * Priority: Subscription credits first, then top-off credits
 */
export async function deductCredits(
  tenantId: string,
  feature: CreditFeature,
  referenceId?: string,
  description?: string,
  quantity: number = 1
): Promise<DeductionResult> {
  const creditCost = CREDIT_COSTS[feature] * quantity;

  try {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);

    let result: DeductionResult = {
      success: false,
      transactionId: '',
      subscriptionCredits: 0,
      topOffCredits: 0,
      totalCredits: 0,
      deductedFromSubscription: 0,
      deductedFromTopOff: 0,
    };

    await runTransaction(db, async (transaction) => {
      const tenantSnap = await transaction.get(tenantRef);

      if (!tenantSnap.exists()) {
        throw new Error('Tenant not found');
      }

      const data = tenantSnap.data();
      let subscriptionCredits = data.subscriptionCredits || 0;
      let topOffCredits = data.topOffCredits || 0;
      const totalAvailable = subscriptionCredits + topOffCredits;

      if (totalAvailable < creditCost) {
        throw new Error(`Insufficient credits. Required: ${creditCost}, Available: ${totalAvailable}`);
      }

      // Deduct from subscription credits first, then top-off
      let deductedFromSubscription = 0;
      let deductedFromTopOff = 0;

      if (subscriptionCredits >= creditCost) {
        // All from subscription
        deductedFromSubscription = creditCost;
        subscriptionCredits -= creditCost;
      } else {
        // Some from subscription, rest from top-off
        deductedFromSubscription = subscriptionCredits;
        const remaining = creditCost - subscriptionCredits;
        subscriptionCredits = 0;
        deductedFromTopOff = remaining;
        topOffCredits -= remaining;
      }

      // Update tenant balances
      transaction.update(tenantRef, {
        subscriptionCredits,
        topOffCredits,
        updatedAt: new Date(),
      });

      // Create transaction record
      const transactionRef = doc(collection(db, CREDIT_TRANSACTIONS_COLLECTION));
      const transactionId = transactionRef.id;

      // Determine which pool was primarily affected
      const creditPool: CreditPoolType = deductedFromSubscription >= deductedFromTopOff
        ? 'subscription'
        : 'topoff';

      const transactionData: Omit<CreditTransaction, 'id'> = {
        tenantId,
        type: 'usage',
        creditPool,
        amount: -creditCost,
        subscriptionBalance: subscriptionCredits,
        topOffBalance: topOffCredits,
        feature,
        referenceId,
        description: description || `Used ${creditCost} credits for ${feature}`,
        createdAt: new Date(),
      };

      transaction.set(transactionRef, transactionData);

      result = {
        success: true,
        transactionId,
        subscriptionCredits,
        topOffCredits,
        totalCredits: subscriptionCredits + topOffCredits,
        deductedFromSubscription,
        deductedFromTopOff,
      };
    });

    return result;
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
}

/**
 * Deduct credits for TTS based on character count
 */
export async function deductTTSCredits(
  tenantId: string,
  characterCount: number,
  referenceId?: string
): Promise<DeductionResult> {
  const creditsNeeded = calculateTTSCredits(characterCount);

  return deductCredits(
    tenantId,
    'tts',
    referenceId,
    `Text-to-speech: ${characterCount} characters (${creditsNeeded} credits)`,
    creditsNeeded
  );
}

// ============================================================================
// Subscription Credit Operations
// ============================================================================

interface SubscriptionRenewalResult {
  success: boolean;
  transactionId: string;
  expiredCredits: number;
  newCredits: number;
  subscriptionCredits: number;
  topOffCredits: number;
}

/**
 * Process subscription renewal (expire old credits, add new ones)
 * Called when Stripe invoice.payment_succeeded event fires
 */
export async function processSubscriptionRenewal(
  tenantId: string,
  plan: 'starter' | 'growth' | 'professional' | 'enterprise',
  stripePaymentId?: string,
  billingCycleId?: string
): Promise<SubscriptionRenewalResult> {
  const newCredits = getSubscriptionCredits(plan);

  try {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);

    let result: SubscriptionRenewalResult = {
      success: false,
      transactionId: '',
      expiredCredits: 0,
      newCredits,
      subscriptionCredits: 0,
      topOffCredits: 0,
    };

    await runTransaction(db, async (transaction) => {
      const tenantSnap = await transaction.get(tenantRef);

      if (!tenantSnap.exists()) {
        throw new Error('Tenant not found');
      }

      const data = tenantSnap.data();
      const expiredCredits = data.subscriptionCredits || 0;
      const topOffCredits = data.topOffCredits || 0;

      // Calculate new billing dates
      const now = new Date();
      const nextBillingDate = new Date(now);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      // Update tenant with new subscription credits
      transaction.update(tenantRef, {
        subscriptionCredits: newCredits,
        topOffCredits, // Unchanged
        plan,
        currentBillingStart: now,
        nextBillingDate,
        updatedAt: now,
      });

      // Create expiry transaction if there were remaining credits
      if (expiredCredits > 0) {
        const expiryRef = doc(collection(db, CREDIT_TRANSACTIONS_COLLECTION));
        transaction.set(expiryRef, {
          tenantId,
          type: 'expiry',
          creditPool: 'subscription',
          amount: -expiredCredits,
          subscriptionBalance: 0,
          topOffBalance: topOffCredits,
          description: `Expired ${expiredCredits} unused subscription credits`,
          createdAt: now,
          billingCycleId,
        });
      }

      // Create renewal transaction
      const renewalRef = doc(collection(db, CREDIT_TRANSACTIONS_COLLECTION));
      const transactionId = renewalRef.id;

      transaction.set(renewalRef, {
        tenantId,
        type: 'subscription',
        creditPool: 'subscription',
        amount: newCredits,
        subscriptionBalance: newCredits,
        topOffBalance: topOffCredits,
        description: `Monthly subscription renewal: ${newCredits} credits (${plan} plan)`,
        createdAt: now,
        stripePaymentId,
        billingCycleId,
      });

      result = {
        success: true,
        transactionId,
        expiredCredits,
        newCredits,
        subscriptionCredits: newCredits,
        topOffCredits,
      };
    });

    return result;
  } catch (error) {
    console.error('Error processing subscription renewal:', error);
    throw error;
  }
}

// ============================================================================
// Top-Off Credit Operations
// ============================================================================

interface TopOffResult {
  success: boolean;
  transactionId: string;
  creditsAdded: number;
  subscriptionCredits: number;
  topOffCredits: number;
  totalCredits: number;
}

/**
 * Add top-off credits (one-time purchase)
 * Top-off credits never expire and are used after subscription credits
 */
export async function addTopOffCredits(
  tenantId: string,
  credits: number,
  stripePaymentId?: string,
  stripeSessionId?: string
): Promise<TopOffResult> {
  try {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);

    let result: TopOffResult = {
      success: false,
      transactionId: '',
      creditsAdded: credits,
      subscriptionCredits: 0,
      topOffCredits: 0,
      totalCredits: 0,
    };

    await runTransaction(db, async (transaction) => {
      const tenantSnap = await transaction.get(tenantRef);

      if (!tenantSnap.exists()) {
        throw new Error('Tenant not found');
      }

      const data = tenantSnap.data();
      const subscriptionCredits = data.subscriptionCredits || 0;
      const newTopOffCredits = (data.topOffCredits || 0) + credits;

      // Update tenant balance
      transaction.update(tenantRef, {
        topOffCredits: newTopOffCredits,
        updatedAt: new Date(),
      });

      // Create transaction record
      const transactionRef = doc(collection(db, CREDIT_TRANSACTIONS_COLLECTION));
      const transactionId = transactionRef.id;

      transaction.set(transactionRef, {
        tenantId,
        type: 'topoff',
        creditPool: 'topoff',
        amount: credits,
        subscriptionBalance: subscriptionCredits,
        topOffBalance: newTopOffCredits,
        description: `Purchased ${credits} top-off credits`,
        createdAt: new Date(),
        stripePaymentId,
        stripeSessionId,
      });

      result = {
        success: true,
        transactionId,
        creditsAdded: credits,
        subscriptionCredits,
        topOffCredits: newTopOffCredits,
        totalCredits: subscriptionCredits + newTopOffCredits,
      };
    });

    return result;
  } catch (error) {
    console.error('Error adding top-off credits:', error);
    throw error;
  }
}

/**
 * Add bonus credits (goes to top-off pool so they don't expire)
 */
export async function addBonusCredits(
  tenantId: string,
  credits: number,
  reason: string
): Promise<TopOffResult> {
  try {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);

    let result: TopOffResult = {
      success: false,
      transactionId: '',
      creditsAdded: credits,
      subscriptionCredits: 0,
      topOffCredits: 0,
      totalCredits: 0,
    };

    await runTransaction(db, async (transaction) => {
      const tenantSnap = await transaction.get(tenantRef);

      if (!tenantSnap.exists()) {
        throw new Error('Tenant not found');
      }

      const data = tenantSnap.data();
      const subscriptionCredits = data.subscriptionCredits || 0;
      const newTopOffCredits = (data.topOffCredits || 0) + credits;

      // Update tenant balance
      transaction.update(tenantRef, {
        topOffCredits: newTopOffCredits,
        updatedAt: new Date(),
      });

      // Create transaction record
      const transactionRef = doc(collection(db, CREDIT_TRANSACTIONS_COLLECTION));
      const transactionId = transactionRef.id;

      transaction.set(transactionRef, {
        tenantId,
        type: 'bonus',
        creditPool: 'topoff',
        amount: credits,
        subscriptionBalance: subscriptionCredits,
        topOffBalance: newTopOffCredits,
        description: `Bonus: ${reason}`,
        createdAt: new Date(),
      });

      result = {
        success: true,
        transactionId,
        creditsAdded: credits,
        subscriptionCredits,
        topOffCredits: newTopOffCredits,
        totalCredits: subscriptionCredits + newTopOffCredits,
      };
    });

    return result;
  } catch (error) {
    console.error('Error adding bonus credits:', error);
    throw error;
  }
}

/**
 * Refund credits (adds to top-off pool)
 */
export async function refundCredits(
  tenantId: string,
  credits: number,
  reason: string,
  originalTransactionId?: string
): Promise<TopOffResult> {
  try {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);

    let result: TopOffResult = {
      success: false,
      transactionId: '',
      creditsAdded: credits,
      subscriptionCredits: 0,
      topOffCredits: 0,
      totalCredits: 0,
    };

    await runTransaction(db, async (transaction) => {
      const tenantSnap = await transaction.get(tenantRef);

      if (!tenantSnap.exists()) {
        throw new Error('Tenant not found');
      }

      const data = tenantSnap.data();
      const subscriptionCredits = data.subscriptionCredits || 0;
      const newTopOffCredits = (data.topOffCredits || 0) + credits;

      // Update tenant balance
      transaction.update(tenantRef, {
        topOffCredits: newTopOffCredits,
        updatedAt: new Date(),
      });

      // Create transaction record
      const transactionRef = doc(collection(db, CREDIT_TRANSACTIONS_COLLECTION));
      const transactionId = transactionRef.id;

      transaction.set(transactionRef, {
        tenantId,
        type: 'refund',
        creditPool: 'topoff',
        amount: credits,
        subscriptionBalance: subscriptionCredits,
        topOffBalance: newTopOffCredits,
        description: `Refund: ${reason}${originalTransactionId ? ` (original: ${originalTransactionId})` : ''}`,
        createdAt: new Date(),
      });

      result = {
        success: true,
        transactionId,
        creditsAdded: credits,
        subscriptionCredits,
        topOffCredits: newTopOffCredits,
        totalCredits: subscriptionCredits + newTopOffCredits,
      };
    });

    return result;
  } catch (error) {
    console.error('Error refunding credits:', error);
    throw error;
  }
}

// ============================================================================
// Transaction History
// ============================================================================

/**
 * Get credit transaction history for a tenant
 */
export async function getTransactionHistory(
  tenantId: string,
  limitCount: number = 50
): Promise<CreditTransaction[]> {
  try {
    const q = query(
      collection(db, CREDIT_TRANSACTIONS_COLLECTION),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      } as CreditTransaction;
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return [];
  }
}

/**
 * Get transaction history by type
 */
export async function getTransactionsByType(
  tenantId: string,
  type: CreditTransactionType,
  limitCount: number = 50
): Promise<CreditTransaction[]> {
  try {
    const q = query(
      collection(db, CREDIT_TRANSACTIONS_COLLECTION),
      where('tenantId', '==', tenantId),
      where('type', '==', type),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      } as CreditTransaction;
    });
  } catch (error) {
    console.error('Error getting transactions by type:', error);
    return [];
  }
}

/**
 * Get usage statistics for a tenant
 */
export async function getUsageStats(
  tenantId: string,
  days: number = 30
): Promise<{
  totalUsed: number;
  totalTopOffPurchased: number;
  totalSubscriptionReceived: number;
  byFeature: Record<CreditFeature, number>;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      collection(db, CREDIT_TRANSACTIONS_COLLECTION),
      where('tenantId', '==', tenantId),
      where('createdAt', '>=', startDate),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    let totalUsed = 0;
    let totalTopOffPurchased = 0;
    let totalSubscriptionReceived = 0;
    const byFeature: Record<string, number> = {};

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();

      if (data.type === 'usage') {
        totalUsed += Math.abs(data.amount);
        if (data.feature) {
          byFeature[data.feature] = (byFeature[data.feature] || 0) + Math.abs(data.amount);
        }
      } else if (data.type === 'topoff') {
        totalTopOffPurchased += data.amount;
      } else if (data.type === 'subscription') {
        totalSubscriptionReceived += data.amount;
      }
    });

    return {
      totalUsed,
      totalTopOffPurchased,
      totalSubscriptionReceived,
      byFeature: byFeature as Record<CreditFeature, number>,
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      totalUsed: 0,
      totalTopOffPurchased: 0,
      totalSubscriptionReceived: 0,
      byFeature: {} as Record<CreditFeature, number>,
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get credit cost for a feature
 */
export function getCreditCost(feature: CreditFeature): number {
  return CREDIT_COSTS[feature];
}

/**
 * Calculate total cost for multiple features
 */
export function calculateTotalCost(
  features: { feature: CreditFeature; quantity: number }[]
): number {
  return features.reduce((total, { feature, quantity }) => {
    return total + CREDIT_COSTS[feature] * quantity;
  }, 0);
}

/**
 * Calculate days until subscription renewal
 */
export async function getDaysUntilRenewal(tenantId: string): Promise<number> {
  try {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);
    const tenantSnap = await getDoc(tenantRef);

    if (!tenantSnap.exists()) {
      return 0;
    }

    const data = tenantSnap.data();
    const nextBillingDate = data.nextBillingDate?.toDate
      ? data.nextBillingDate.toDate()
      : data.nextBillingDate;

    if (!nextBillingDate) {
      return 0;
    }

    const now = new Date();
    const diff = nextBillingDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  } catch (error) {
    console.error('Error getting days until renewal:', error);
    return 0;
  }
}
