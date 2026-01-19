// Tenant Revenue Tracking Library
// Handles recording and managing revenue transactions for multi-tenant platform

import { collection, doc, addDoc, updateDoc, getDoc, getDocs, query, where, orderBy, Timestamp, increment } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { RevenueTransaction, RevenueTransactionCreate } from '@/types/revenue';

/**
 * Record a revenue transaction for a tenant
 * @param transactionData - Transaction data to record
 * @returns Created transaction ID
 */
export async function recordTenantRevenue(
  transactionData: RevenueTransactionCreate
): Promise<string> {
  const db = getDb();

  const transaction: Omit<RevenueTransaction, 'id'> = {
    ...transactionData,
    status: 'pending',
    createdAt: new Date(),
  };

  // Add transaction to revenueTransactions collection
  const transactionRef = await addDoc(
    collection(db, 'revenueTransactions'),
    {
      ...transaction,
      createdAt: Timestamp.fromDate(transaction.createdAt),
      metadata: transactionData.metadata || {},
    }
  );

  // If status is succeeded, update tenant revenue balance
  if (transactionData.metadata?.status === 'succeeded') {
    await updateTenantRevenueBalance(transactionData.tenantId, transactionData.amount);
  }

  return transactionRef.id;
}

/**
 * Update a revenue transaction status
 * @param transactionId - Transaction ID to update
 * @param status - New status
 */
export async function updateRevenueTransactionStatus(
  transactionId: string,
  status: 'succeeded' | 'failed' | 'refunded'
): Promise<void> {
  const db = getDb();
  const transactionRef = doc(db, 'revenueTransactions', transactionId);

  await updateDoc(transactionRef, {
    status,
    processedAt: Timestamp.now(),
  });

  // If succeeded, update tenant balance
  if (status === 'succeeded') {
    const transactionDoc = await getDoc(transactionRef);
    if (transactionDoc.exists()) {
      const data = transactionDoc.data() as RevenueTransaction;
      await updateTenantRevenueBalance(data.tenantId, data.amount);
    }
  }

  // If refunded, decrement tenant balance
  if (status === 'refunded') {
    const transactionDoc = await getDoc(transactionRef);
    if (transactionDoc.exists()) {
      const data = transactionDoc.data() as RevenueTransaction;
      await updateTenantRevenueBalance(data.tenantId, -data.amount);
    }
  }
}

/**
 * Update tenant revenue balance
 * @param tenantId - Tenant ID
 * @param amount - Amount to add (positive) or subtract (negative) in cents
 */
export async function updateTenantRevenueBalance(
  tenantId: string,
  amount: number
): Promise<void> {
  const db = getDb();
  const tenantRef = doc(db, 'tenants', tenantId);

  // Use Firestore's increment to safely update the balance
  await updateDoc(tenantRef, {
    revenueBalance: increment(amount),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get all revenue transactions for a tenant
 * @param tenantId - Tenant ID
 * @param dateRange - Optional date range filter
 * @returns Array of revenue transactions
 */
export async function getTenantRevenue(
  tenantId: string,
  dateRange?: { start: Date; end: Date }
): Promise<RevenueTransaction[]> {
  const db = getDb();

  let q = query(
    collection(db, 'revenueTransactions'),
    where('tenantId', '==', tenantId),
    orderBy('createdAt', 'desc')
  );

  // Apply date range filter if provided
  if (dateRange) {
    q = query(
      q,
      where('createdAt', '>=', Timestamp.fromDate(dateRange.start)),
      where('createdAt', '<=', Timestamp.fromDate(dateRange.end))
    );
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      processedAt: data.processedAt?.toDate(),
    } as RevenueTransaction;
  });
}

/**
 * Get revenue breakdown by type for a tenant
 * @param tenantId - Tenant ID
 * @param dateRange - Optional date range filter
 * @returns Object with revenue totals by type
 */
export async function getRevenueBreakdown(
  tenantId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  advertiser: number;
  directory: number;
  subscriber: number;
  total: number;
}> {
  const transactions = await getTenantRevenue(tenantId, dateRange);

  const breakdown = {
    advertiser: 0,
    directory: 0,
    subscriber: 0,
    total: 0,
  };

  transactions.forEach((transaction) => {
    if (transaction.status === 'succeeded') {
      breakdown[transaction.type] += transaction.amount;
      breakdown.total += transaction.amount;
    }
  });

  return breakdown;
}

/**
 * Record a disbursement to a tenant
 * @param tenantId - Tenant ID
 * @param amount - Amount disbursed in cents
 */
export async function recordDisbursement(
  tenantId: string,
  amount: number
): Promise<void> {
  const db = getDb();
  const tenantRef = doc(db, 'tenants', tenantId);

  // Deduct from revenue balance and update last disbursement date
  await updateDoc(tenantRef, {
    revenueBalance: increment(-amount),
    lastDisbursementDate: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Create a transaction record for the disbursement
  await addDoc(collection(db, 'revenueTransactions'), {
    tenantId,
    type: 'disbursement',
    amount: -amount,
    status: 'succeeded',
    stripeSessionId: '',
    customerId: 'platform',
    metadata: {
      type: 'disbursement',
      note: 'Revenue disbursement to tenant',
    },
    createdAt: Timestamp.now(),
    processedAt: Timestamp.now(),
  });
}

/**
 * Get total revenue balance for a tenant
 * @param tenantId - Tenant ID
 * @returns Revenue balance in cents
 */
export async function getTenantRevenueBalance(tenantId: string): Promise<number> {
  const db = getDb();
  const tenantRef = doc(db, 'tenants', tenantId);
  const tenantDoc = await getDoc(tenantRef);

  if (!tenantDoc.exists()) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  return tenantDoc.data().revenueBalance || 0;
}
