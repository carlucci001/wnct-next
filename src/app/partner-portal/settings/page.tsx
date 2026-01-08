'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTenantById, updateTenantSettings } from '@/lib/tenants';
import { Tenant, TenantSettings } from '@/types/tenant';
import { Settings, Palette, Globe, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function PartnerPortalSettings() {
  const { userProfile } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TenantSettings>({
    siteName: '',
    tagline: '',
    primaryColor: '#3b82f6',
  });

  useEffect(() => {
    const loadTenant = async () => {
      if (!userProfile?.tenantId) return;
      try {
        const data = await getTenantById(userProfile.tenantId);
        if (data) {
          setTenant(data);
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Error loading tenant:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTenant();
  }, [userProfile?.tenantId]);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    try {
      await updateTenantSettings(tenant.id, settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Site Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Customize your publication&apos;s branding and appearance.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Branding
            </CardTitle>
            <CardDescription>
              Set your publication&apos;s name and tagline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Publication Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                placeholder="My Local News"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Textarea
                id="tagline"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                placeholder="Your trusted source for local news"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-3">
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Domain */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Custom Domain
            </CardTitle>
            <CardDescription>
              Connect your own domain name (coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customDomain">Domain</Label>
              <Input
                id="customDomain"
                value={settings.customDomain || ''}
                onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
                placeholder="news.yourdomain.com"
                disabled
              />
              <p className="text-xs text-slate-500">
                Custom domain support is coming soon. Contact support for early access.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
