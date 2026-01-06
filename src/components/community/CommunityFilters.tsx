"use client";

import { useState } from 'react';
import { AlertTriangle, Calendar, HelpCircle, Info, ShieldAlert, Filter, Clock, TrendingUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface CommunityFiltersProps {
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
  topics?: string[];
}

// Default topic configuration
const DEFAULT_TOPICS = [
  { value: 'all', label: 'All Posts', icon: Filter, color: 'text-gray-600 dark:text-gray-400' },
  { value: 'general', label: 'General', icon: Info, color: 'text-blue-600 dark:text-blue-400' },
  { value: 'alert', label: 'Alerts', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' },
  { value: 'crime', label: 'Crime', icon: ShieldAlert, color: 'text-purple-600 dark:text-purple-400' },
  { value: 'event', label: 'Events', icon: Calendar, color: 'text-green-600 dark:text-green-400' },
  { value: 'question', label: 'Questions', icon: HelpCircle, color: 'text-orange-600 dark:text-orange-400' },
];

type DateFilter = 'all' | 'today' | 'week' | 'month';

interface CommunityFiltersWithDateProps extends CommunityFiltersProps {
  selectedDateFilter?: DateFilter;
  onDateFilterChange?: (filter: DateFilter) => void;
  showDateFilters?: boolean;
}

export function CommunityFilters({
  selectedTopic,
  onTopicChange,
  topics,
  selectedDateFilter = 'all',
  onDateFilterChange,
  showDateFilters = false,
}: CommunityFiltersWithDateProps) {
  // Use custom topics if provided, otherwise use defaults
  const topicOptions = topics
    ? [
        { value: 'all', label: 'All Posts', icon: Filter, color: 'text-gray-600 dark:text-gray-400' },
        ...topics.map((t) => {
          const defaultTopic = DEFAULT_TOPICS.find((dt) => dt.value === t);
          return defaultTopic || { value: t, label: t, icon: Info, color: 'text-gray-600 dark:text-gray-400' };
        }),
      ]
    : DEFAULT_TOPICS;

  return (
    <div className="space-y-4">
      {/* Topic Filters - Scrollable on mobile */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <Tabs value={selectedTopic} onValueChange={onTopicChange} className="w-full">
          <TabsList className="inline-flex h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-auto min-w-full md:min-w-0">
            {topicOptions.map((topic) => {
              const IconComponent = topic.icon;
              const isSelected = selectedTopic === topic.value;
              return (
                <TabsTrigger
                  key={topic.value}
                  value={topic.value}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-medium whitespace-nowrap
                    ${isSelected ? topic.color : 'text-gray-500 dark:text-gray-400'}
                  `}
                >
                  <IconComponent size={14} />
                  <span className="hidden sm:inline">{topic.label}</span>
                  <span className="sm:hidden">{topic.label.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Date Filters (Optional) */}
      {showDateFilters && onDateFilterChange && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedDateFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateFilterChange('all')}
            className="text-xs"
          >
            <Filter size={12} className="mr-1" />
            All Time
          </Button>
          <Button
            variant={selectedDateFilter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateFilterChange('today')}
            className="text-xs"
          >
            <Clock size={12} className="mr-1" />
            Today
          </Button>
          <Button
            variant={selectedDateFilter === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateFilterChange('week')}
            className="text-xs"
          >
            <TrendingUp size={12} className="mr-1" />
            This Week
          </Button>
          <Button
            variant={selectedDateFilter === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateFilterChange('month')}
            className="text-xs"
          >
            <Calendar size={12} className="mr-1" />
            This Month
          </Button>
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar
export function CommunityFiltersCompact({
  selectedTopic,
  onTopicChange,
  topics,
}: CommunityFiltersProps) {
  const topicOptions = topics
    ? [
        { value: 'all', label: 'All Posts', icon: Filter, color: 'text-gray-600 dark:text-gray-400' },
        ...topics.map((t) => {
          const defaultTopic = DEFAULT_TOPICS.find((dt) => dt.value === t);
          return defaultTopic || { value: t, label: t, icon: Info, color: 'text-gray-600 dark:text-gray-400' };
        }),
      ]
    : DEFAULT_TOPICS;

  return (
    <div className="space-y-1">
      {topicOptions.map((topic) => {
        const IconComponent = topic.icon;
        const isSelected = selectedTopic === topic.value;
        return (
          <button
            key={topic.value}
            onClick={() => onTopicChange(topic.value)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isSelected
                ? `${topic.color} bg-gray-100 dark:bg-gray-700`
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}
            `}
          >
            <IconComponent size={16} />
            {topic.label}
          </button>
        );
      })}
    </div>
  );
}

// Mobile-friendly chip filters
export function CommunityFilterChips({
  selectedTopic,
  onTopicChange,
  topics,
}: CommunityFiltersProps) {
  const topicOptions = topics
    ? [
        { value: 'all', label: 'All', icon: Filter, color: 'text-gray-600 dark:text-gray-400', bgSelected: 'bg-gray-200 dark:bg-gray-700' },
        ...topics.map((t) => {
          const defaultTopic = DEFAULT_TOPICS.find((dt) => dt.value === t);
          if (defaultTopic) {
            return {
              ...defaultTopic,
              bgSelected: getTopicBgColor(t),
            };
          }
          return { value: t, label: t, icon: Info, color: 'text-gray-600 dark:text-gray-400', bgSelected: 'bg-gray-200 dark:bg-gray-700' };
        }),
      ]
    : DEFAULT_TOPICS.map((t) => ({ ...t, bgSelected: getTopicBgColor(t.value) }));

  return (
    <div className="flex flex-wrap gap-2">
      {topicOptions.map((topic) => {
        const IconComponent = topic.icon;
        const isSelected = selectedTopic === topic.value;
        return (
          <button
            key={topic.value}
            onClick={() => onTopicChange(topic.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${isSelected
                ? `${topic.color} ${topic.bgSelected || 'bg-gray-100 dark:bg-gray-700'}`
                : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}
            `}
          >
            <IconComponent size={12} />
            {topic.label}
          </button>
        );
      })}
    </div>
  );
}

function getTopicBgColor(topic: string): string {
  switch (topic) {
    case 'all':
      return 'bg-gray-200 dark:bg-gray-700';
    case 'general':
      return 'bg-blue-100 dark:bg-blue-900/30';
    case 'alert':
      return 'bg-red-100 dark:bg-red-900/30';
    case 'crime':
      return 'bg-purple-100 dark:bg-purple-900/30';
    case 'event':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'question':
      return 'bg-orange-100 dark:bg-orange-900/30';
    default:
      return 'bg-gray-200 dark:bg-gray-700';
  }
}
