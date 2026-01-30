/**
 * Article Generation Cost Tracking
 * Tracks API costs per article for budgeting and analytics
 */

export interface CostBreakdown {
  articleGeneration?: number;
  imageGeneration?: number;
  stockPhotoSearch?: number;
  factCheck?: number;
  visualExtraction?: number;
  other?: Array<{
    label: string;
    cost: number;
  }>;
}

export interface ArticleCosts {
  total: number; // Total cost in USD
  breakdown: CostBreakdown;
  lastUpdated: string;
}

/**
 * API Pricing (as of Jan 2025)
 * All prices in USD
 */
export const API_PRICING = {
  // Gemini 2.0 Flash pricing (per 1000 tokens)
  GEMINI_INPUT: 0.0001, // $0.10 per 1M input tokens
  GEMINI_OUTPUT: 0.0003, // $0.30 per 1M output tokens

  // Estimated costs for typical operations
  GEMINI_ARTICLE_GENERATION: 0.002, // ~2000 output tokens
  GEMINI_FACT_CHECK_QUICK: 0.0005, // ~500 tokens
  GEMINI_FACT_CHECK_DETAILED: 0.001, // ~1000 tokens
  GEMINI_VISUAL_EXTRACTION: 0.0001, // ~100 tokens

  // Gemini Image Generation pricing
  GEMINI_IMAGE: 0.05, // ~$0.05 per image (Gemini 2.0 Flash experimental)

  // OpenAI DALL-E 3 pricing (legacy, kept for reference)
  DALLE_3_STANDARD: 0.04, // $0.04 per image (1024x1024)
  DALLE_3_HD: 0.08, // $0.08 per image (HD quality)

  // Stock Photo APIs (free tiers)
  UNSPLASH_FREE: 0, // Free (50 requests/hour)
  PEXELS_FREE: 0, // Free (200 requests/hour)

  // Perplexity API (if used for web search)
  PERPLEXITY_SEARCH: 0.003, // ~$0.003 per request
};

/**
 * Initialize cost tracking for a new article
 */
export function initializeArticleCosts(): ArticleCosts {
  return {
    total: 0,
    breakdown: {},
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Add a cost to the article's cost breakdown
 * Returns updated ArticleCosts object
 */
export function addCost(
  currentCosts: ArticleCosts | undefined,
  category: keyof CostBreakdown,
  amount: number,
  label?: string
): ArticleCosts {
  const costs = currentCosts || initializeArticleCosts();

  // Round to 4 decimal places for precision
  const roundedAmount = Math.round(amount * 10000) / 10000;

  if (category === 'other' && label) {
    const otherCosts = costs.breakdown.other || [];
    otherCosts.push({ label, cost: roundedAmount });
    costs.breakdown.other = otherCosts;
  } else {
    costs.breakdown[category] = (costs.breakdown[category] || 0) + roundedAmount;
  }

  // Recalculate total
  costs.total = calculateTotalCost(costs.breakdown);
  costs.lastUpdated = new Date().toISOString();

  return costs;
}

/**
 * Calculate total cost from breakdown
 */
export function calculateTotalCost(breakdown: CostBreakdown): number {
  let total = 0;

  // Sum up all category costs
  if (breakdown.articleGeneration) total += breakdown.articleGeneration;
  if (breakdown.imageGeneration) total += breakdown.imageGeneration;
  if (breakdown.stockPhotoSearch) total += breakdown.stockPhotoSearch;
  if (breakdown.factCheck) total += breakdown.factCheck;
  if (breakdown.visualExtraction) total += breakdown.visualExtraction;

  // Sum up other costs
  if (breakdown.other) {
    breakdown.other.forEach(item => {
      total += item.cost;
    });
  }

  // Round to 4 decimal places
  return Math.round(total * 10000) / 10000;
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.0001) return '< $0.0001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

/**
 * Get cost by category name
 */
export function getCostByCategory(
  costs: ArticleCosts | undefined,
  category: keyof CostBreakdown
): number {
  if (!costs || !costs.breakdown) return 0;
  return costs.breakdown[category] || 0;
}

/**
 * Estimate cost before API call (for budgeting)
 */
export function estimateCost(operation: 'article' | 'image-ai' | 'image-stock' | 'fact-check-quick' | 'fact-check-detailed'): number {
  switch (operation) {
    case 'article':
      return API_PRICING.GEMINI_ARTICLE_GENERATION;
    case 'image-ai':
      return API_PRICING.DALLE_3_STANDARD;
    case 'image-stock':
      return 0; // Free
    case 'fact-check-quick':
      return API_PRICING.GEMINI_FACT_CHECK_QUICK;
    case 'fact-check-detailed':
      return API_PRICING.GEMINI_FACT_CHECK_DETAILED;
    default:
      return 0;
  }
}

/**
 * Get a friendly label for cost categories
 */
export function getCategoryLabel(category: keyof CostBreakdown): string {
  switch (category) {
    case 'articleGeneration':
      return 'Article Generation';
    case 'imageGeneration':
      return 'AI Image';
    case 'stockPhotoSearch':
      return 'Stock Photo';
    case 'factCheck':
      return 'Fact Check';
    case 'visualExtraction':
      return 'Visual Analysis';
    case 'other':
      return 'Other';
    default:
      return 'Unknown';
  }
}
