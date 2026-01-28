/**
 * Fact-Check Types
 * Two-tier system: Quick (summary) and Detailed (claim-by-claim)
 */

export type FactCheckStatus = 'passed' | 'review_recommended' | 'caution' | 'high_risk' | 'not_checked';

export type ClaimStatus = 'verified' | 'unverified' | 'disputed' | 'opinion';

export type FactCheckMode = 'quick' | 'detailed';

/**
 * Individual claim analysis (for detailed mode)
 */
export interface FactCheckClaim {
  text: string;
  status: ClaimStatus;
  explanation: string;
  sourceMatch?: string;
}

/**
 * Quick fact-check result (summary only)
 */
export interface QuickFactCheckResult {
  mode: 'quick';
  status: FactCheckStatus;
  summary: string;
  confidence: number;
  checkedAt: string;
  cost?: number; // API cost in USD
  usedPerplexity?: boolean; // Whether Perplexity was used
  citations?: string[]; // Source URLs from Perplexity
}

/**
 * Detailed fact-check result (claim-by-claim)
 */
export interface DetailedFactCheckResult {
  mode: 'detailed';
  status: FactCheckStatus;
  summary: string;
  confidence: number;
  claims: FactCheckClaim[];
  recommendations: string[];
  checkedAt: string;
  cost?: number; // API cost in USD
  usedPerplexity?: boolean; // Whether Perplexity was used
  citations?: string[]; // Source URLs from Perplexity
}

/**
 * Union type for any fact-check result
 */
export type FactCheckResult = QuickFactCheckResult | DetailedFactCheckResult;

/**
 * Request body for fact-check API
 */
export interface FactCheckRequest {
  mode: FactCheckMode;
  articleId?: string;
  title: string;
  content: string;
  sourceTitle?: string;
  sourceSummary?: string;
  sourceUrl?: string;
  usePerplexity?: boolean; // Enable live web search verification
}

/**
 * Fields to be added to Article type
 */
export interface ArticleFactCheckFields {
  factCheckStatus?: FactCheckStatus;
  factCheckSummary?: string;
  factCheckConfidence?: number;
  factCheckedAt?: string;
  factCheckMode?: FactCheckMode;
  factCheckClaims?: FactCheckClaim[];
  factCheckRecommendations?: string[];
}

/**
 * Status display configuration
 */
export const FACT_CHECK_STATUS_CONFIG: Record<FactCheckStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}> = {
  passed: {
    label: 'Passed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '✓',
    description: 'Content aligns with source, no concerns'
  },
  review_recommended: {
    label: 'Review Recommended',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: '⚠',
    description: 'Some claims could not be verified'
  },
  caution: {
    label: 'Caution',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: '⚡',
    description: 'Multiple unverified claims detected'
  },
  high_risk: {
    label: 'High Risk',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '⛔',
    description: 'Significant factual concerns detected'
  },
  not_checked: {
    label: 'Not Checked',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: '─',
    description: 'Fact-check has not been performed'
  }
};

export const CLAIM_STATUS_CONFIG: Record<ClaimStatus, {
  label: string;
  color: string;
  icon: string;
}> = {
  verified: {
    label: 'Verified',
    color: 'text-green-600',
    icon: '✓'
  },
  unverified: {
    label: 'Unverified',
    color: 'text-yellow-600',
    icon: '⚠'
  },
  disputed: {
    label: 'Disputed',
    color: 'text-red-600',
    icon: '✗'
  },
  opinion: {
    label: 'Opinion',
    color: 'text-blue-600',
    icon: '○'
  }
};
