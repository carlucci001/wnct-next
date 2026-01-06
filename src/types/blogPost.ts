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

// Helper type for creating blog posts (without auto-generated fields)
export type CreateBlogPostData = Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>;

// Helper type for updating blog posts
export type UpdateBlogPostData = Partial<Omit<BlogPost, 'id' | 'createdAt'>>;
