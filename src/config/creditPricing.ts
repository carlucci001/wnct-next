import {
  SubscriptionTier,
  SubscriptionTierId,
  TopOffPack,
  TopOffPackId,
  CreditFeature,
  TenantPlan,
} from '@/types/tenant';

// ============================================================================
// Credit Costs Per Feature
// ============================================================================

export const CREDIT_COSTS: Record<CreditFeature, number> = {
  article: 5,          // AI article with 1 image
  image: 2,            // Additional standard AI image
  image_hd: 4,         // HD quality AI image
  tts: 1,              // Per 500 characters of text-to-speech
  agent: 3,            // Scheduled AI agent run
  ad_creation: 5,      // AI-generated ad (copy + image + layout)
  ad_manual: 1,        // Manual ad upload (subscriber provides creative)
};

// TTS character limit per credit
export const TTS_CHARS_PER_CREDIT = 500;

// ============================================================================
// Subscription Tiers (Monthly)
// ============================================================================

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 1900,        // $19.00/mo
    includedCredits: 150,
    bonusCredits: 25,
    totalCredits: 175,
    pricePerCredit: 0.11,
    description: 'Perfect for small local news sites',
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 4900,        // $49.00/mo
    includedCredits: 500,
    bonusCredits: 75,
    totalCredits: 575,
    pricePerCredit: 0.085,
    description: 'Great for growing publications',
    popular: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 9900,        // $99.00/mo
    includedCredits: 1200,
    bonusCredits: 200,
    totalCredits: 1400,
    pricePerCredit: 0.071,
    description: 'Best value for active publishers',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 24900,       // $249.00/mo
    includedCredits: 4000,
    bonusCredits: 500,
    totalCredits: 4500,
    pricePerCredit: 0.055,
    description: 'For large-scale operations',
  },
];

// ============================================================================
// Top-Off Packs (One-Time Purchases)
// ============================================================================

export const TOPOFF_PACKS: TopOffPack[] = [
  {
    id: 'small',
    name: 'Small',
    credits: 50,
    price: 500,                // $5.00
    pricePerCredit: 0.10,
    description: 'Quick top-up',
  },
  {
    id: 'medium',
    name: 'Medium',
    credits: 100,
    price: 1000,               // $10.00
    pricePerCredit: 0.10,
    description: 'Standard top-up',
  },
  {
    id: 'large',
    name: 'Large',
    credits: 250,
    price: 2000,               // $20.00
    pricePerCredit: 0.08,
    description: 'Better value',
  },
  {
    id: 'bulk',
    name: 'Bulk',
    credits: 500,
    price: 3500,               // $35.00
    pricePerCredit: 0.07,
    description: 'Best value top-up',
  },
];

// ============================================================================
// Trial Configuration
// ============================================================================

export const TRIAL_CREDITS = 50;
export const TRIAL_DURATION_DAYS = 14;

// ============================================================================
// Feature Descriptions (for UI)
// ============================================================================

export const FEATURE_DESCRIPTIONS: Record<CreditFeature, string> = {
  article: 'AI-generated article with one image',
  image: 'Additional AI image (standard quality)',
  image_hd: 'Additional AI image (HD quality)',
  tts: 'Text-to-speech audio generation',
  agent: 'Scheduled AI journalist run',
  ad_creation: 'AI-generated advertisement',
  ad_manual: 'Manual ad upload',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get subscription tier by ID
 */
export function getSubscriptionTier(id: SubscriptionTierId | TenantPlan): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find(tier => tier.id === id);
}

/**
 * Get top-off pack by ID
 */
export function getTopOffPack(id: TopOffPackId): TopOffPack | undefined {
  return TOPOFF_PACKS.find(pack => pack.id === id);
}

/**
 * Get credits included in a subscription tier
 */
export function getSubscriptionCredits(plan: TenantPlan): number {
  const tier = getSubscriptionTier(plan);
  return tier?.totalCredits || 0;
}

/**
 * Calculate TTS credits needed based on character count
 */
export function calculateTTSCredits(characterCount: number): number {
  return Math.ceil(characterCount / TTS_CHARS_PER_CREDIT);
}

/**
 * Format credit cost for display
 */
export function formatCreditCost(credits: number): string {
  if (credits === 0) return 'Free';
  if (credits === 1) return '1 credit';
  return `${credits} credits`;
}

/**
 * Format price for display (cents to dollars)
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format price per month for display
 */
export function formatMonthlyPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}/mo`;
}

/**
 * Calculate savings when upgrading from one tier to another
 */
export function calculateUpgradeSavings(
  fromTier: SubscriptionTierId,
  toTier: SubscriptionTierId
): { additionalCredits: number; priceIncrease: number; perCreditSavings: number } {
  const from = getSubscriptionTier(fromTier);
  const to = getSubscriptionTier(toTier);

  if (!from || !to) {
    return { additionalCredits: 0, priceIncrease: 0, perCreditSavings: 0 };
  }

  const additionalCredits = to.totalCredits - from.totalCredits;
  const priceIncrease = to.monthlyPrice - from.monthlyPrice;
  const perCreditSavings = from.pricePerCredit - to.pricePerCredit;

  return { additionalCredits, priceIncrease, perCreditSavings };
}

/**
 * Get recommended tier based on monthly usage
 */
export function getRecommendedTier(monthlyUsage: number): SubscriptionTier {
  // Find the smallest tier that can handle the usage with some buffer (20%)
  const usageWithBuffer = monthlyUsage * 1.2;

  for (const tier of SUBSCRIPTION_TIERS) {
    if (tier.totalCredits >= usageWithBuffer) {
      return tier;
    }
  }

  // Default to enterprise if usage exceeds all tiers
  return SUBSCRIPTION_TIERS[SUBSCRIPTION_TIERS.length - 1];
}

/**
 * Check if a top-off is needed based on remaining credits and planned usage
 */
export function shouldRecommendTopOff(
  remainingCredits: number,
  plannedUsage: number,
  daysUntilRenewal: number
): { recommend: boolean; pack?: TopOffPack } {
  const projectedShortfall = plannedUsage - remainingCredits;

  if (projectedShortfall <= 0) {
    return { recommend: false };
  }

  // Find the smallest pack that covers the shortfall
  for (const pack of TOPOFF_PACKS) {
    if (pack.credits >= projectedShortfall) {
      return { recommend: true, pack };
    }
  }

  // Recommend bulk if shortfall exceeds all packs
  return { recommend: true, pack: TOPOFF_PACKS[TOPOFF_PACKS.length - 1] };
}
