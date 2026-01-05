import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { getAllContentSources, saveContentItems, updateSourceLastFetched, seedDefaultSources } from '@/lib/contentSources';
import { ContentItem } from '@/types/contentSource';

// RSS Parser instance
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
    ],
  },
});

/**
 * POST /api/content/fetch-sources
 * Fetches content from all active RSS sources
 * Can be called by cron job or Cloud Function
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify request is from authorized source
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.CONTENT_FETCH_API_KEY;

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { sourceId, categoryId } = body;

    // Get sources to fetch
    let sources = await getAllContentSources(true);

    // Auto-seed default sources if none exist
    if (sources.length === 0) {
      console.log('No content sources found, seeding defaults...');
      const seededCount = await seedDefaultSources();
      if (seededCount > 0) {
        sources = await getAllContentSources(true);
        console.log(`Seeded ${seededCount} default sources, now have ${sources.length} active sources`);
      }
    }

    // Filter by specific source if provided
    if (sourceId) {
      sources = sources.filter((s) => s.id === sourceId);
    }

    // Filter by category if provided
    if (categoryId) {
      sources = sources.filter((s) => !s.categoryId || s.categoryId === categoryId);
    }

    // Filter sources that need refresh (based on lastFetchedAt and refreshInterval)
    const now = new Date();
    sources = sources.filter((source) => {
      if (!source.lastFetchedAt) return true;
      const lastFetched = new Date(source.lastFetchedAt);
      const minutesSinceLastFetch = (now.getTime() - lastFetched.getTime()) / (1000 * 60);
      return minutesSinceLastFetch >= source.refreshIntervalMinutes;
    });

    if (sources.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sources need refreshing',
        itemsFetched: 0,
      });
    }

    let totalItems = 0;
    const results: { sourceId: string; sourceName: string; itemCount: number; error?: string }[] = [];

    // Fetch each source
    for (const source of sources) {
      if (source.type !== 'rss' || !source.url) {
        continue;
      }

      try {
        const feed = await parser.parseURL(source.url);
        const items: Omit<ContentItem, 'id'>[] = [];

        for (const item of feed.items.slice(0, 20)) {
          // Skip if no title
          if (!item.title) continue;

          // Extract image URL from various possible sources
          let imageUrl = '';
          if (item.enclosure?.url) {
            imageUrl = item.enclosure.url;
          } else if ((item as any).mediaContent?.['$']?.url) {
            imageUrl = (item as any).mediaContent['$'].url;
          } else if ((item as any).mediaThumbnail?.['$']?.url) {
            imageUrl = (item as any).mediaThumbnail['$'].url;
          }

          // Check keyword filters
          if (source.keywords && source.keywords.length > 0) {
            const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
            const hasKeyword = source.keywords.some((kw) => content.includes(kw.toLowerCase()));
            if (!hasKeyword) continue;
          }

          // Calculate relevance score based on recency and source priority
          const publishedDate = item.pubDate ? new Date(item.pubDate) : new Date();
          const hoursOld = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
          const recencyScore = Math.max(0, 100 - hoursOld * 2); // Lose 2 points per hour
          const priorityScore = source.priority * 10;
          const relevanceScore = Math.round((recencyScore + priorityScore) / 2);

          items.push({
            sourceId: source.id,
            sourceName: source.name,
            title: item.title,
            description: item.contentSnippet || item.content || '',
            url: item.link || '',
            publishedAt: publishedDate.toISOString(),
            fetchedAt: now.toISOString(),
            category: source.categoryId || '',
            keywords: extractKeywords(item.title, item.contentSnippet || ''),
            imageUrl,
            relevanceScore,
            isProcessed: false,
          });
        }

        // Save items to Firestore
        if (items.length > 0) {
          await saveContentItems(items);
          totalItems += items.length;
        }

        // Update source's last fetched timestamp
        await updateSourceLastFetched(source.id);

        results.push({
          sourceId: source.id,
          sourceName: source.name,
          itemCount: items.length,
        });
      } catch (error) {
        console.error(`Error fetching source ${source.name}:`, error);
        results.push({
          sourceId: source.id,
          sourceName: source.name,
          itemCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      sourcesProcessed: results.length,
      itemsFetched: totalItems,
      results,
    });
  } catch (error) {
    console.error('Error in fetch-sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Extract keywords from title and description
 */
function extractKeywords(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const keywords: string[] = [];

  // Local location keywords
  const locations = [
    'asheville', 'hendersonville', 'waynesville', 'brevard', 'black mountain',
    'weaverville', 'canton', 'sylva', 'western nc', 'blue ridge', 'buncombe',
    'henderson', 'haywood', 'transylvania', 'madison', 'jackson', 'swain',
  ];

  // Topic keywords
  const topics = [
    'school', 'police', 'fire', 'council', 'mayor', 'election', 'vote',
    'business', 'restaurant', 'sports', 'football', 'basketball', 'baseball',
    'weather', 'storm', 'flood', 'traffic', 'crash', 'road', 'highway',
    'hospital', 'health', 'covid', 'park', 'trail', 'hiking', 'outdoor',
    'festival', 'concert', 'art', 'museum', 'brewery', 'downtown',
  ];

  for (const loc of locations) {
    if (text.includes(loc)) keywords.push(loc);
  }

  for (const topic of topics) {
    if (text.includes(topic)) keywords.push(topic);
  }

  return [...new Set(keywords)].slice(0, 10);
}

/**
 * GET /api/content/fetch-sources
 * Returns current source status
 */
export async function GET() {
  try {
    const sources = await getAllContentSources();
    return NextResponse.json({
      success: true,
      sources: sources.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        isActive: s.isActive,
        lastFetchedAt: s.lastFetchedAt,
        refreshIntervalMinutes: s.refreshIntervalMinutes,
      })),
    });
  } catch (error) {
    console.error('Error getting sources:', error);
    return NextResponse.json({ error: 'Failed to get sources' }, { status: 500 });
  }
}
