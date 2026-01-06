"use client";

import { useState, useEffect } from 'react';
import { Settings, Plus, X, Loader2, Save } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { CommunitySettings, getCommunitySettings, updateCommunitySettings } from '@/lib/communityPosts';

interface CommunityConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const DEFAULT_TOPICS = ['general', 'alert', 'crime', 'event', 'question'];

export function CommunityConfigModal({ open, onClose, onSave }: CommunityConfigModalProps) {
  const [settings, setSettings] = useState<CommunitySettings>({
    enabled: true,
    title: 'Community Feed',
    showInNav: true,
    requireApproval: false,
    topics: DEFAULT_TOPICS,
  });
  const [newTopic, setNewTopic] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings when modal opens
  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSettings = await getCommunitySettings();
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateCommunitySettings(settings);
      onSave?.();
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTopic = () => {
    const topicToAdd = newTopic.trim().toLowerCase();
    if (topicToAdd && !settings.topics.includes(topicToAdd)) {
      setSettings((prev) => ({
        ...prev,
        topics: [...prev.topics, topicToAdd],
      }));
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setSettings((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t !== topicToRemove),
    }));
  };

  const handleToggle = (field: 'showInNav' | 'requireApproval' | 'enabled') => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings size={20} />
            Community Settings
          </SheetTitle>
          <SheetDescription className="text-gray-500 dark:text-gray-400">
            Configure your community feed settings and moderation options.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Page Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Page Title
              </Label>
              <Input
                id="title"
                value={settings.title}
                onChange={(e) => setSettings((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Community Feed"
                className="bg-white dark:bg-gray-800"
              />
            </div>

            {/* Toggle: Show in Navigation */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show in Navigation
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Display Community link in the main navigation menu
                </p>
              </div>
              <ToggleSwitch
                checked={settings.showInNav}
                onChange={() => handleToggle('showInNav')}
              />
            </div>

            {/* Toggle: Require Post Approval */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Require Post Approval
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  New posts must be approved before appearing
                </p>
              </div>
              <ToggleSwitch
                checked={settings.requireApproval}
                onChange={() => handleToggle('requireApproval')}
              />
            </div>

            {/* Topics/Categories Management */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Topics / Categories
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manage available post topics for your community
              </p>

              {/* Current Topics */}
              <div className="flex flex-wrap gap-2">
                {settings.topics.map((topic) => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="flex items-center gap-1.5 pr-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <span className="capitalize">{topic}</span>
                    <button
                      onClick={() => handleRemoveTopic(topic)}
                      className="ml-1 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Add New Topic */}
              <div className="flex gap-2">
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Add new topic..."
                  className="flex-1 bg-white dark:bg-gray-800"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddTopic}
                  disabled={!newTopic.trim()}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Reset to Defaults */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    topics: DEFAULT_TOPICS,
                  }))
                }
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Reset topics to defaults
              </Button>
            </div>
          </div>
        )}

        <SheetFooter className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Toggle Switch Component
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
      `}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}
