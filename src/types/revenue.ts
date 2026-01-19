// Revenue Transaction Types for Multi-Tenant Platform

export type RevenueType = 'advertiser' | 'directory' | 'subscriber';
export type RevenueStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface RevenueTransaction {
  id: string;
  tenantId: string;
  type: RevenueType;
  customerId: string;                 // Firebase user ID who made the payment
  amount: number;                     // In cents
  status: RevenueStatus;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  metadata: {
    advertiserId?: string;
    businessId?: string;
    tier?: string;
    pricingModel?: string;
    [key: string]: any;
  };
  createdAt: Date;
  processedAt?: Date;
}

export interface RevenueTransactionCreate {
  tenantId: string;
  type: RevenueType;
  customerId: string;
  amount: number;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  metadata?: Record<string, any>;
}
