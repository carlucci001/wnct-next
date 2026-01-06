'use client';

import { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DirectorySettings, DEFAULT_BUSINESS_CATEGORIES } from '@/types/business';
import { getDirectorySettings, saveDirectorySettings, getDefaultDirectorySettings } from '@/lib/directory';
import { toast } from 'sonner';

interface DirectoryConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function DirectoryConfigModal({ open, onClose }: DirectoryConfigModalProps) {
  const [settings, setSettings] = useState<DirectorySettings>(getDefaultDirectorySettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  async function loadSettings() {
    setLoading(true);
    try {
      const saved = await getDirectorySettings();
      if (saved) {
        setSettings(saved);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveDirectorySettings(settings);
      toast.success('Directory settings saved');
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(category: string) {
    setSettings((prev) => ({
      ...prev,
      categoriesEnabled: prev.categoriesEnabled.includes(category)
        ? prev.categoriesEnabled.filter((c) => c !== category)
        : [...prev.categoriesEnabled, category],
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={20} />
            Directory Settings
          </DialogTitle>
          <DialogDescription>
            Configure how the business directory appears on your site.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading settings...</div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled">Enable Directory</Label>
                <p className="text-sm text-muted-foreground">Show directory on your site</p>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>

            {/* Show in Nav */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showInNav">Show in Navigation</Label>
                <p className="text-sm text-muted-foreground">Add link to main navigation</p>
              </div>
              <Switch
                id="showInNav"
                checked={settings.showInNav}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, showInNav: checked }))}
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={settings.title}
                onChange={(e) => setSettings((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Business Directory"
              />
            </div>

            {/* Featured Count */}
            <div className="space-y-2">
              <Label htmlFor="featuredCount">Featured Businesses Count</Label>
              <Input
                id="featuredCount"
                type="number"
                min={1}
                max={12}
                value={settings.featuredCount}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, featuredCount: parseInt(e.target.value) || 6 }))
                }
              />
              <p className="text-xs text-muted-foreground">Number of featured businesses to show</p>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>Enabled Categories</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
                {DEFAULT_BUSINESS_CATEGORIES.map((category) => (
                  <Badge
                    key={category}
                    variant={settings.categoriesEnabled.includes(category) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                    {settings.categoriesEnabled.includes(category) && (
                      <X size={12} className="ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Click to toggle categories</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
