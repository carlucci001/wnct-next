// Tenant and SaaS Types

import type { AdvertiserPricingConfig } from '@/config/revenueStreams';

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

export interface TenantFeatures {
  advertisingEnabled: boolean;
  directoryEnabled: boolean;
  newsletterEnabled: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  ownerId: string;
  status: TenantStatus;
  plan: TenantPlan;

  // Dual Credit Pool System (for platform features)
  subscriptionCredits: number;      // Monthly allocation (resets each billing cycle)
  topOffCredits: number;            // Purchased credits (never expire, carry over)

  // Billing Information (for platform subscription)
  currentBillingStart?: Date;       // Start of current billing cycle
  nextBillingDate?: Date;           // When subscription renews
  stripeCustomerId?: string;        // Stripe customer ID
  stripeSubscriptionId?: string;    // Stripe subscription ID

  // Revenue Tracking (Payment Proxy Model)
  revenueBalance: number;           // Accumulated revenue to disburse to tenant
  lastDisbursementDate?: Date;      // When revenue was last disbursed

  // Future: Stripe Connect
  stripeConnectedAccountId?: string;     // Stripe Connected Account ID
  stripeConnectedOnboarded?: boolean;    // Whether Stripe Connect onboarding is complete

  // Advertiser Pricing Configuration
  advertiserPricing?: AdvertiserPricingConfig;

  // Feature Flags
  features?: TenantFeatures;

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

export type AdvertiserStatus = 'pending_payment' | 'pending_review' | 'active' | 'paused' | 'cancelled';
export type AdvertiserTier = 'basic' | 'featured' | 'premium';

export interface Advertiser {
  id: string;
  tenantId: string;
  userId: string;              // Firebase user ID who owns this advertiser account
  businessName: string;
  businessId?: string;         // Link to Business in directory (if exists)
  businessUrl?: string;        // Business website URL
  tier: AdvertiserTier;
  monthlyRate: number;         // What subscriber charges advertiser (deprecated - use pricing config)
  status: AdvertiserStatus;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;

  // Payment tracking
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  lastPaymentDate?: Date;
  nextBillingDate?: Date;
  totalRevenue: number;        // Lifetime revenue from this advertiser

  // Pricing tracking (for CPC/CPM models)
  currentPeriodImpressions?: number;  // Impressions in current billing period
  currentPeriodClicks?: number;       // Clicks in current billing period
  currentPeriodSpend?: number;        // Amount owed for current period (cents)

  // AI-generated banner
  bannerUrl?: string;                 // Firebase Storage URL for generated banner
  bannerPrompt?: string;              // Gemini prompt used to generate the banner

  createdAt: Date;
  updatedAt: Date;
}

export interface AdvertiserCreate {
  tenantId: string;
  userId: string;
  businessName: string;
  businessId?: string;
  businessUrl?: string;
  tier?: AdvertiserTier;
  monthlyRate?: number;        // Optional - can be calculated from pricing config
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  bannerUrl?: string;
  bannerPrompt?: string;
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
