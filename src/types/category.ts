/**
 * Category type definitions for the AI Newsroom
 * Categories are stored in Firestore 'categories' collection
 */

export interface Category {
  id: string;
  name: string;                    // Display name, e.g., "News", "Sports"
  slug: string;                    // URL-friendly slug, e.g., "news", "sports"
  color: string;                   // Hex color, e.g., "#2563eb"
  description?: string;            // Optional description of the category
  editorialDirective: string;      // AI prompt directive for this category
  isActive: boolean;               // Whether category is active/visible
  sortOrder: number;               // For manual ordering in lists
  articleCount: number;            // Cached count of articles (updated on changes)
  createdAt: string;               // ISO timestamp
  updatedAt: string;               // ISO timestamp
  createdBy: string;               // UID of user who created this category
}

/**
 * Input type for creating/updating categories
 * Omits auto-generated fields
 */
export type CategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'articleCount'>;

/**
 * Partial input for updating categories
 */
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Default colors for categories
 */
export const CATEGORY_COLORS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#059669' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Yellow', value: '#ca8a04' },
  { name: 'Slate', value: '#475569' },
] as const;

/**
 * Default categories to seed the database
 */
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: 'News',
    slug: 'news',
    color: '#2563eb',
    description: 'Breaking news and current events',
    editorialDirective: 'Focus on accuracy and timeliness. Include police reports and official sources where possible. Verify facts with multiple sources.',
    isActive: true,
    sortOrder: 1,
    articleCount: 0,
  },
  {
    name: 'Sports',
    slug: 'sports',
    color: '#dc2626',
    description: 'Local and regional sports coverage',
    editorialDirective: 'Cover high school football and local sports activities in the Western North Carolina region. Include scores, standings, and player highlights.',
    isActive: true,
    sortOrder: 2,
    articleCount: 0,
  },
  {
    name: 'Business',
    slug: 'business',
    color: '#059669',
    description: 'Local business and economic news',
    editorialDirective: 'Focus on local business developments, job market trends, and economic impacts on the community. Highlight new businesses and entrepreneurship.',
    isActive: true,
    sortOrder: 3,
    articleCount: 0,
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    color: '#7c3aed',
    description: 'Arts, culture, and entertainment',
    editorialDirective: 'Cover local arts, music, theater, and cultural events. Include reviews and previews of upcoming performances and exhibitions.',
    isActive: true,
    sortOrder: 4,
    articleCount: 0,
  },
  {
    name: 'Lifestyle',
    slug: 'lifestyle',
    color: '#db2777',
    description: 'Community life and human interest',
    editorialDirective: 'Feature human interest stories, community profiles, and lifestyle topics relevant to Western NC residents.',
    isActive: true,
    sortOrder: 5,
    articleCount: 0,
  },
  {
    name: 'Outdoors',
    slug: 'outdoors',
    color: '#16a34a',
    description: 'Outdoor recreation and nature',
    editorialDirective: 'Cover hiking, camping, fishing, and outdoor activities in the Blue Ridge Mountains and surrounding areas. Include trail conditions and seasonal guides.',
    isActive: true,
    sortOrder: 6,
    articleCount: 0,
  },
];
