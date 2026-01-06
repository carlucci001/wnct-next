"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BlogSettings } from '@/types/blogPost';
import { getBlogSettings, updateBlogSettings } from '@/lib/blog';
import { toast } from 'sonner';

interface BlogConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSettingsUpdate?: (settings: BlogSettings) => void;
}

export function BlogConfigModal({ open, onClose, onSettingsUpdate }: BlogConfigModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BlogSettings>({
    enabled: true,
    title: 'Blog',
    showInNav: true,
    postsPerPage: 10,
    showAuthorBio: true,
    categories: ['Opinion', 'Column', 'Guest Post', 'Lifestyle', 'Community'],
  });
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getBlogSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching blog settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBlogSettings(settings);
      toast.success('Blog settings saved successfully');
      onSettingsUpdate?.(settings);
      onClose();
    } catch (error) {
      console.error('Error saving blog settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      setSettings({
        ...settings,
        categories: [...settings.categories, newCategory.trim()],
      });
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setSettings({
      ...settings,
      categories: settings.categories.filter((c) => c !== category),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-gray-900 dark:text-white">Blog Settings</SheetTitle>
          <SheetDescription className="text-gray-500 dark:text-gray-400">
            Configure your blog display and category settings.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {/* Blog Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">
                Blog Title
              </Label>
              <Input
                id="title"
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                placeholder="Enter blog title"
                className="bg-white dark:bg-gray-800"
              />
            </div>

            {/* Posts Per Page */}
            <div className="space-y-2">
              <Label htmlFor="postsPerPage" className="text-gray-700 dark:text-gray-300">
                Posts Per Page
              </Label>
              <Input
                id="postsPerPage"
                type="number"
                min={1}
                max={50}
                value={settings.postsPerPage}
                onChange={(e) =>
                  setSettings({ ...settings, postsPerPage: parseInt(e.target.value) || 10 })
                }
                className="bg-white dark:bg-gray-800"
              />
            </div>

            {/* Toggle Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled" className="text-gray-700 dark:text-gray-300">
                  Enable Blog
                </Label>
                <button
                  id="enabled"
                  role="switch"
                  aria-checked={settings.enabled}
                  onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enabled
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showInNav" className="text-gray-700 dark:text-gray-300">
                  Show in Navigation
                </Label>
                <button
                  id="showInNav"
                  role="switch"
                  aria-checked={settings.showInNav}
                  onClick={() => setSettings({ ...settings, showInNav: !settings.showInNav })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showInNav
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showInNav ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showAuthorBio" className="text-gray-700 dark:text-gray-300">
                  Show Author Bio on Posts
                </Label>
                <button
                  id="showAuthorBio"
                  role="switch"
                  aria-checked={settings.showAuthorBio}
                  onClick={() => setSettings({ ...settings, showAuthorBio: !settings.showAuthorBio })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showAuthorBio
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showAuthorBio ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Categories Management */}
            <div className="space-y-3">
              <Label className="text-gray-700 dark:text-gray-300">Categories</Label>
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add new category"
                  className="bg-white dark:bg-gray-800"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim()}
                >
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.categories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    {category}
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      className="p-0.5 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              {settings.categories.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No categories added yet. Add some categories above.
                </p>
              )}
            </div>
          </div>
        )}

        <SheetFooter className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default BlogConfigModal;
