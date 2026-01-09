import { Timestamp } from 'firebase/firestore';

export type CommentStatus = 'pending' | 'approved' | 'flagged' | 'deleted';

export interface Comment {
  id: string;
  articleId: string;
  articleTitle?: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  status: CommentStatus;
  likes: number;
  likedBy: string[];
  repliesCount: number;
  parentId?: string; // For nested comments
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface CommentSettings {
  enabled: boolean;
  requireApproval: boolean;
  allowGuestComments: boolean;
  maxCharacters: number;
  blockedKeywords: string[];
}
