import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PLATFORM_URL = process.env.PLATFORM_URL || 'https://newsroomaios.com';
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';
const TENANT_ID = process.env.TENANT_ID || 'wnct-times';

/**
 * GET - Fetch credit balance from Newsroom AIOS platform
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch credits from the platform
    const response = await fetch(`${PLATFORM_URL}/api/credits/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform-Secret': PLATFORM_SECRET,
      },
      body: JSON.stringify({
        tenantId: TENANT_ID,
        action: 'article_generation',
        quantity: 0, // Just checking balance, not requesting credits
      }),
    });

    if (!response.ok) {
      console.warn('[Credits] Platform returned error:', response.status);
      return NextResponse.json({
        success: true,
        balance: {
          tenantId: TENANT_ID,
          subscriptionCredits: 0,
          topOffCredits: 0,
          totalCredits: 0,
          lastUpdated: new Date(),
        },
        plan: 'unknown',
        daysUntilRenewal: 0,
        transactions: [],
        usageStats: { totalUsed: 0, byFeature: {} },
        platformError: true,
      });
    }

    const platformData = await response.json();

    // Map platform response to dashboard format
    const creditsRemaining = platformData.creditsRemaining ?? 0;

    return NextResponse.json({
      success: true,
      balance: {
        tenantId: TENANT_ID,
        subscriptionCredits: creditsRemaining,
        topOffCredits: 0,
        totalCredits: creditsRemaining,
        lastUpdated: new Date(),
      },
      plan: 'professional', // Could fetch from tenant data
      daysUntilRenewal: 30, // Could calculate from billing cycle
      transactions: [],
      usageStats: {
        totalUsed: 0,
        byFeature: {},
      },
      platformConnected: true,
      platformMessage: platformData.message,
    });
  } catch (error) {
    console.error('Error fetching credits from platform:', error);
    return NextResponse.json({
      success: true,
      balance: {
        tenantId: TENANT_ID,
        subscriptionCredits: 0,
        topOffCredits: 0,
        totalCredits: 0,
        lastUpdated: new Date(),
      },
      plan: 'unknown',
      daysUntilRenewal: 0,
      transactions: [],
      usageStats: { totalUsed: 0, byFeature: {} },
      platformError: true,
      errorMessage: error instanceof Error ? error.message : 'Connection failed',
    });
  }
}
