// Tenant and SaaS Types

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type TenantPlan = 'starter' | 'growth' | 'professional' | 'enterprise';

export interface TenantSettings {
  siteName: string;
  tagline: string;
  primaryColor: string;
  logo?: string;
  favicon?: string;
  customDomain?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  ownerId: string;
  status: TenantStatus;
  plan: TenantPlan;

  // Dual Credit Pool System
  subscriptionCredits: number;      // Monthly allocation (resets each billing cycle)
  topOffCredits: number;            // Purchased credits (never expire, carry over)

  // Billing Information
  currentBillingStart?: Date;       // Start of current billing cycle
  nextBillingDate?: Date;           // When subscription renews
  stripeCustomerId?: string;        // Stripe customer ID
  stripeSubscriptionId?: string;    // Stripe subscription ID

  createdAt: Date;
  updatedAt: Date;
  settings: TenantSettings;
  trialEndsAt?: Date;
}

export interface TenantCreate {
  name: string;
  slug: string;
  ownerId: string;
  plan?: TenantPlan;
  settings?: Partial<TenantSettings>;
}

// Credit System Types

export type CreditTransactionType = 'subscription' | 'topoff' | 'usage' | 'refund' | 'expiry' | 'bonus';
export type CreditPoolType = 'subscription' | 'topoff';
export type CreditFeature = 'article' | 'image' | 'image_hd' | 'tts' | 'agent' | 'ad_creation' | 'ad_manual';

export interface CreditTransaction {
  id: string;
  tenantId: string;
  type: CreditTransactionType;
  creditPool: CreditPoolType;           // Which pool was affected
  amount: number;                        // Positive = add, Negative = deduct
  subscriptionBalance: number;           // Subscription credits after transaction
  topOffBalance: number;                 // Top-off credits after transaction
  feature?: CreditFeature;
  referenceId?: string;                  // Article ID, Image ID, etc.
  description: string;
  createdAt: Date;
  stripePaymentId?: string;
  stripeSessionId?: string;
  billingCycleId?: string;               // Links to billing period
}

export interface CreditBalance {
  tenantId: string;
  subscriptionCredits: number;
  topOffCredits: number;
  totalCredits: number;
  lastUpdated: Date;
}

// Subscription Tiers

export type SubscriptionTierId = 'starter' | 'growth' | 'professional' | 'enterprise';

export interface SubscriptionTier {
  id: SubscriptionTierId;
  name: string;
  monthlyPrice: number;          // In cents (e.g., 1900 = $19.00)
  includedCredits: number;       // Base credits included
  bonusCredits: number;          // Extra loyalty credits
  totalCredits: number;          // includedCredits + bonusCredits
  pricePerCredit: number;        // Calculated: monthlyPrice / totalCredits
  description: string;
  popular?: boolean;
  stripePriceId?: string;        // Stripe Price ID for this tier
}

// Top-Off Packs (One-Time Purchases)

export type TopOffPackId = 'small' | 'medium' | 'large' | 'bulk';

export interface TopOffPack {
  id: TopOffPackId;
  name: string;
  credits: number;
  price: number;                 // In cents (e.g., 500 = $5.00)
  pricePerCredit: number;        // Calculated: price / credits
  description: string;
  stripePriceId?: string;        // Stripe Price ID for this pack
}

// Advertiser Types

export type AdvertiserStatus = 'pending' | 'active' | 'paused' | 'cancelled';
export type AdvertiserTier = 'basic' | 'featured' | 'premium';

export interface Advertiser {
  id: string;
  tenantId: string;
  businessName: string;
  businessId?: string;         // Link to Business in directory
  tier: AdvertiserTier;
  monthlyRate: number;         // What subscriber charges advertiser
  status: AdvertiserStatus;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  lastPaymentDate?: Date;
  nextBillingDate?: Date;
  totalRevenue: number;        // Lifetime revenue from this advertiser
  createdAt: Date;
  updatedAt: Date;
}

export interface AdvertiserCreate {
  tenantId: string;
  businessName: string;
  businessId?: string;
  tier?: AdvertiserTier;
  monthlyRate: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

// Ad Types

export type AdStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'expired';
export type AdSize = 'banner' | 'sidebar' | 'inline' | 'featured';

export interface Ad {
  id: string;
  tenantId: string;
  advertiserId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  size: AdSize;
  status: AdStatus;
  impressions: number;
  clicks: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdWithAI: boolean;
  creditsCost: number;         // Credits spent to create this ad
}

export interface AdCreate {
  tenantId: string;
  advertiserId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  size?: AdSize;
  useAI?: boolean;             // Whether to generate with AI
}
