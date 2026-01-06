"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Send, MapPin, AlertTriangle, Calendar, HelpCircle, Info, ShieldAlert, LogIn, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { createCommunityPost } from '@/lib/communityPosts';

interface CommunityPostFormProps {
  currentUserId?: string;
  currentUserName?: string;
  currentUserPhoto?: string;
  onPostCreated?: () => void;
}

const POST_TYPES = [
  { value: 'general', label: 'General', icon: Info, color: 'text-blue-600 dark:text-blue-400' },
  { value: 'alert', label: 'Alert', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' },
  { value: 'crime', label: 'Crime', icon: ShieldAlert, color: 'text-purple-600 dark:text-purple-400' },
  { value: 'event', label: 'Event', icon: Calendar, color: 'text-green-600 dark:text-green-400' },
  { value: 'question', label: 'Question', icon: HelpCircle, color: 'text-orange-600 dark:text-orange-400' },
];

const MAX_CHARACTERS = 500;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CommunityPostForm({
  currentUserId,
  currentUserName = 'User',
  currentUserPhoto,
  onPostCreated,
}: CommunityPostFormProps) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [hasLocation, setHasLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characterCount = content.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting;

  // Not logged in state
  if (!currentUserId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <LogIn size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Join the Conversation
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
            Sign in to share updates, ask questions, and connect with your community.
          </p>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <LogIn size={16} className="mr-2" />
              Sign In to Post
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !currentUserId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createCommunityPost({
        authorId: currentUserId,
        authorName: currentUserName,
        authorPhoto: currentUserPhoto,
        content: content.trim(),
        topic: postType,
      });

      // Reset form
      setContent('');
      setPostType('general');
      setHasLocation(false);

      // Notify parent
      onPostCreated?.();
    } catch (err) {
      console.error('Failed to create post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      <form onSubmit={handleSubmit}>
        {/* User Avatar & Textarea */}
        <div className="flex gap-3 mb-4">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={currentUserPhoto} alt={currentUserName} />
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold">
              {getInitials(currentUserName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-grow">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in your community?"
              className={`w-full bg-gray-50 dark:bg-gray-900 border rounded-lg p-3
                focus:outline-none focus:ring-2 resize-none min-h-[100px] text-sm md:text-base
                text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                ${isOverLimit
                  ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'}
              `}
              rows={4}
            />

            {/* Character Counter */}
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs ${
                  isOverLimit
                    ? 'text-red-500 dark:text-red-400 font-semibold'
                    : characterCount > MAX_CHARACTERS * 0.8
                      ? 'text-orange-500 dark:text-orange-400'
                      : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {characterCount}/{MAX_CHARACTERS}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Post Type Selector & Location Toggle */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Post Type Selector */}
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs md:text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {POST_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Location Toggle */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHasLocation(!hasLocation)}
              className={`flex items-center gap-1.5 text-xs md:text-sm transition-colors
                ${hasLocation
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  : 'text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                }`}
            >
              <MapPin size={14} />
              {hasLocation ? 'Location Added' : 'Add Location'}
            </Button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Post
              </>
            )}
          </Button>
        </div>

        {/* Post Type Icons Display */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map((type) => {
              const IconComponent = type.icon;
              const isSelected = postType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setPostType(type.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${isSelected
                      ? `${type.color} bg-gray-100 dark:bg-gray-700 ring-1 ring-current`
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  <IconComponent size={14} />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
}
