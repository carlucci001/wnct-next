import { Timestamp } from 'firebase/firestore';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  authorId: string;
  authorName: string;
  authorBio?: string;
  authorPhoto?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  viewCount: number;
  allowComments: boolean;
}

export interface BlogSettings {
  enabled: boolean;
  title: string;
  showInNav: boolean;
  postsPerPage: number;
  showAuthorBio: boolean;
  categories: string[];
}

export const DEFAULT_BLOG_CATEGORIES = [
  'Opinion',
  'Guest Column',
  'Staff Blog',
  'Local Flavor',
  'Community Voices',
  'Tech & Media',
  'Environment',
  'Lifestyle'
];
