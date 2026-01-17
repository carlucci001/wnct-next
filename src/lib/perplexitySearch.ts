/**
 * Perplexity API Integration for Real-Time Web Search
 * Used for fact-checking and enriching article generation with current information
 */

export interface PerplexitySearchResult {
  answer: string;
  citations: string[];
  confidence: number;
}

/**
 * Searches Perplexity for real-time information and fact verification
 *
 * @param query - The search query
 * @param context - Optional context to provide to the search
 * @param apiKey - Optional API key (if not provided, checks env vars and Firebase settings)
 * @returns Search results with answer, citations, and confidence score
 */
export async function searchWithPerplexity(
  query: string,
  context?: string,
  apiKey?: string
): Promise<PerplexitySearchResult> {
  // Check multiple sources for API key:
  // 1. Provided apiKey parameter
  // 2. Environment variable
  // 3. Firebase settings (will be passed from calling code)
  const PERPLEXITY_API_KEY = apiKey || process.env.PERPLEXITY_API_KEY;

  if (!PERPLEXITY_API_KEY) {
    console.log('[Perplexity] API key not configured in env or settings');
    throw new Error('Perplexity API key not configured');
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro', // Latest real-time search model
        messages: [
          {
            role: 'system',
            content: 'You are a fact-checking assistant for a news publication. Provide current, verified information with citations.'
          },
          {
            role: 'user',
            content: `${context ? `Context: ${context}\n\n` : ''}Query: ${query}`
          }
        ],
        temperature: 0.2, // Low temp for factual accuracy
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Perplexity] API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract answer from response
    const answer = data.choices?.[0]?.message?.content || '';

    // Extract citations if provided (format may vary)
    const citations: string[] = data.citations || [];

    // Confidence score (default to 0.8 if not provided)
    const confidence = data.confidence || 0.8;

    return {
      answer,
      citations,
      confidence
    };
  } catch (error) {
    console.error('[Perplexity] Search failed:', error);
    throw error;
  }
}

/**
 * Verifies a specific claim using Perplexity web search
 *
 * @param claim - The claim to verify
 * @param context - Optional context about the claim
 * @returns Verification result with answer and citations
 */
export async function verifyClaim(
  claim: string,
  context?: string
): Promise<PerplexitySearchResult> {
  const query = `Verify this claim and provide current, factual information: ${claim}`;
  return searchWithPerplexity(query, context);
}

/**
 * Gets current information about a person (job title, organization, etc.)
 *
 * @param personName - The person's name
 * @param organization - Optional organization they're associated with
 * @returns Current information with citations
 */
export async function getCurrentPersonInfo(
  personName: string,
  organization?: string
): Promise<PerplexitySearchResult> {
  const query = organization
    ? `Current job title and position of ${personName} at ${organization}`
    : `Current job title and position of ${personName}`;

  return searchWithPerplexity(query);
}
