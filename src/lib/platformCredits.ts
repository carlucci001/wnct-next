/**
 * Platform Credits Integration
 *
 * Reports AI usage to the Newsroom AIOS platform for credit tracking.
 * This allows the platform to monitor and bill for AI operations.
 *
 * IMPORTANT: This is SERVER-SIDE ONLY. Never import in client components.
 * All calls are non-blocking - errors are logged but never thrown.
 */

const PLATFORM_URL = process.env.PLATFORM_URL || 'https://newsroomaios.com';
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || '';
const TENANT_ID = process.env.TENANT_ID || 'wnct-times';

export type CreditAction =
  | 'article_generation'
  | 'image_generation'
  | 'fact_check'
  | 'seo_optimization'
  | 'web_search';

interface CreditDeductResponse {
  success: boolean;
  creditsDeducted: number;
  creditsRemaining: number;
  status: string;
  isOverage: boolean;
}

/**
 * Report credit usage after a successful operation
 * Non-blocking - catches all errors and logs them
 */
export async function reportCreditUsage(
  action: CreditAction,
  description: string,
  options?: {
    quantity?: number;
    articleId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  // Skip if no platform secret configured
  if (!PLATFORM_SECRET) {
    console.log('[Platform Credits] No PLATFORM_SECRET configured, skipping report');
    return;
  }

  try {
    const response = await fetch(`${PLATFORM_URL}/api/credits/deduct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform-Secret': PLATFORM_SECRET,
      },
      body: JSON.stringify({
        tenantId: TENANT_ID,
        action,
        quantity: options?.quantity || 1,
        description,
        articleId: options?.articleId,
        metadata: options?.metadata,
      }),
    });

    if (!response.ok) {
      console.warn('[Platform Credits] Deduct failed:', response.status);
      return;
    }

    const data: CreditDeductResponse = await response.json();

    if (data.isOverage) {
      console.warn('[Platform Credits] Account in overage! Credits remaining:', data.creditsRemaining);
    }

    console.log(`[Platform Credits] Deducted ${data.creditsDeducted} credits for ${action}. Remaining: ${data.creditsRemaining}`);
  } catch (error) {
    // Non-blocking - just log the error
    console.error('[Platform Credits] Deduct error:', error);
  }
}

/**
 * Report article generation (convenience function)
 */
export async function reportArticleGenerated(
  articleTitle: string,
  articleId?: string,
  metadata?: { model?: string; tokensUsed?: number; sourceType?: string }
): Promise<void> {
  await reportCreditUsage('article_generation', articleTitle, {
    articleId,
    metadata,
  });
}

/**
 * Report image generation (convenience function)
 */
export async function reportImageGenerated(
  description: string,
  articleId?: string
): Promise<void> {
  await reportCreditUsage('image_generation', description, { articleId });
}

/**
 * Report web search (convenience function)
 */
export async function reportWebSearch(query: string): Promise<void> {
  await reportCreditUsage('web_search', query);
}
