"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { EventsSettings, DEFAULT_EVENTS_SETTINGS } from '@/types/event';
import { getEventsSettings, saveEventsSettings } from '@/lib/events';

interface EventConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (settings: EventsSettings) => void;
}

export function EventConfigModal({ open, onClose, onSave }: EventConfigModalProps) {
  const [settings, setSettings] = useState<EventsSettings>(DEFAULT_EVENTS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const savedSettings = await getEventsSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      } else {
        setSettings(DEFAULT_EVENTS_SETTINGS);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveEventsSettings(settings);
      onSave?.(settings);
      onClose();
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      setSettings({
        ...settings,
        categories: [...settings.categories, newCategory.trim()],
      });
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setSettings({
      ...settings,
      categories: settings.categories.filter((c) => c !== category),
    });
  };

  const updateSetting = <K extends keyof EventsSettings>(
    key: K,
    value: EventsSettings[K]
  ) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white dark:bg-gray-900">
        <SheetHeader>
          <SheetTitle className="text-gray-900 dark:text-white">
            Events Settings
          </SheetTitle>
          <SheetDescription className="text-gray-500 dark:text-gray-400">
            Configure the events component settings
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="py-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* General Settings */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  General Settings
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">
                    Page Title
                  </Label>
                  <Input
                    id="title"
                    value={settings.title}
                    onChange={(e) => updateSetting('title', e.target.value)}
                    placeholder="Community Events"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled" className="text-gray-700 dark:text-gray-300">
                    Enable Events Section
                  </Label>
                  <button
                    id="enabled"
                    role="switch"
                    aria-checked={settings.enabled}
                    onClick={() => updateSetting('enabled', !settings.enabled)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${settings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}
                      `}
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
                    onClick={() => updateSetting('showInNav', !settings.showInNav)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${settings.showInNav ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${settings.showInNav ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultView" className="text-gray-700 dark:text-gray-300">
                    Default View
                  </Label>
                  <select
                    id="defaultView"
                    value={settings.defaultView}
                    onChange={(e) =>
                      updateSetting('defaultView', e.target.value as 'calendar' | 'list')
                    }
                    className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="list">List View</option>
                    <option value="calendar">Calendar View</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featuredCount" className="text-gray-700 dark:text-gray-300">
                    Featured Events Count
                  </Label>
                  <Input
                    id="featuredCount"
                    type="number"
                    min={0}
                    max={10}
                    value={settings.featuredCount}
                    onChange={(e) =>
                      updateSetting('featuredCount', parseInt(e.target.value) || 0)
                    }
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submission Settings */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Submission Settings
                </h3>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="allowSubmissions"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Allow Event Submissions
                  </Label>
                  <button
                    id="allowSubmissions"
                    role="switch"
                    aria-checked={settings.allowSubmissions}
                    onClick={() =>
                      updateSetting('allowSubmissions', !settings.allowSubmissions)
                    }
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${settings.allowSubmissions ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${settings.allowSubmissions ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="requireApproval"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Require Approval for Submissions
                  </Label>
                  <button
                    id="requireApproval"
                    role="switch"
                    aria-checked={settings.requireApproval}
                    onClick={() =>
                      updateSetting('requireApproval', !settings.requireApproval)
                    }
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${settings.requireApproval ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${settings.requireApproval ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Category Management */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Categories
                </h3>

                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Add new category"
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                  <Button onClick={addCategory} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {settings.categories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {category}
                      <button
                        onClick={() => removeCategory(category)}
                        className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {settings.categories.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No categories added yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <SheetFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
