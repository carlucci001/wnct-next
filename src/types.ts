export interface Article {
  id: string;
  title: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  date: string; // ISO string or timestamp
  slug: string;
}
