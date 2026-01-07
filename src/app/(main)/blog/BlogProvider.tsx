'use client';

import React, { createContext, useContext, useState } from 'react';

interface BlogContextType {
  currentAuthor: {
    authorName: string;
    authorPhoto?: string;
    authorBio?: string;
  } | null;
  setCurrentAuthor: (author: any) => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [currentAuthor, setCurrentAuthor] = useState(null);

  return (
    <BlogContext.Provider value={{ currentAuthor, setCurrentAuthor }}>
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
}
