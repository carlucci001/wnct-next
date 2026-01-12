'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { DirectoryGrid } from '@/components/directory/DirectoryGrid';
import { DirectorySidebar } from '@/components/directory/DirectorySidebar';
import { DirectorySearch } from '@/components/directory/DirectorySearch';
import { DirectoryFilters } from '@/components/directory/DirectoryFilters';
import { DirectoryConfigModal } from '@/components/directory/DirectoryConfigModal';
import { Business, DirectorySettings } from '@/types/business';
import { getActiveBusinesses, searchBusinesses, getDirectorySettings, getDefaultDirectorySettings } from '@/lib/directory';

export default function DirectoryClient() {
  const { userProfile } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [settings, setSettings] = useState<DirectorySettings>(getDefaultDirectorySettings());

  const isAdmin = userProfile?.role &&
    ['admin', 'business-owner', 'editor-in-chief'].includes(userProfile.role);

  useEffect(() => {
    async function loadSettings() {
      try {
        const saved = await getDirectorySettings();
        if (saved) {
          setSettings(saved);
        }
      } catch (error) {
        console.error('Error loading directory settings:', error);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    async function loadBusinesses() {
      setLoading(true);
      try {
        let results: Business[];
        if (searchTerm) {
          results = await searchBusinesses(searchTerm);
          if (selectedCategory !== 'all') {
            results = results.filter(b => b.category === selectedCategory);
          }
        } else {
          results = await getActiveBusinesses(selectedCategory !== 'all' ? selectedCategory : undefined);
        }
        setBusinesses(results);
      } catch (error) {
        console.error('Error loading businesses:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBusinesses();
  }, [selectedCategory, searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const featuredBusinesses = businesses.filter(b => b.featured);
  const regularBusinesses = businesses.filter(b => !b.featured);

  return (
    <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="lg:w-2/3 flex flex-col w-full">
          <div className="mb-6 flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                {settings.title}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Discover local businesses in Western North Carolina
              </p>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfigOpen(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings size={20} />
              </Button>
            )}
          </div>

          <div className="mb-6">
            <DirectorySearch onSearch={handleSearch} />
          </div>

          <div className="mb-6 lg:hidden">
            <DirectoryFilters
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          <div className="mb-4 text-sm text-muted-foreground">
            Showing <span className="font-semibold">{businesses.length}</span> businesses
            {selectedCategory !== 'all' && (
              <span> in <span className="font-semibold">{selectedCategory}</span></span>
            )}
            {searchTerm && (
              <span> matching &quot;{searchTerm}&quot;</span>
            )}
          </div>

          {!loading && featuredBusinesses.length > 0 && !searchTerm && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-yellow-500">★</span> Featured Businesses
              </h2>
              <DirectoryGrid businesses={featuredBusinesses} />
            </div>
          )}

          <DirectoryGrid
            businesses={searchTerm ? businesses : regularBusinesses}
            loading={loading}
          />

          {!loading && businesses.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline">Load More</Button>
            </div>
          )}
        </div>

        <div className="lg:w-1/3 hidden lg:flex flex-col sticky top-24">
          <DirectorySidebar
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      <DirectoryConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  );
}
