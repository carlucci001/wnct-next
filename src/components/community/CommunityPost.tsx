"use client";

import { useState } from 'react';
import { Heart, MessageCircle, MapPin, Pin, AlertTriangle, Calendar, HelpCircle, Info, ShieldAlert, MoreVertical, Flag, EyeOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommunityPostData, likePost, unlikePost, flagPost, setPostVisibility, togglePinPost } from '@/lib/communityPosts';
import { Timestamp } from 'firebase/firestore';

interface CommunityPostProps {
  post: CommunityPostData;
  currentUserId?: string;
  isAdmin?: boolean;
  onUpdate?: () => void;
}

// Post type configuration
const POST_TYPE_CONFIG = {
  general: {
    label: 'General',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Info,
  },
  alert: {
    label: 'Alert',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertTriangle,
  },
  crime: {
    label: 'Crime',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    icon: ShieldAlert,
  },
  event: {
    label: 'Event',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    icon: Calendar,
  },
  question: {
    label: 'Question',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-800',
    icon: HelpCircle,
  },
};

function formatTimestamp(timestamp: Timestamp | Date | string): string {
  const date = timestamp instanceof Timestamp
    ? timestamp.toDate()
    : typeof timestamp === 'string'
      ? new Date(timestamp)
      : timestamp;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CommunityPost({ post, currentUserId, isAdmin = false, onUpdate }: CommunityPostProps) {
  const [isLiked, setIsLiked] = useState(currentUserId ? post.likedBy?.includes(currentUserId) : false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [isLiking, setIsLiking] = useState(false);

  const config = POST_TYPE_CONFIG[post.topic as keyof typeof POST_TYPE_CONFIG] || POST_TYPE_CONFIG.general;
  const IconComponent = config.icon;

  const handleLike = async () => {
    if (!currentUserId || isLiking) return;

    setIsLiking(true);

    // Optimistic update
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
      try {
        await unlikePost(post.id, currentUserId);
      } catch (error) {
        // Revert on error
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        console.error('Failed to unlike post:', error);
      }
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      try {
        await likePost(post.id, currentUserId);
      } catch (error) {
        // Revert on error
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        console.error('Failed to like post:', error);
      }
    }

    setIsLiking(false);
  };

  const handleFlag = async () => {
    try {
      await flagPost(post.id);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to flag post:', error);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      await setPostVisibility(post.id, post.status !== 'hidden');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const handleTogglePin = async () => {
    try {
      await togglePinPost(post.id, !post.pinned);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border transition-all duration-200
        ${post.pinned
          ? 'border-l-4 border-l-yellow-500 border-t border-r border-b border-gray-200 dark:border-gray-700'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
        ${post.status === 'hidden' ? 'opacity-50' : ''}
        ${post.status === 'flagged' ? 'border-l-4 border-l-red-500' : ''}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.authorPhoto} alt={post.authorName} />
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold">
              {getInitials(post.authorName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">{post.authorName}</span>
              {post.pinned && (
                <Pin size={14} className="text-yellow-500" />
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(post.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Post Type Badge */}
          <Badge
            variant="outline"
            className={`flex items-center gap-1 text-[10px] uppercase font-bold ${config.bg} ${config.color} ${config.border}`}
          >
            <IconComponent size={12} />
            {config.label}
          </Badge>

          {/* Admin/User Actions */}
          {(currentUserId || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentUserId && !isAdmin && (
                  <DropdownMenuItem onClick={handleFlag} className="text-red-600 dark:text-red-400">
                    <Flag size={14} className="mr-2" />
                    Report Post
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={handleTogglePin}>
                      <Pin size={14} className="mr-2" />
                      {post.pinned ? 'Unpin Post' : 'Pin Post'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleVisibility}>
                      <EyeOff size={14} className="mr-2" />
                      {post.status === 'hidden' ? 'Show Post' : 'Hide Post'}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {post.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Post image ${idx + 1}`}
              className="rounded-lg object-cover w-full h-32 md:h-48"
            />
          ))}
        </div>
      )}

      {/* Status Badges */}
      {(post.status === 'flagged' || post.status === 'hidden') && isAdmin && (
        <div className="mb-3">
          <Badge variant={post.status === 'flagged' ? 'destructive' : 'secondary'}>
            {post.status === 'flagged' ? 'Flagged for Review' : 'Hidden'}
          </Badge>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={!currentUserId || isLiking}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors
            ${isLiked
              ? 'text-red-500 hover:text-red-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'}
          `}
        >
          <Heart size={18} className={isLiked ? 'fill-current' : ''} />
          <span>{likeCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
        >
          <MessageCircle size={18} />
          <span>{post.commentsCount || 0}</span>
        </Button>
      </div>
    </div>
  );
}

// Export the type config for use in other components
export { POST_TYPE_CONFIG };
