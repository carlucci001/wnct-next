export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}
