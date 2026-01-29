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
import { searchWithPerplexity } from '@/lib/perplexitySearch';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: FactCheckRequest = await request.json();
    const { mode, articleId, title, content, sourceTitle, sourceSummary, sourceUrl, usePerplexity } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Get API keys from settings
    const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
    const settings = settingsDoc.data();
    const geminiApiKey = settings?.geminiApiKey;
    const perplexityApiKey = settings?.perplexityApiKey;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Fact-check service not configured. Please configure the Gemini API key in Admin settings.' },
        { status: 503 }
      );
    }

    // If Perplexity is requested, gather live web research first
    let perplexityResearch = '';
    let citations: string[] = [];

    if (usePerplexity) {
      if (!perplexityApiKey) {
        console.log('[FactCheck] Perplexity requested but API key not configured, falling back to Gemini-only');
      } else {
        try {
          console.log('[FactCheck] Using Perplexity for live web verification');
          const searchQuery = `Verify the facts in this news article. Article title: "${title}". Key claims to verify from the content.`;
          const perplexityResult = await searchWithPerplexity(
            searchQuery,
            content.substring(0, 2000), // Limit context size
            perplexityApiKey
          );
          perplexityResearch = perplexityResult.answer;
          citations = perplexityResult.citations || [];
          console.log('[FactCheck] Perplexity returned', citations.length, 'citations');
        } catch (perplexityError) {
          console.error('[FactCheck] Perplexity search failed, continuing with Gemini-only:', perplexityError);
        }
      }
    }

    // Build the appropriate prompt based on mode (now includes Perplexity research if available)
    const prompt = mode === 'detailed'
      ? buildDetailedPrompt(title, content, sourceTitle, sourceSummary, sourceUrl, perplexityResearch)
      : buildQuickPrompt(title, content, sourceTitle, sourceSummary, sourceUrl, perplexityResearch);

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
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

    // DEBUG: Log raw response to see Gemini 2.5 format
    console.log('[FactCheck] Raw Gemini response:', responseText);

    // Parse the response based on mode
    const result: FactCheckResult = mode === 'detailed'
      ? parseDetailedResponse(responseText)
      : parseQuickResponse(responseText);

    // Add Perplexity metadata if it was used
    if (usePerplexity && perplexityResearch) {
      result.usedPerplexity = true;
      result.citations = citations;
    }

    // If articleId provided, update the article with fact-check results
    if (articleId) {
      try {
        // Use Admin SDK to bypass authentication requirements (for server-side updates)
        const { getAdminFirestore } = await import('@/lib/firebase-admin');
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

        await getAdminFirestore().collection('articles').doc(articleId).update(updateData);
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
  sourceUrl?: string,
  perplexityResearch?: string
): string {
  const sourceInfo = sourceTitle || sourceSummary
    ? `SOURCE MATERIAL:
Title: ${sourceTitle || 'Not provided'}
Summary: ${sourceSummary || 'Not provided'}
URL: ${sourceUrl || 'Not provided'}`
    : 'No source material provided - assess based on internal consistency and common knowledge.';

  const webResearch = perplexityResearch
    ? `\n\nLIVE WEB RESEARCH (from Perplexity):\n${perplexityResearch}`
    : '';

  return `You are a fact-checker for a local news organization. Quickly assess this article for factual accuracy.

${sourceInfo}${webResearch}

ARTICLE TO CHECK:
Title: ${title}
Content: ${content}

Evaluate whether the article:
1. Accurately represents information (from source if provided, or is internally consistent)
2. Doesn't make claims that seem fabricated or exaggerated
3. Uses appropriate hedging for uncertain information
4. Avoids sensationalism
${perplexityResearch ? '5. Aligns with the live web research findings above' : ''}

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
  sourceUrl?: string,
  perplexityResearch?: string
): string {
  const sourceInfo = sourceTitle || sourceSummary
    ? `SOURCE MATERIAL:
Title: ${sourceTitle || 'Not provided'}
Summary: ${sourceSummary || 'Not provided'}
URL: ${sourceUrl || 'Not provided'}`
    : 'No source material provided - assess based on internal consistency and common knowledge.';

  const webResearch = perplexityResearch
    ? `\n\nLIVE WEB RESEARCH (from Perplexity - use this to verify current facts):\n${perplexityResearch}`
    : '';

  return `You are a thorough fact-checker for a local news organization. Analyze this article claim by claim.

${sourceInfo}${webResearch}

ARTICLE TO CHECK:
Title: ${title}
Content: ${content}

Instructions:
1. Extract each significant factual claim from the article
2. For each claim, determine if it is:
   - VERIFIED: Supported by source${perplexityResearch ? ', live web research,' : ''} or widely known facts
   - UNVERIFIED: Cannot be confirmed from available information
   - DISPUTED: Contradicts source${perplexityResearch ? ', live web research,' : ''} or known facts
   - OPINION: Editorial opinion, not a factual claim

3. Provide specific explanations for each claim${perplexityResearch ? ' (reference the live web research when applicable)' : ''}
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

// Normalize status values to handle format variations from different Gemini versions
function normalizeStatus(rawStatus: string | undefined): FactCheckStatus {
  if (!rawStatus) return 'review_recommended';

  // Normalize: lowercase, replace spaces/hyphens with underscores
  const normalized = rawStatus.toLowerCase().replace(/[\s-]+/g, '_');

  // Map to valid status values
  if (normalized === 'passed') return 'passed';
  if (normalized === 'review_recommended') return 'review_recommended';
  if (normalized === 'caution') return 'caution';
  if (normalized === 'high_risk') return 'high_risk';

  // Default fallback
  return 'review_recommended';
}

function parseQuickResponse(responseText: string): FactCheckResult {
  // More flexible regex: match status with spaces, underscores, or hyphens
  const statusMatch = responseText.match(/STATUS:\s*(passed|review[_\s-]?recommended|caution|high[_\s-]?risk)/i);
  const confidenceMatch = responseText.match(/CONFIDENCE:\s*(\d+)/i);

  // Try multiple patterns for summary - order may vary
  let summaryMatch = responseText.match(/SUMMARY:\s*([\s\S]+?)(?=CONFIDENCE:|STATUS:|$)/i);
  if (!summaryMatch?.[1]?.trim()) {
    // Try: SUMMARY at the end
    summaryMatch = responseText.match(/SUMMARY:\s*(.+)$/im);
  }
  if (!summaryMatch?.[1]?.trim()) {
    // Try: capture everything after SUMMARY: until next label or end
    summaryMatch = responseText.match(/SUMMARY:\s*([^\n]+(?:\n(?!STATUS:|CONFIDENCE:)[^\n]+)*)/i);
  }

  const status = normalizeStatus(statusMatch?.[1]);
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 50;

  // Generate fallback summary if none was provided by Gemini
  let summary = summaryMatch?.[1]?.trim() || '';
  if (!summary) {
    summary = `Quick fact-check completed with status: ${status.replace('_', ' ')}. Confidence: ${confidence}%.`;
  }

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
  // More flexible regex: match status with spaces, underscores, or hyphens
  const statusMatch = responseText.match(/STATUS:\s*(passed|review[_\s-]?recommended|caution|high[_\s-]?risk)/i);
  const confidenceMatch = responseText.match(/CONFIDENCE:\s*(\d+)/i);
  // More flexible summary matching - try multiple patterns
  let summaryMatch = responseText.match(/SUMMARY:\s*([\s\S]+?)$/i);
  if (!summaryMatch?.[1]?.trim()) {
    // Try alternative: summary might be before other sections
    summaryMatch = responseText.match(/SUMMARY:\s*([^\n]+(?:\n(?!STATUS:|CLAIMS:|RECOMMENDATIONS:)[^\n]+)*)/i);
  }

  const status = normalizeStatus(statusMatch?.[1]);
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 50;
  let summary = summaryMatch?.[1]?.trim() || '';

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

  // Generate fallback summary if none was provided by Gemini
  if (!summary && claims.length > 0) {
    const verified = claims.filter(c => c.status === 'verified').length;
    const unverified = claims.filter(c => c.status === 'unverified').length;
    const disputed = claims.filter(c => c.status === 'disputed').length;
    summary = `Analysis of ${claims.length} claims: ${verified} verified, ${unverified} unverified, ${disputed} disputed. Status: ${status.replace('_', ' ')}.`;
  } else if (!summary) {
    summary = `Fact-check completed with status: ${status.replace('_', ' ')}. Confidence: ${confidence}%.`;
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
