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
}
