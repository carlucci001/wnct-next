import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

// Category keywords - articles matching these keywords will be assigned to the category
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  sports: [
    'football', 'basketball', 'baseball', 'soccer', 'hockey', 'golf', 'tennis',
    'athlete', 'team', 'game', 'coach', 'player', 'championship', 'tournament',
    'nfl', 'nba', 'mlb', 'nhl', 'ncaa', 'college football', 'score', 'win', 'lose',
    'playoff', 'super bowl', 'world series', 'march madness', 'olympics',
    'running', 'marathon', 'triathlon', 'cycling', 'swimming', 'wrestling',
    'boxing', 'mma', 'ufc', 'racing', 'nascar', 'stadium', 'arena', 'appalachian state',
    'unc', 'duke', 'nc state', 'wake forest', 'panthers', 'hornets', 'hurricanes',
    'braves', 'falcons', 'titans', 'volunteers', 'tarheels', 'wolfpack', 'mountaineers'
  ],
  business: [
    'economy', 'economic', 'business', 'market', 'stock', 'investment', 'investor',
    'company', 'corporation', 'startup', 'entrepreneur', 'ceo', 'executive',
    'revenue', 'profit', 'sales', 'retail', 'commerce', 'trade', 'finance',
    'bank', 'banking', 'loan', 'mortgage', 'real estate', 'property', 'housing',
    'employment', 'jobs', 'hiring', 'layoff', 'unemployment', 'workforce',
    'manufacturing', 'industry', 'factory', 'agriculture', 'farm', 'tourism',
    'hotel', 'restaurant', 'brewery', 'winery', 'development', 'construction',
    'downtown', 'chamber of commerce', 'small business', 'entrepreneur'
  ],
  entertainment: [
    'movie', 'film', 'cinema', 'theater', 'theatre', 'concert', 'music', 'band',
    'singer', 'actor', 'actress', 'celebrity', 'hollywood', 'broadway', 'show',
    'performance', 'festival', 'art', 'artist', 'gallery', 'museum', 'exhibit',
    'television', 'tv', 'streaming', 'netflix', 'disney', 'hulu', 'amazon prime',
    'award', 'grammy', 'oscar', 'emmy', 'tony', 'biltmore', 'orange peel',
    'asheville music', 'bluegrass', 'folk', 'jazz', 'symphony', 'opera',
    'comedy', 'comedian', 'standup', 'podcast', 'radio', 'dj'
  ],
  lifestyle: [
    'health', 'wellness', 'fitness', 'diet', 'nutrition', 'exercise', 'yoga',
    'meditation', 'mental health', 'therapy', 'counseling', 'self-care',
    'food', 'recipe', 'cooking', 'chef', 'dining', 'wine', 'beer', 'craft',
    'fashion', 'style', 'beauty', 'skincare', 'makeup', 'hair',
    'home', 'decor', 'interior', 'garden', 'gardening', 'diy', 'renovation',
    'family', 'parenting', 'children', 'kids', 'baby', 'wedding', 'marriage',
    'travel', 'vacation', 'destination', 'resort', 'getaway', 'adventure',
    'pets', 'dog', 'cat', 'animal', 'veterinary', 'shelter', 'adoption',
    'community', 'volunteer', 'nonprofit', 'charity', 'fundraiser', 'donation'
  ],
  outdoors: [
    'hiking', 'trail', 'mountain', 'camping', 'backpacking', 'wilderness',
    'nature', 'wildlife', 'park', 'forest', 'river', 'lake', 'waterfall',
    'fishing', 'hunting', 'kayaking', 'rafting', 'canoeing', 'paddleboard',
    'climbing', 'rock climbing', 'bouldering', 'skiing', 'snowboarding',
    'blue ridge', 'parkway', 'appalachian', 'smoky', 'pisgah', 'nantahala',
    'linville', 'grandfather', 'chimney rock', 'dupont', 'gorges',
    'conservation', 'environment', 'ecosystem', 'sustainability', 'green',
    'birding', 'bird watching', 'photography', 'scenic', 'overlook'
  ],
  // News is the default - anything that doesn't match other categories
  news: [
    'police', 'sheriff', 'arrest', 'crime', 'court', 'trial', 'judge', 'attorney',
    'government', 'governor', 'mayor', 'city council', 'county commission',
    'election', 'vote', 'ballot', 'candidate', 'politics', 'political', 'democrat', 'republican',
    'legislation', 'bill', 'law', 'regulation', 'policy', 'ordinance',
    'school', 'education', 'teacher', 'student', 'university', 'college',
    'hospital', 'medical', 'healthcare', 'doctor', 'nurse', 'patient',
    'fire', 'firefighter', 'emergency', 'rescue', 'accident', 'crash',
    'weather', 'storm', 'hurricane', 'tornado', 'flood', 'snow', 'ice',
    'breaking', 'update', 'report', 'investigation', 'official', 'announce'
  ]
};

interface CategoryResult {
  category: string;
  score: number;
  matchedKeywords: string[];
}

function categorizeArticle(title: string, slug: string, content: string, tags: string[]): CategoryResult {
  const searchText = `${title} ${slug} ${tags.join(' ')} ${content}`.toLowerCase();

  const results: CategoryResult[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      // Count occurrences - title matches count more
      const titleMatches = (title.toLowerCase().match(new RegExp(keywordLower, 'gi')) || []).length * 3;
      const slugMatches = (slug.toLowerCase().match(new RegExp(keywordLower, 'gi')) || []).length * 2;
      const tagMatches = tags.filter(t => t.toLowerCase().includes(keywordLower)).length * 2;
      const contentMatches = (content.toLowerCase().match(new RegExp(keywordLower, 'gi')) || []).length;

      const totalMatches = titleMatches + slugMatches + tagMatches + contentMatches;
      if (totalMatches > 0) {
        score += totalMatches;
        matchedKeywords.push(keyword);
      }
    }

    results.push({ category, score, matchedKeywords });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Return best match, default to 'News' if no strong match
  const best = results[0];
  if (best.score > 0 && best.category !== 'news') {
    return best;
  }

  // If news has the highest score or no matches, use News
  const newsResult = results.find(r => r.category === 'news') || { category: 'News', score: 0, matchedKeywords: [] };
  return { ...newsResult, category: 'News' };
}

/**
 * GET - Preview: Show how articles would be categorized
 */
export async function GET() {
  try {
    const db = getAdminFirestore();
    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.get();

    const categoryCounts: Record<string, number> = {
      News: 0,
      Sports: 0,
      Business: 0,
      Entertainment: 0,
      Lifestyle: 0,
      Outdoors: 0,
    };

    const currentCategoryCounts: Record<string, number> = {};
    let wouldChange = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const title = data.title || '';
      const slug = data.slug || '';
      const content = data.content || '';
      const tags = data.tags || [];
      const currentCategory = data.category || 'News';

      // Track current categories
      currentCategoryCounts[currentCategory] = (currentCategoryCounts[currentCategory] || 0) + 1;

      // Categorize
      const result = categorizeArticle(title, slug, content, tags);
      const newCategory = result.category.charAt(0).toUpperCase() + result.category.slice(1).toLowerCase();

      // Normalize to title case
      const normalizedCategory = newCategory === 'News' ? 'News' :
                                 newCategory.charAt(0).toUpperCase() + newCategory.slice(1);

      if (['News', 'Sports', 'Business', 'Entertainment', 'Lifestyle', 'Outdoors'].includes(normalizedCategory)) {
        categoryCounts[normalizedCategory]++;
      } else {
        categoryCounts['News']++;
      }

      if (currentCategory.toLowerCase() !== result.category.toLowerCase()) {
        wouldChange++;
      }
    });

    return NextResponse.json({
      success: true,
      total: snapshot.docs.length,
      currentDistribution: currentCategoryCounts,
      proposedDistribution: categoryCounts,
      wouldChange,
    });
  } catch (error) {
    console.error('Error previewing categorization:', error);
    return NextResponse.json(
      { error: 'Failed to preview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Execute: Auto-categorize all articles
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = body.batchSize || 100;

    const db = getAdminFirestore();
    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.get();

    let updated = 0;
    let unchanged = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    const categoryChanges: Record<string, Record<string, number>> = {};

    // Process articles
    for (let i = 0; i < snapshot.docs.length && i < batchSize; i++) {
      const doc = snapshot.docs[i];
      const data = doc.data();
      const title = data.title || '';
      const slug = data.slug || '';
      const content = data.content || '';
      const tags = data.tags || [];
      const currentCategory = data.category || 'News';

      try {
        const result = categorizeArticle(title, slug, content, tags);
        // Normalize to title case
        const newCategory = result.category.charAt(0).toUpperCase() + result.category.slice(1).toLowerCase();

        // Only update if category changed
        if (currentCategory.toLowerCase() !== result.category.toLowerCase()) {
          await articlesRef.doc(doc.id).update({
            category: newCategory,
            categoryUpdatedAt: new Date().toISOString(),
            categoryKeywords: result.matchedKeywords.slice(0, 5), // Store top 5 matched keywords
          });

          // Track changes
          const changeKey = `${currentCategory} → ${newCategory}`;
          categoryChanges[changeKey] = categoryChanges[changeKey] || {};
          categoryChanges[changeKey][title.substring(0, 40)] = result.score;

          updated++;
        } else {
          unchanged++;
        }
      } catch (error) {
        errors++;
        errorDetails.push(`${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Categorized ${updated} articles, ${unchanged} unchanged`,
      updated,
      unchanged,
      errors,
      errorDetails: errorDetails.slice(0, 10),
      categoryChanges,
      remaining: Math.max(0, snapshot.docs.length - batchSize),
    });
  } catch (error) {
    console.error('Error running categorization:', error);
    return NextResponse.json(
      { error: 'Categorization failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
