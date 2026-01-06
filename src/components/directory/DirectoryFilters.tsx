'use client';

import { Badge } from '@/components/ui/badge';
import { DEFAULT_BUSINESS_CATEGORIES } from '@/types/business';

interface DirectoryFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function DirectoryFilters({ selectedCategory, onCategoryChange }: DirectoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={selectedCategory === 'all' ? 'default' : 'outline'}
        className="cursor-pointer hover:bg-primary/80 transition-colors"
        onClick={() => onCategoryChange('all')}
      >
        All
      </Badge>
      {DEFAULT_BUSINESS_CATEGORIES.map((category) => (
        <Badge
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-primary/80 transition-colors"
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </Badge>
      ))}
    </div>
  );
}
