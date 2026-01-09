"use client";

import React, { useState } from 'react';
import { Comment } from '@/types/comment';
import { Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MoreVertical, Flag, Trash2, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toggleLikeComment, deleteComment, updateComment } from '@/lib/comments';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentItemProps {
  comment: Comment;
  onRefresh: () => void;
  isAdmin?: boolean;
}

export function CommentItem({ comment, onRefresh, isAdmin = false }: CommentItemProps) {
  const { currentUser } = useAuth();
  const [isLiking, setIsLiking] = useState(false);

  const isLiked = currentUser && comment.likedBy?.includes(currentUser.uid);
  const isOwner = currentUser && comment.userId === currentUser.uid;

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please login to like comments');
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      await toggleLikeComment(comment.id, currentUser.uid, !isLiked);
      onRefresh();
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(comment.id);
        toast.success('Comment deleted');
        onRefresh();
      } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
    }
  };

  const handleFlag = async () => {
    try {
      await updateComment(comment.id, { status: 'flagged' });
      toast.success('Comment reported');
      onRefresh();
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast.error('Failed to report comment');
    }
  };

  const formatDate = (date: Comment['createdAt']) => {
    if (!date) return '';
    
    let d: Date;
    if (date instanceof Timestamp) {
      d = date.toDate();
    } else if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as any).toDate === 'function') {
      d = (date as any).toDate();
    } else {
      d = new Date(date as string);
    }
    
    return formatDistanceToNow(d, { addSuffix: true });
  };

  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-gray-100 dark:border-slate-700">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={comment.userPhotoURL} />
        <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {comment.userName?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
              {comment.userName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.createdAt)}
            </span>
            {comment.status === 'flagged' && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded uppercase">
                Flagged
              </span>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(isOwner || isAdmin) && (
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              )}
              {!isOwner && (
                <DropdownMenuItem onClick={handleFlag}>
                  <Flag size={14} className="mr-2" /> Report
                </DropdownMenuItem>
              )}
              {isAdmin && comment.status !== 'approved' && (
                <DropdownMenuItem onClick={() => updateComment(comment.id, { status: 'approved' }).then(onRefresh)}>
                  <ShieldCheck size={14} className="mr-2" /> Approve
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
          {comment.content}
        </p>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 text-xs font-medium transition ${
              isLiked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <ThumbsUp size={14} className={isLiked ? 'fill-current' : ''} />
            {comment.likes || 0}
          </button>
        </div>
      </div>
    </div>
  );
}
