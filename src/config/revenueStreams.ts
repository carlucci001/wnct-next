// Revenue Streams Configuration for Multi-Tenant Platform
// Supports flexible pricing models for advertisers: flat rates, CPC, and CPM

// Advertiser Pricing Models
export type AdvertiserPricingModel = 'flat_monthly' | 'flat_weekly' | 'cpc' | 'cpm';

export interface AdvertiserPricingConfig {
  model: AdvertiserPricingModel;
  flatMonthlyRate?: number;      // If flat_monthly (in cents, e.g., 9900 = $99/month)
  flatWeeklyRate?: number;        // If flat_weekly (in cents)
  cpcRate?: number;               // Cost per click (in cents, e.g., 50 = $0.50/click)
  cpmRate?: number;               // Cost per 1000 impressions (in cents, e.g., 500 = $5/1000 impressions)
  minimumSpend?: number;          // Optional minimum monthly spend (in cents)
}

// Platform-wide default pricing for advertisers
export const DEFAULT_ADVERTISER_PRICING: AdvertiserPricingConfig = {
  model: 'flat_monthly',
  flatMonthlyRate: 9900,          // $99/month default
};

// Directory Pricing
export const DIRECTORY_PRICING = {
  FREE: 0,                        // Basic listing is free
  FEATURED_MONTHLY: 4900,         // $49/month for featured badge + top placement
};

// Subscriber Pricing
export const SUBSCRIBER_PRICING = {
  MONTHLY: 900,                   // $9/month
  ANNUAL: 9000,                   // $90/year (save $18)
};

/**
 * Calculate advertiser price based on pricing model and usage
 * @param config - Advertiser pricing configuration
 * @param impressions - Number of impressions (for CPM model)
 * @param clicks - Number of clicks (for CPC model)
 * @returns Price in cents
 */
export function calculateAdvertiserPrice(
  config: AdvertiserPricingConfig,
  impressions?: number,
  clicks?: number
): number {
  switch (config.model) {
    case 'flat_monthly':
      return config.flatMonthlyRate || DEFAULT_ADVERTISER_PRICING.flatMonthlyRate || 0;

    case 'flat_weekly':
      return config.flatWeeklyRate || 0;

    case 'cpc':
      if (typeof clicks !== 'number' || !config.cpcRate) {
        throw new Error('CPC pricing requires click count and cpcRate');
      }
      return clicks * config.cpcRate;

    case 'cpm':
      if (typeof impressions !== 'number' || !config.cpmRate) {
        throw new Error('CPM pricing requires impression count and cpmRate');
      }
      // CPM = cost per 1000 impressions
      return Math.ceil((impressions / 1000) * config.cpmRate);

    default:
      return 0;
  }
}

/**
 * Get directory listing price based on tier
 * @param tier - 'free' or 'featured'
 * @returns Price in cents
 */
export function getDirectoryPrice(tier: 'free' | 'featured'): number {
  return tier === 'featured' ? DIRECTORY_PRICING.FEATURED_MONTHLY : DIRECTORY_PRICING.FREE;
}

/**
 * Get subscriber price based on interval
 * @param interval - 'month' or 'year'
 * @returns Price in cents
 */
export function getSubscriberPrice(interval: 'month' | 'year'): number {
  return interval === 'year' ? SUBSCRIBER_PRICING.ANNUAL : SUBSCRIBER_PRICING.MONTHLY;
}

/**
 * Format price in cents to display string
 * @param cents - Price in cents
 * @returns Formatted price (e.g., "$99.00")
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Get estimated monthly cost for CPC/CPM models
 * Based on average impressions/clicks per month
 * @param config - Advertiser pricing configuration
 * @param avgMonthlyImpressions - Average monthly impressions (default: 50,000)
 * @param avgMonthlyClicks - Average monthly clicks (default: 500)
 * @returns Estimated monthly cost in cents
 */
export function getEstimatedMonthlyCost(
  config: AdvertiserPricingConfig,
  avgMonthlyImpressions: number = 50000,
  avgMonthlyClicks: number = 500
): number {
  if (config.model === 'flat_monthly') {
    return config.flatMonthlyRate || 0;
  }
  if (config.model === 'flat_weekly') {
    return (config.flatWeeklyRate || 0) * 4; // Approximate 4 weeks per month
  }
  if (config.model === 'cpc') {
    return calculateAdvertiserPrice(config, undefined, avgMonthlyClicks);
  }
  if (config.model === 'cpm') {
    return calculateAdvertiserPrice(config, avgMonthlyImpressions, undefined);
  }
  return 0;
}
