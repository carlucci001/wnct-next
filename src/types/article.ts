export interface Article {
  id: string;
  title: string;
  content: string; // HTML or Markdown content
  slug: string;
  author: string; // Could be a user ID or name, sticking to string for now as per description
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived'; // Assuming these status values
  publishedAt: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  featuredImage: string; // URL to the image
  excerpt?: string; // Optional short description
}
