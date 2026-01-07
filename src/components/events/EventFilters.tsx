'use client';

import React from 'react';
import { Search, Filter, Calendar as CalendarIcon, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_EVENT_CATEGORIES } from '@/types/event';

interface EventFiltersProps {
  currentCategory: string;
  setCategory: (category: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: 'calendar' | 'list';
  setViewMode: (mode: 'calendar' | 'list') => void;
}

export function EventFilters({
  currentCategory,
  setCategory,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode
}: EventFiltersProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* Search and View Toggle */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events, festivals, concerts..."
            className="pl-9 h-11 bg-card border-border/50 shadow-sm rounded-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-1 bg-muted p-1 rounded-full border border-border/50">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-full h-9 px-4"
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="rounded-full h-9 px-4"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <Badge
          variant={currentCategory === 'all' ? 'default' : 'outline'}
          className={`cursor-pointer px-4 py-1.5 rounded-full transition-all ${
            currentCategory === 'all' ? '' : 'hover:bg-muted'
          }`}
          onClick={() => setCategory('all')}
        >
          All Events
        </Badge>
        {DEFAULT_EVENT_CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={currentCategory === cat ? 'default' : 'outline'}
            className={`cursor-pointer px-4 py-1.5 rounded-full transition-all ${
              currentCategory === cat ? '' : 'hover:bg-muted'
            }`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>
      
      {/* Quick Date Filters */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground overflow-x-auto pb-2 scrollbar-hide">
        <span className="font-semibold text-foreground shrink-0 border-r pr-4">Quick Filters:</span>
        <button className="hover:text-primary whitespace-nowrap">Today</button>
        <button className="hover:text-primary whitespace-nowrap">This Weekend</button>
        <button className="hover:text-primary whitespace-nowrap">This Month</button>
        <button className="hover:text-primary whitespace-nowrap">Next 30 Days</button>
      </div>
    </div>
  );
}
