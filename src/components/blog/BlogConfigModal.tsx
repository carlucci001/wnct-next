'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { BlogSettings } from '@/types/blogPost';
import { getBlogSettings, updateBlogSettings } from '@/lib/blog';
import { Settings, Save, X, BookOpen } from 'lucide-react';

interface BlogConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function BlogConfigModal({ open, onClose }: BlogConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<BlogSettings>({
    enabled: true,
    title: 'Community Blog',
    showInNav: true,
    postsPerPage: 10,
    showAuthorBio: true,
    categories: []
  });

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  async function loadSettings() {
    try {
      const data = await getBlogSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading blog settings:', error);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateBlogSettings(settings);
      toast.success('Blog settings updated successfully');
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Blog Configuration
          </DialogTitle>
          <DialogDescription>
            Manage basic settings for the community blog section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Blog</Label>
              <p className="text-xs text-muted-foreground">Show blog section to the public</p>
            </div>
            <Switch 
              checked={settings.enabled} 
              onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-title">Public Title</Label>
            <Input 
              id="blog-title" 
              value={settings.title} 
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show in Navigation</Label>
              <p className="text-xs text-muted-foreground">Add to primary site menu</p>
            </div>
            <Switch 
              checked={settings.showInNav} 
              onCheckedChange={(v) => setSettings({ ...settings, showInNav: v })} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Author Bio</Label>
              <p className="text-xs text-muted-foreground">Display author profiles on posts</p>
            </div>
            <Switch 
              checked={settings.showAuthorBio} 
              onCheckedChange={(v) => setSettings({ ...settings, showAuthorBio: v })} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="posts-per-page">Posts Per Page</Label>
            <Input 
              id="posts-per-page"
              type="number" 
              value={settings.postsPerPage} 
              onChange={(e) => setSettings({ ...settings, postsPerPage: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X size={16} className="mr-2" /> Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save size={16} className="mr-2" /> {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
