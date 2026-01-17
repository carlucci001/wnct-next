import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  FactCheckRequest,
  FactCheckResult,
  FactCheckStatus,
  FactCheckClaim,
  ClaimStatus
} from '@/types/factCheck';
import { API_PRICING } from '@/lib/costs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: FactCheckRequest = await request.json();
    const { mode, articleId, title, content, sourceTitle, sourceSummary, sourceUrl } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Get Gemini API key from settings
    const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
    const settings = settingsDoc.data();
    const apiKey = settings?.geminiApiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Fact-check service not configured. Please configure the Gemini API key in Admin settings.' },
        { status: 503 }
      );
    }

    // Build the appropriate prompt based on mode
    const prompt = mode === 'detailed'
      ? buildDetailedPrompt(title, content, sourceTitle, sourceSummary, sourceUrl)
      : buildQuickPrompt(title, content, sourceTitle, sourceSummary, sourceUrl);

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: mode === 'detailed' ? 2000 : 500,
            temperature: 0.3, // Lower temperature for more consistent fact-checking
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Fact-check service temporarily unavailable' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from fact-check service' },
        { status: 500 }
      );
    }

    // Parse the response based on mode
    const result: FactCheckResult = mode === 'detailed'
      ? parseDetailedResponse(responseText)
      : parseQuickResponse(responseText);

    // If articleId provided, update the article with fact-check results
    if (articleId) {
      try {
        const articleRef = doc(getDb(), 'articles', articleId);
        const updateData: Record<string, unknown> = {
          factCheckStatus: result.status,
          factCheckSummary: result.summary,
          factCheckConfidence: result.confidence,
          factCheckedAt: result.checkedAt,
          factCheckMode: result.mode,
        };

        if (result.mode === 'detailed') {
          updateData.factCheckClaims = result.claims;
          updateData.factCheckRecommendations = result.recommendations;
        }

        await updateDoc(articleRef, updateData);
      } catch (updateError) {
        console.error('Failed to update article with fact-check results:', updateError);
        // Continue - return results even if update fails
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Fact-check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildQuickPrompt(
  title: string,
  content: string,
  sourceTitle?: string,
  sourceSummary?: string,
  sourceUrl?: string
): string {
  const sourceInfo = sourceTitle || sourceSummary
    ? `SOURCE MATERIAL:
Title: ${sourceTitle || 'Not provided'}
Summary: ${sourceSummary || 'Not provided'}
URL: ${sourceUrl || 'Not provided'}`
    : 'No source material provided - assess based on internal consistency and common knowledge.';

  return `You are a fact-checker for a local news organization. Quickly assess this article for factual accuracy.

${sourceInfo}

ARTICLE TO CHECK:
Title: ${title}
Content: ${content}

Evaluate whether the article:
1. Accurately represents information (from source if provided, or is internally consistent)
2. Doesn't make claims that seem fabricated or exaggerated
3. Uses appropriate hedging for uncertain information
4. Avoids sensationalism

Respond in this EXACT format (no extra text):
STATUS: [passed/review_recommended/caution/high_risk]
SUMMARY: [2-3 sentences explaining your assessment]
CONFIDENCE: [0-100]`;
}

function buildDetailedPrompt(
  title: string,
  content: string,
  sourceTitle?: string,
  sourceSummary?: string,
  sourceUrl?: string
): string {
  const sourceInfo = sourceTitle || sourceSummary
    ? `SOURCE MATERIAL:
Title: ${sourceTitle || 'Not provided'}
Summary: ${sourceSummary || 'Not provided'}
URL: ${sourceUrl || 'Not provided'}`
    : 'No source material provided - assess based on internal consistency and common knowledge.';

  return `You are a thorough fact-checker for a local news organization. Analyze this article claim by claim.

${sourceInfo}

ARTICLE TO CHECK:
Title: ${title}
Content: ${content}

Instructions:
1. Extract each significant factual claim from the article
2. For each claim, determine if it is:
   - VERIFIED: Supported by source or widely known facts
   - UNVERIFIED: Cannot be confirmed from available information
   - DISPUTED: Contradicts source or known facts
   - OPINION: Editorial opinion, not a factual claim

3. Provide specific explanations for each claim
4. Give actionable recommendations for the editor

Respond in this EXACT format:
STATUS: [passed/review_recommended/caution/high_risk]
CONFIDENCE: [0-100]

CLAIMS:
1. "[exact claim from article]" | [verified/unverified/disputed/opinion] | [brief explanation]
2. "[exact claim from article]" | [verified/unverified/disputed/opinion] | [brief explanation]
(continue for all significant claims)

RECOMMENDATIONS:
- [actionable recommendation 1]
- [actionable recommendation 2]
(add more if needed)

SUMMARY: [2-3 sentence overall assessment]`;
}

function parseQuickResponse(responseText: string): FactCheckResult {
  const statusMatch = responseText.match(/STATUS:\s*(passed|review_recommended|caution|high_risk)/i);
  const summaryMatch = responseText.match(/SUMMARY:\s*([\s\S]+?)(?=CONFIDENCE:|$)/i);
  const confidenceMatch = responseText.match(/CONFIDENCE:\s*(\d+)/i);

  const status = (statusMatch?.[1]?.toLowerCase() as FactCheckStatus) || 'review_recommended';
  const summary = summaryMatch?.[1]?.trim() || 'Unable to parse fact-check summary.';
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 50;

  return {
    mode: 'quick',
    status,
    summary,
    confidence: Math.min(100, Math.max(0, confidence)),
    checkedAt: new Date().toISOString(),
    cost: API_PRICING.GEMINI_FACT_CHECK_QUICK,
  };
}

function parseDetailedResponse(responseText: string): FactCheckResult {
  const statusMatch = responseText.match(/STATUS:\s*(passed|review_recommended|caution|high_risk)/i);
  const confidenceMatch = responseText.match(/CONFIDENCE:\s*(\d+)/i);
  const summaryMatch = responseText.match(/SUMMARY:\s*([\s\S]+?)$/i);

  const status = (statusMatch?.[1]?.toLowerCase() as FactCheckStatus) || 'review_recommended';
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 50;
  const summary = summaryMatch?.[1]?.trim() || 'Unable to parse fact-check summary.';

  // Parse claims
  const claims: FactCheckClaim[] = [];
  const claimsSection = responseText.match(/CLAIMS:\s*([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);

  if (claimsSection?.[1]) {
    const claimLines = claimsSection[1].split('\n').filter(line => line.trim());

    for (const line of claimLines) {
      // Match pattern: number. "claim text" | status | explanation
      const claimMatch = line.match(/^\d+\.\s*"([^"]+)"\s*\|\s*(verified|unverified|disputed|opinion)\s*\|\s*(.+)$/i);

      if (claimMatch) {
        claims.push({
          text: claimMatch[1].trim(),
          status: claimMatch[2].toLowerCase() as ClaimStatus,
          explanation: claimMatch[3].trim(),
        });
      }
    }
  }

  // Parse recommendations
  const recommendations: string[] = [];
  const recsSection = responseText.match(/RECOMMENDATIONS:\s*([\s\S]*?)(?=SUMMARY:|$)/i);

  if (recsSection?.[1]) {
    const recLines = recsSection[1].split('\n').filter(line => line.trim().startsWith('-'));

    for (const line of recLines) {
      const rec = line.replace(/^-\s*/, '').trim();
      if (rec) {
        recommendations.push(rec);
      }
    }
  }

  return {
    mode: 'detailed',
    status,
    summary,
    confidence: Math.min(100, Math.max(0, confidence)),
    claims,
    recommendations,
    checkedAt: new Date().toISOString(),
    cost: API_PRICING.GEMINI_FACT_CHECK_DETAILED,
  };
}
