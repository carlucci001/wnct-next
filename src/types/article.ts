import { Timestamp } from 'firebase/firestore';

export interface Article {
  id?: string;
  title: string;
  content: string;
  slug: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  featuredImage?: string;
  authorId?: string;
  publishedAt?: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
