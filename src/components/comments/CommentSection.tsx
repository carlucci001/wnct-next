"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Comment } from '@/types/comment';
import { getCommentsForArticle } from '@/lib/comments';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CommentSectionProps {
  articleId: string;
  articleTitle?: string;
}

export function CommentSection({ articleId, articleTitle }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();
  
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'editor-in-chief';

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCommentsForArticle(articleId, isAdmin);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [articleId, isAdmin]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <section className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-8">
        <MessageSquare className="text-blue-600" size={24} />
        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h2>
      </div>

      <div className="mb-10">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
          Leave a comment
        </h3>
        <CommentForm 
          articleId={articleId} 
          articleTitle={articleTitle} 
          onCommentAdded={fetchComments} 
        />
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              onRefresh={fetchComments}
              isAdmin={isAdmin}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </section>
  );
}
