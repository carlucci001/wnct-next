
export const CATEGORY_COLORS: Record<string, string> = {
  news: '#1d4ed8',
  sports: '#dc2626',
  business: '#059669',
  entertainment: '#7c3aed',
  lifestyle: '#db2777',
  outdoors: '#16a34a',
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category.toLowerCase()] || '#1d4ed8';
};
