export interface Article {
  id: string;
  title: string;
  status: 'published' | 'draft' | 'archived';
  category: string;
  createdAt: string;
  excerpt?: string;
  image?: string;
  authorId?: string;
}

export interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
}
