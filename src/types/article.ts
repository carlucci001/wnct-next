export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: string;
  title: string;
  content: string;
  slug: string;
  author: {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
  };
  category: string;
  tags: string[];
  status: ArticleStatus;
  publishedAt?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  featuredImage?: string;
}
