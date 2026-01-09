"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createComment } from '@/lib/comments';
import { toast } from 'sonner';

interface CommentFormProps {
  articleId: string;
  articleTitle?: string;
  onCommentAdded: () => void;
  parentId?: string;
}

export function CommentForm({ articleId, articleTitle, onCommentAdded, parentId }: CommentFormProps) {
  const { currentUser, userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('You must be logged in to comment');
      return;
    }

    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await createComment({
        articleId,
        articleTitle,
        userId: currentUser.uid,
        userName: userProfile?.displayName || currentUser.displayName || 'Anonymous',
        userPhotoURL: userProfile?.photoURL || currentUser.photoURL || undefined,
        content: content.trim(),
        status: 'approved', // Todo: Check settings for requireApproval
        parentId,
      });

      setContent('');
      toast.success('Comment posted successfully');
      onCommentAdded();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Please log in to leave a comment.</p>
        <Button variant="outline" size="sm" asChild>
          <a href="/login">Login / Sign Up</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="Share your thoughts..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px] resize-none focus-visible:ring-blue-600"
        maxLength={1000}
      />
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || !content.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
}
