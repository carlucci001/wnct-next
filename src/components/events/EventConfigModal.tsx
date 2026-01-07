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
import { EventsSettings } from '@/types/event';
import { getEventsSettings, updateEventsSettings } from '@/lib/events';
import { Settings, Save, X } from 'lucide-react';

interface EventConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function EventConfigModal({ open, onClose }: EventConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<EventsSettings>({
    enabled: true,
    title: 'Community Events',
    showInNav: true,
    defaultView: 'calendar',
    allowSubmissions: true,
    requireApproval: true,
    categories: [],
    featuredCount: 3
  });

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  async function loadSettings() {
    try {
      const data = await getEventsSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateEventsSettings(settings);
      toast.success('Event settings updated successfully');
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
            <Settings className="h-5 w-5 text-primary" />
            Events Configuration
          </DialogTitle>
          <DialogDescription>
            Configure how the community events calendar behaves.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Events Module</Label>
              <p className="text-xs text-muted-foreground">Show the events section on the site</p>
            </div>
            <Switch 
              checked={settings.enabled} 
              onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Module Title</Label>
            <Input 
              id="title" 
              value={settings.title} 
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show in Navigation</Label>
              <p className="text-xs text-muted-foreground">Add Events to the main site menu</p>
            </div>
            <Switch 
              checked={settings.showInNav} 
              onCheckedChange={(v) => setSettings({ ...settings, showInNav: v })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default View</Label>
              <Select 
                value={settings.defaultView} 
                onValueChange={(v: any) => setSettings({ ...settings, defaultView: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendar">Calendar</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Featured Count</Label>
              <Input 
                type="number" 
                value={settings.featuredCount} 
                onChange={(e) => setSettings({ ...settings, featuredCount: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow User Submissions</Label>
                <p className="text-xs text-muted-foreground">Let users suggest their own events</p>
              </div>
              <Switch 
                checked={settings.allowSubmissions} 
                onCheckedChange={(v) => setSettings({ ...settings, allowSubmissions: v })} 
              />
            </div>

            {settings.allowSubmissions && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Admin Approval</Label>
                  <p className="text-xs text-muted-foreground">Submissions must be approved before publishing</p>
                </div>
                <Switch 
                  checked={settings.requireApproval} 
                  onCheckedChange={(v) => setSettings({ ...settings, requireApproval: v })} 
                />
              </div>
            )}
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
