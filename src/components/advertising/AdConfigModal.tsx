"use client";

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { AdvertisingSettings } from '@/types/advertisement';
import { getAdvertisingSettings, updateAdvertisingSettings } from '@/lib/advertising';

interface AdConfigModalProps {
  open: boolean;
  onClose: () => void;
}

const defaultSettings: AdvertisingSettings = {
  enabled: true,
  showAdsToLoggedIn: true,
  headerBannerEnabled: true,
  sidebarAdsEnabled: true,
  inArticleAdsEnabled: true,
  adFrequency: 3,
  defaultAdImage: '',
};

export function AdConfigModal({ open, onClose }: AdConfigModalProps) {
  const [settings, setSettings] = useState<AdvertisingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await getAdvertisingSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await updateAdvertisingSettings(settings);
      toast.success('Settings saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(key: keyof AdvertisingSettings) {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advertising Settings</SheetTitle>
          <SheetDescription>
            Configure global advertising settings for the site
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="py-6 space-y-6">
            {/* Enable/Disable Advertising */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Advertising</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Show ads across the site
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.enabled}
                    onClick={() => handleToggle('enabled')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      settings.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
                        settings.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Ad Placement Toggles */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Ad Placements
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Header Banner
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Leaderboard ad at the top
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.headerBannerEnabled}
                    onClick={() => handleToggle('headerBannerEnabled')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settings.headerBannerEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        settings.headerBannerEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Sidebar Ads
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Medium rectangle ads in sidebar
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.sidebarAdsEnabled}
                    onClick={() => handleToggle('sidebarAdsEnabled')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settings.sidebarAdsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        settings.sidebarAdsEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      In-Article Ads
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ads within article content
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.inArticleAdsEnabled}
                    onClick={() => handleToggle('inArticleAdsEnabled')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settings.inArticleAdsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        settings.inArticleAdsEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* User Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                User Settings
              </h3>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Show to Logged In Users
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Display ads to authenticated users
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showAdsToLoggedIn}
                  onClick={() => handleToggle('showAdsToLoggedIn')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    settings.showAdsToLoggedIn ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.showAdsToLoggedIn ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Ad Frequency */}
            <div className="space-y-2">
              <Label htmlFor="adFrequency">In-Article Ad Frequency</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Show an ad every N paragraphs in articles
              </p>
              <Input
                id="adFrequency"
                type="number"
                min={1}
                max={10}
                value={settings.adFrequency}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    adFrequency: parseInt(e.target.value) || 3,
                  }))
                }
                className="w-24"
              />
            </div>

            {/* Default Ad Image */}
            <div className="space-y-2">
              <Label htmlFor="defaultAdImage">Default Ad Image URL</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fallback image when no ad is available
              </p>
              <Input
                id="defaultAdImage"
                type="url"
                placeholder="https://..."
                value={settings.defaultAdImage}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    defaultAdImage: e.target.value,
                  }))
                }
              />
            </div>
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
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default AdConfigModal;
