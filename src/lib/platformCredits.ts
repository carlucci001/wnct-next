/**
 * Platform Credits Integration
 *
 * Reports AI usage to the Newsroom AIOS platform for credit tracking.
 * This allows the platform to monitor and bill for AI operations.
 */

const PLATFORM_URL = process.env.PLATFORM_URL || 'https://newsroomaios.com';
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';
const TENANT_ID = process.env.TENANT_ID || 'wnct-times';

export type CreditAction =
  | 'article_generation'
  | 'image_generation'
  | 'fact_check'
  | 'seo_optimization'
  | 'web_search';

interface CreditCheckResponse {
  allowed: boolean;
  creditsRequired: number;
  creditsRemaining: number;
  message?: string;
}

interface CreditDeductResponse {
  success: boolean;
  creditsDeducted: number;
  creditsRemaining: number;
  status: string;
  isOverage: boolean;
}

/**
 * Check if we have credits for an operation
 * Returns true if allowed, false if blocked
 */
export async function checkCredits(
  action: CreditAction,
  quantity: number = 1
): Promise<{ allowed: boolean; message?: string }> {
  try {
    const response = await fetch(`${PLATFORM_URL}/api/credits/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform-Secret': PLATFORM_SECRET,
      },
      body: JSON.stringify({
        tenantId: TENANT_ID,
        action,
        quantity,
      }),
    });

    if (!response.ok) {
      console.warn('[Platform Credits] Check failed:', response.status);
      // On error, allow operation to not block the site
      return { allowed: true };
    }

    const data: CreditCheckResponse = await response.json();
    return {
      allowed: data.allowed,
      message: data.message,
    };
  } catch (error) {
    console.error('[Platform Credits] Check error:', error);
    // On error, allow operation
    return { allowed: true };
  }
}

/**
 * Report credit usage after a successful operation
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
    console.error('[Platform Credits] Deduct error:', error);
    // Don't throw - credit reporting is non-blocking
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
