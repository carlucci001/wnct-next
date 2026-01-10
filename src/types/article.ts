export type ArticleStatus = 'draft' | 'review' | 'published' | 'archived';

export interface Article {
  id: string;
  title: string;
  content?: string;
  slug: string;
  author: string;
  authorId?: string;
  authorPhotoURL?: string;
  category: string;
  categoryColor?: string;
  tags?: string[];
  status?: 'draft' | 'review' | 'published' | 'archived' | 'Published' | 'Draft' | 'Review';
  imageCredit?: string;
  textToSpeechEnabled?: boolean;
  textToSpeechProvider?: 'free' | 'google';
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
  featuredImage?: string;
  imageUrl?: string;
  excerpt?: string;
  isFeatured?: boolean;
  isBreakingNews?: boolean;
  breakingNewsTimestamp?: string;
  views?: number;
  // SaaS Multi-Tenancy
  tenantId?: string;           // The tenant this article belongs to
  creditsUsed?: number;        // Credits consumed to generate this article
  generatedWithAI?: boolean;   // Whether AI was used to create this

  // Fact-Check Fields
  factCheckStatus?: 'passed' | 'review_recommended' | 'caution' | 'high_risk' | 'not_checked';
  factCheckSummary?: string;
  factCheckConfidence?: number;
  factCheckedAt?: string;
  factCheckMode?: 'quick' | 'detailed';
  factCheckClaims?: Array<{
    text: string;
    status: 'verified' | 'unverified' | 'disputed' | 'opinion';
    explanation: string;
  }>;
  factCheckRecommendations?: string[];

  // Source tracking for AI-generated articles
  sourceUrl?: string;
  sourceTitle?: string;
  sourceSummary?: string;
  sourceItemId?: string;

  // SEO & Social Metadata (auto-generated)
  metaDescription?: string;    // SEO meta description (max 160 chars)
  imageAltText?: string;       // Alt text for featured image
  hashtags?: string[];         // Social media hashtags
  keywords?: string[];         // Focus keywords for SEO
  schema?: string;             // Schema.org JSON-LD structured data

  // GEO & AI Optimization
  localKeywords?: string[];    // Local geographic keywords
  geoTags?: string[];          // Geographic location tags
  entities?: {                 // Extracted entities for knowledge graph
    people?: string[];
    organizations?: string[];
    locations?: string[];
    topics?: string[];
  };
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  count: number;
  color?: string;
}

// Community Types
export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  type: 'general' | 'alert' | 'event' | 'question' | 'crime';
  location?: {
    lat: number;
    lng: number;
    name: string;
  };
}

// Business Directory Types
export interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  imageUrl: string;
  rating: number;
  tier?: 'standard' | 'premium';
  slug?: string;
  ownerId?: string;
  // SaaS Multi-Tenancy
  tenantId?: string;           // The tenant this business belongs to
  advertiserId?: string;       // Link to advertiser if they're advertising
}
