'use client';

import { useState, useEffect } from 'react';
import { SiteConfig, DEFAULT_SITE_CONFIG, DEFAULT_PRIVACY_POLICY, DEFAULT_TERMS_OF_USE } from '@/types/siteConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Palette,
  FileText,
  Shield,
  Clock,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Sparkles,
} from 'lucide-react';

export default function SiteConfigManager() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/site-config');
      const data = await response.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to load site config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    try {
      setSaving(true);
      setSaveStatus('idle');
      const response = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: config }),
      });
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
        setSaveStatus('success');
        setHasChanges(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save site config:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  async function resetConfig() {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to reset site config:', error);
    } finally {
      setSaving(false);
      setShowResetDialog(false);
    }
  }

  function updateConfig<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }

  function updateNestedConfig<K extends keyof SiteConfig>(
    key: K,
    nestedKey: string,
    value: unknown
  ) {
    setConfig(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] as Record<string, unknown>),
        [nestedKey]: value,
      },
    }));
    setHasChanges(true);
  }

  function updateDeepNestedConfig<K extends keyof SiteConfig>(
    key: K,
    nestedKey: string,
    deepKey: string,
    value: unknown
  ) {
    setConfig(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] as Record<string, unknown>),
        [nestedKey]: {
          ...((prev[key] as Record<string, unknown>)[nestedKey] as Record<string, unknown>),
          [deepKey]: value,
        },
      },
    }));
    setHasChanges(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Site Configuration</h2>
          <p className="text-muted-foreground">
            Configure your newspaper settings, contact information, and legal pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Unsaved Changes
            </Badge>
          )}
          {saveStatus === 'success' && (
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" /> Saved
            </Badge>
          )}
          {saveStatus === 'error' && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" /> Error Saving
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
          <Button onClick={saveConfig} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-1">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Legal</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Hours</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Site Information
              </CardTitle>
              <CardDescription>
                Basic information about your newspaper that appears across the site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name *</Label>
                  <Input
                    id="siteName"
                    value={config.siteName}
                    onChange={(e) => updateConfig('siteName', e.target.value)}
                    placeholder="Your Newspaper Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteTagline">Tagline</Label>
                  <Input
                    id="siteTagline"
                    value={config.siteTagline}
                    onChange={(e) => updateConfig('siteTagline', e.target.value)}
                    placeholder="Your Community, Your News"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={config.siteDescription}
                  onChange={(e) => updateConfig('siteDescription', e.target.value)}
                  placeholder="Brief description of your newspaper..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Business Information
              </CardTitle>
              <CardDescription>
                Legal business details (not publicly displayed)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Business Name *</Label>
                  <Input
                    id="legalName"
                    value={config.business.legalName}
                    onChange={(e) => updateNestedConfig('business', 'legalName', e.target.value)}
                    placeholder="Your Newspaper LLC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dba">DBA (Doing Business As)</Label>
                  <Input
                    id="dba"
                    value={config.business.dba || ''}
                    onChange={(e) => updateNestedConfig('business', 'dba', e.target.value)}
                    placeholder="Optional alternate name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearFounded">Year Founded</Label>
                  <Input
                    id="yearFounded"
                    value={config.business.yearFounded || ''}
                    onChange={(e) => updateNestedConfig('business', 'yearFounded', e.target.value)}
                    placeholder="2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID (Internal)</Label>
                  <Input
                    id="taxId"
                    value={config.business.taxId || ''}
                    onChange={(e) => updateNestedConfig('business', 'taxId', e.target.value)}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> SEO Settings
              </CardTitle>
              <CardDescription>
                Search engine optimization and analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Default Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={config.seo?.metaTitle || ''}
                  onChange={(e) => updateNestedConfig('seo', 'metaTitle', e.target.value)}
                  placeholder="Your Newspaper - Local News & Community Stories"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Default Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={config.seo?.metaDescription || ''}
                  onChange={(e) => updateNestedConfig('seo', 'metaDescription', e.target.value)}
                  placeholder="Stay informed with local news..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gaId">Google Analytics ID</Label>
                  <Input
                    id="gaId"
                    value={config.seo?.googleAnalyticsId || ''}
                    onChange={(e) => updateNestedConfig('seo', 'googleAnalyticsId', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gtmId">Google Tag Manager ID</Label>
                  <Input
                    id="gtmId"
                    value={config.seo?.googleTagManagerId || ''}
                    onChange={(e) => updateNestedConfig('seo', 'googleTagManagerId', e.target.value)}
                    placeholder="GTM-XXXXXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> Contact Information
              </CardTitle>
              <CardDescription>
                How readers and advertisers can reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-1" /> Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={config.contact.email}
                    onChange={(e) => updateNestedConfig('contact', 'email', e.target.value)}
                    placeholder="editor@yournewspaper.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-1" /> Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={config.contact.phone}
                    onChange={(e) => updateNestedConfig('contact', 'phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fax">Fax Number</Label>
                <Input
                  id="fax"
                  value={config.contact.fax || ''}
                  onChange={(e) => updateNestedConfig('contact', 'fax', e.target.value)}
                  placeholder="(555) 123-4568"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Mailing Address
              </CardTitle>
              <CardDescription>
                Physical address for your newspaper
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={config.contact.address.street}
                  onChange={(e) => updateDeepNestedConfig('contact', 'address', 'street', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={config.contact.address.city}
                    onChange={(e) => updateDeepNestedConfig('contact', 'address', 'city', e.target.value)}
                    placeholder="Your City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={config.contact.address.state}
                    onChange={(e) => updateDeepNestedConfig('contact', 'address', 'state', e.target.value)}
                    placeholder="NC"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={config.contact.address.zip}
                    onChange={(e) => updateDeepNestedConfig('contact', 'address', 'zip', e.target.value)}
                    placeholder="28801"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={config.contact.address.country}
                    onChange={(e) => updateDeepNestedConfig('contact', 'address', 'country', e.target.value)}
                    placeholder="USA"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Newsletter Settings</CardTitle>
              <CardDescription>
                Configure newsletter subscription options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newsletterEnabled">Enable Newsletter Signup</Label>
                  <p className="text-sm text-muted-foreground">
                    Show newsletter subscription form on the website
                  </p>
                </div>
                <Switch
                  id="newsletterEnabled"
                  checked={config.newsletter.enabled}
                  onCheckedChange={(checked) => updateNestedConfig('newsletter', 'enabled', checked)}
                />
              </div>
              {config.newsletter.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="newsletterProvider">Provider</Label>
                    <Input
                      id="newsletterProvider"
                      value={config.newsletter.provider || ''}
                      onChange={(e) => updateNestedConfig('newsletter', 'provider', e.target.value)}
                      placeholder="mailchimp, convertkit, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newsletterListId">List/Audience ID</Label>
                    <Input
                      id="newsletterListId"
                      value={config.newsletter.listId || ''}
                      onChange={(e) => updateNestedConfig('newsletter', 'listId', e.target.value)}
                      placeholder="abc123"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Social Media Links
              </CardTitle>
              <CardDescription>
                Connect your social media accounts (leave blank to hide)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" /> Facebook
                  </Label>
                  <Input
                    id="facebook"
                    value={config.social?.facebook || ''}
                    onChange={(e) => updateNestedConfig('social', 'facebook', e.target.value)}
                    placeholder="https://facebook.com/yournewspaper"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-sky-500" /> Twitter/X
                  </Label>
                  <Input
                    id="twitter"
                    value={config.social?.twitter || ''}
                    onChange={(e) => updateNestedConfig('social', 'twitter', e.target.value)}
                    placeholder="https://twitter.com/yournewspaper"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" /> Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={config.social?.instagram || ''}
                    onChange={(e) => updateNestedConfig('social', 'instagram', e.target.value)}
                    placeholder="https://instagram.com/yournewspaper"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-700" /> LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    value={config.social?.linkedin || ''}
                    onChange={(e) => updateNestedConfig('social', 'linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/yournewspaper"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube" className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-600" /> YouTube
                  </Label>
                  <Input
                    id="youtube"
                    value={config.social?.youtube || ''}
                    onChange={(e) => updateNestedConfig('social', 'youtube', e.target.value)}
                    placeholder="https://youtube.com/@yournewspaper"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input
                    id="tiktok"
                    value={config.social?.tiktok || ''}
                    onChange={(e) => updateNestedConfig('social', 'tiktok', e.target.value)}
                    placeholder="https://tiktok.com/@yournewspaper"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" /> Brand Colors
              </CardTitle>
              <CardDescription>
                Customize your newspaper&apos;s color scheme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={config.branding.primaryColor}
                      onChange={(e) => updateNestedConfig('branding', 'primaryColor', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.branding.primaryColor}
                      onChange={(e) => updateNestedConfig('branding', 'primaryColor', e.target.value)}
                      placeholder="#1d4ed8"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={config.branding.secondaryColor}
                      onChange={(e) => updateNestedConfig('branding', 'secondaryColor', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.branding.secondaryColor}
                      onChange={(e) => updateNestedConfig('branding', 'secondaryColor', e.target.value)}
                      placeholder="#1e293b"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={config.branding.accentColor}
                      onChange={(e) => updateNestedConfig('branding', 'accentColor', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.branding.accentColor}
                      onChange={(e) => updateNestedConfig('branding', 'accentColor', e.target.value)}
                      placeholder="#f59e0b"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="flex gap-4">
                  <div
                    className="w-20 h-20 rounded flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: config.branding.primaryColor }}
                  >
                    Primary
                  </div>
                  <div
                    className="w-20 h-20 rounded flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: config.branding.secondaryColor }}
                  >
                    Secondary
                  </div>
                  <div
                    className="w-20 h-20 rounded flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: config.branding.accentColor }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Tab */}
        <TabsContent value="legal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Privacy Policy
              </CardTitle>
              <CardDescription>
                Your site&apos;s privacy policy. Use Markdown formatting. Variables like {'{{siteName}}'}, {'{{email}}'}, {'{{phone}}'}, {'{{address}}'} will be replaced automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateNestedConfig('legal', 'privacyPolicy', DEFAULT_PRIVACY_POLICY)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Reset to Default
                </Button>
              </div>
              <Textarea
                value={config.legal.privacyPolicy}
                onChange={(e) => updateNestedConfig('legal', 'privacyPolicy', e.target.value)}
                placeholder="Enter your privacy policy..."
                rows={20}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Terms of Use
              </CardTitle>
              <CardDescription>
                Your site&apos;s terms of use. Use Markdown formatting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateNestedConfig('legal', 'termsOfUse', DEFAULT_TERMS_OF_USE)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Reset to Default
                </Button>
              </div>
              <Textarea
                value={config.legal.termsOfUse}
                onChange={(e) => updateNestedConfig('legal', 'termsOfUse', e.target.value)}
                placeholder="Enter your terms of use..."
                rows={20}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Legal Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cookiePolicy">Cookie Policy (Optional)</Label>
                <Textarea
                  id="cookiePolicy"
                  value={config.legal.cookiePolicy || ''}
                  onChange={(e) => updateNestedConfig('legal', 'cookiePolicy', e.target.value)}
                  placeholder="Cookie policy content..."
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disclaimer">Disclaimer (Optional)</Label>
                <Textarea
                  id="disclaimer"
                  value={config.legal.disclaimer || ''}
                  onChange={(e) => updateNestedConfig('legal', 'disclaimer', e.target.value)}
                  placeholder="Site disclaimer content..."
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Business Hours
              </CardTitle>
              <CardDescription>
                Office hours displayed on contact page (leave blank if not applicable)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <div key={day} className="space-y-2">
                    <Label htmlFor={day} className="capitalize">{day}</Label>
                    <Input
                      id={day}
                      value={(config.hours as Record<string, string>)?.[day] || ''}
                      onChange={(e) => updateNestedConfig('hours', day, e.target.value)}
                      placeholder="9:00 AM - 5:00 PM or Closed"
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={config.hours?.timezone || ''}
                    onChange={(e) => updateNestedConfig('hours', 'timezone', e.target.value)}
                    placeholder="EST, PST, etc."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all site configuration to default values. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetConfig} className="bg-destructive text-destructive-foreground">
              Reset Configuration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
