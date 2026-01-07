'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdCampaign } from '@/types/advertising';
import { getClientCampaigns } from '@/lib/advertising';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  MousePointer2, 
  Eye, 
  Megaphone,
  PlusCircle,
  AlertCircle,
  Calendar,
  Layers,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { AD_POSITIONS, AdPosition } from '@/types/advertising';
import { createAdCampaign } from '@/lib/advertising';
import { toast } from 'sonner';
import NextImage from 'next/image';

export default function AdvertiserDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newCampaign, setNewCampaign] = useState<Partial<AdCampaign>>({
    title: '',
    targetUrl: '',
    position: 'header_main',
    type: 'image',
    imageUrl: '',
  });

  const loadData = React.useCallback(async () => {
    if (currentUser) {
      setLoading(true);
      try {
        const data = await getClientCampaigns(currentUser.uid);
        setCampaigns(data);
      } catch (error) {
        console.error('Error loading advertiser campaigns:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!currentUser) return;
    if (!newCampaign.title || !newCampaign.targetUrl || !newCampaign.imageUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await createAdCampaign({
        title: newCampaign.title!,
        clientName: userProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Local Advertiser',
        clientEmail: currentUser.email || '',
        clientId: currentUser.uid,
        position: (newCampaign.position as AdPosition) || 'header_main',
        type: 'image',
        imageUrl: newCampaign.imageUrl!,
        targetUrl: newCampaign.targetUrl!,
        status: 'pending_payment',
        startDate: new Date(),
      });
      
      toast.success('Campaign submitted! Awaiting review and payment.');
      setIsModalOpen(false);
      setNewCampaign({
        title: '',
        targetUrl: '',
        position: 'header_main',
        type: 'image',
        imageUrl: '',
      });
      loadData();
    } catch (err) {
      console.error('Failed to create campaign:', err);
      toast.error('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const totalImpressions = campaigns.reduce((acc, ad) => acc + (ad.impressions || 0), 0);
  const totalClicks = campaigns.reduce((acc, ad) => acc + (ad.clicks || 0), 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="h-10 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-black tracking-tight mb-2 flex items-center gap-3">
            <Megaphone className="text-primary" size={32} />
            My Advertising Journey
          </h1>
          <p className="text-muted-foreground font-medium">Manage and track your community reach in real-time.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-full px-8 h-12 font-black uppercase text-[10px] tracking-widest shadow-lg bg-primary hover:scale-105 transition-transform"
        >
          <PlusCircle className="mr-2" size={16} /> New Campaign
        </Button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-linear-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center gap-3 opacity-80 mb-4">
              <Eye size={18} />
              <span className="text-[10px] uppercase font-black tracking-widest">Total Reach</span>
            </div>
            <p className="text-5xl font-black font-serif italic">{totalImpressions.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-linear-to-br from-amber-500 to-amber-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center gap-3 opacity-80 mb-4">
              <MousePointer2 size={18} />
              <span className="text-[10px] uppercase font-black tracking-widest">Client Clicks</span>
            </div>
            <p className="text-5xl font-black font-serif italic">{totalClicks.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-linear-to-br from-emerald-600 to-emerald-700 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center gap-3 opacity-80 mb-4">
              <TrendingUp size={18} />
              <span className="text-[10px] uppercase font-black tracking-widest">Avg. Engagement</span>
            </div>
            <p className="text-5xl font-black font-serif italic">{avgCTR.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif font-black flex items-center gap-2">
            <BarChart3 className="text-primary" size={20} />
            Live Campaigns
          </h3>
          {campaigns.length > 0 && (
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground" onClick={() => setIsModalOpen(true)}>
              <Plus size={14} className="mr-1" /> Add Another
            </Button>
          )}
        </div>

        {campaigns.length === 0 ? (
          <Card className="rounded-[3rem] border-dashed border-2 bg-muted/20 py-24 text-center">
            <Megaphone size={64} className="mx-auto text-muted-foreground/10 mb-6" />
            <h4 className="font-serif font-black text-2xl mb-3">Your Journey Starts Here</h4>
            <p className="text-muted-foreground mb-10 max-w-sm mx-auto font-medium">
              You haven&apos;t launched any campaigns yet. Join 50+ local businesses reaching the heart of WNC today.
            </p>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="rounded-full font-black uppercase text-[11px] tracking-widest h-14 px-12 shadow-xl shadow-primary/20"
            >
              Launch Your First Ad
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {campaigns.map((ad) => (
              <Card key={ad.id} className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden group hover:shadow-2xl transition-all bg-white dark:bg-slate-900">
                <div className="flex flex-col sm:flex-row h-full">
                  {/* Ad Preview */}
                  <div className="sm:w-56 bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center p-6 border-r border-border/10">
                    {ad.imageUrl ? (
                      <div className="relative group/img w-full pt-[56.25%] overflow-hidden rounded-xl shadow-lg border border-border/20">
                        <NextImage 
                          src={ad.imageUrl} 
                          alt={ad.title} 
                          fill
                          className="object-cover group-hover/img:scale-110 transition-transform duration-500" 
                        />
                      </div>
                    ) : (
                      <Layers size={40} className="text-muted-foreground/20" />
                    )}
                  </div>

                  <div className="flex-1 p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-serif font-black text-xl line-clamp-1 group-hover:text-primary transition-colors">{ad.title}</h4>
                        <Badge variant={ad.status === 'active' ? 'default' : 'secondary'} className={`rounded-full text-[9px] font-black uppercase tracking-widest px-3 ${
                          ad.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                          ad.status === 'pending_payment' ? 'bg-amber-500 text-white' : ''
                        }`}>
                          {ad.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-8">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
                          <AlertCircle size={12} className="text-primary" />
                          {ad.position.replace('_', ' ')}
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
                          <Calendar size={12} />
                          Active Now
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 opacity-60">Reach</p>
                        <p className="font-black text-2xl font-serif leading-none italic">{ad.impressions.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 opacity-60">Clicks</p>
                        <p className="font-black text-2xl font-serif leading-none italic text-primary">{ad.clicks.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 opacity-60">EGN Rate</p>
                        <p className="font-black text-2xl font-serif leading-none italic text-emerald-500">
                          {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-10 bg-slate-950 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
            <DialogTitle className="text-3xl font-serif font-black tracking-tight italic relative z-10 flex items-center gap-3">
              <PlusCircle size={28} className="text-primary" />
              Launch New Campaign
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium relative z-10 mt-2">
              Fill in your details and upload your creative to start reaching our local audience.
            </DialogDescription>
          </DialogHeader>

          <div className="p-10 space-y-8 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 col-span-2">
                <Label className="text-[10px] uppercase font-black tracking-widest opacity-40">Campaign Name*</Label>
                <Input 
                  value={newCampaign.title || ''} 
                  onChange={e => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                  className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 text-lg font-bold placeholder:font-normal"
                  placeholder="e.g. Summer Weekend Special"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest opacity-40">Ad Placement*</Label>
                <Select 
                  value={newCampaign.position} 
                  onValueChange={v => setNewCampaign(prev => ({ ...prev, position: v as AdPosition }))}
                >
                  <SelectTrigger className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold">
                    <SelectValue placeholder="Where to show?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl border-none p-2">
                    {AD_POSITIONS.map(pos => (
                      <SelectItem key={pos.value} value={pos.value} className="rounded-xl py-3 font-bold">
                        {pos.label} <span className="text-[10px] opacity-40 ml-2">({pos.dimensions})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest opacity-40">Target Link*</Label>
                <div className="relative">
                  <ExternalLink className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    value={newCampaign.targetUrl || ''} 
                    onChange={e => setNewCampaign(prev => ({ ...prev, targetUrl: e.target.value }))}
                    className="pl-14 rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label className="text-[10px] uppercase font-black tracking-widest opacity-40">Banner Image URL*</Label>
                <Input 
                  value={newCampaign.imageUrl || ''} 
                  onChange={e => setNewCampaign(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold"
                  placeholder="Paste URL (Unsplash or hosted image)"
                />
                <p className="text-[10px] font-medium text-muted-foreground mt-2 pl-2">
                  Tip: Use high-quality 21:9 or 16:9 images for best results.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800">
              <div className="flex gap-4">
                <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0" size={24} />
                <div className="space-y-1">
                  <p className="text-sm font-black text-blue-900 dark:text-blue-100">Editorial Review</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                    All custom ads are reviewed for quality and link safety before going live. Approval typically takes less than 12 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-10 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4 border-t border-border/10">
            <Button 
              variant="ghost" 
              onClick={() => setIsModalOpen(false)} 
              className="rounded-full h-14 px-8 font-bold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={saving}
              className="rounded-full h-14 px-12 font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 flex-1 sm:flex-none"
            >
              {saving ? 'Processing...' : 'Submit Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
