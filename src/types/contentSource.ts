/**
 * Content Source types for AI agent content discovery
 * Sources provide raw material for AI agents to write articles about
 */

/**
 * Types of content sources
 */
export type ContentSourceType = 'rss' | 'google-trends' | 'manual-topic' | 'api';

/**
 * A configured content source
 */
export interface ContentSource {
  id: string;
  name: string;                    // Display name, e.g., "WLOS News"
  type: ContentSourceType;
  url?: string;                    // RSS feed URL or API endpoint
  categoryId?: string;             // Associated category (or null for all)
  region?: string;                 // Geographic filter, e.g., "Asheville, NC"
  keywords?: string[];             // Filter keywords
  isActive: boolean;
  priority: number;                // Higher = check first (1-10)
  refreshIntervalMinutes: number;  // How often to fetch new content
  lastFetchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A fetched content item from a source
 */
export interface ContentItem {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  description?: string;
  url: string;
  fullContent?: string;           // Full article text fetched from URL (optional)
  publishedAt: string;
  fetchedAt: string;
  category?: string;
  keywords?: string[];
  imageUrl?: string;
  // Scoring for relevance
  relevanceScore?: number;
  isProcessed: boolean;           // Has this been used to generate an article?
  processedAt?: string;
  articleId?: string;             // If an article was generated from this
}

/**
 * Input for creating a content source
 */
export type ContentSourceInput = Omit<ContentSource, 'id' | 'createdAt' | 'updatedAt' | 'lastFetchedAt'>;

/**
 * Default RSS feeds for Western NC news
 */
export const DEFAULT_RSS_SOURCES: Omit<ContentSource, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'WLOS ABC 13 News',
    type: 'rss',
    url: 'https://wlos.com/news/local.rss',
    region: 'Asheville, NC',
    isActive: true,
    priority: 10,
    refreshIntervalMinutes: 30,
  },
  {
    name: 'Asheville Citizen-Times',
    type: 'rss',
    url: 'https://www.citizen-times.com/rss/',
    region: 'Asheville, NC',
    isActive: true,
    priority: 9,
    refreshIntervalMinutes: 30,
  },
  {
    name: 'Mountain Xpress',
    type: 'rss',
    url: 'https://mountainx.com/feed/',
    region: 'Asheville, NC',
    isActive: true,
    priority: 8,
    refreshIntervalMinutes: 60,
  },
  {
    name: 'Blue Ridge Now',
    type: 'rss',
    url: 'https://www.blueridgenow.com/search/?f=rss',
    region: 'Hendersonville, NC',
    isActive: true,
    priority: 7,
    refreshIntervalMinutes: 60,
  },
  {
    name: 'WCNC Charlotte',
    type: 'rss',
    url: 'https://www.wcnc.com/feeds/syndication/rss/news',
    region: 'Charlotte, NC',
    keywords: ['western nc', 'asheville', 'mountains'],
    isActive: true,
    priority: 5,
    refreshIntervalMinutes: 60,
  },
];

/**
 * Category-specific source suggestions
 */
export const CATEGORY_SOURCE_SUGGESTIONS: Record<string, { name: string; url: string; description: string }[]> = {
  news: [
    { name: 'WLOS Local', url: 'https://wlos.com/news/local.rss', description: 'Local Asheville news' },
    { name: 'AP News NC', url: 'https://apnews.com/hub/north-carolina?format=rss', description: 'AP News for North Carolina' },
  ],
  sports: [
    { name: 'WLOS Sports', url: 'https://wlos.com/sports.rss', description: 'Local sports coverage' },
    { name: 'High School OT', url: 'https://www.highschoolot.com/rss/', description: 'NC high school sports' },
  ],
  business: [
    { name: 'Asheville Chamber', url: 'https://www.ashevillechamber.org/feed/', description: 'Chamber of Commerce news' },
    { name: 'BizJournals Charlotte', url: 'https://www.bizjournals.com/charlotte/news.rss', description: 'Regional business news' },
  ],
  entertainment: [
    { name: 'Mountain Xpress Arts', url: 'https://mountainx.com/arts/feed/', description: 'Local arts and culture' },
    { name: 'Asheville Events', url: 'https://www.exploreasheville.com/events/rss/', description: 'Local events calendar' },
  ],
  outdoors: [
    { name: 'NPS Blue Ridge', url: 'https://www.nps.gov/blri/learn/news/newsreleases.htm?format=rss', description: 'Blue Ridge Parkway news' },
    { name: 'AllTrails Asheville', url: 'https://www.alltrails.com/api/alltrails/v2/search/trails.rss?q=asheville', description: 'Trail updates' },
  ],
  lifestyle: [
    { name: 'Mountain Xpress Food', url: 'https://mountainx.com/food/feed/', description: 'Local food and dining' },
    { name: 'Asheville Scene', url: 'https://ashevillescene.com/feed/', description: 'Community lifestyle' },
  ],
};
