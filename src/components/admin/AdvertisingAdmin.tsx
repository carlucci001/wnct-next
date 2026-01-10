'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAllCampaigns, 
  createAdCampaign, 
  updateAdCampaign, 
  deleteAdCampaign 
} from '@/lib/advertising';
import { AdCampaign, AD_POSITIONS, AdPosition, AdStatus, AdType } from '@/types/advertising';
import NextImage from 'next/image';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ExternalLink,
  Users,
  Eye,
  MousePointer2,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const MediaPickerModal = dynamic(() => import('./MediaPickerModal'), { ssr: false });

import { DataTable, ColumnDef, BatchAction } from '@/components/ui/data-table';

export default function AdvertisingAdmin() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Partial<AdCampaign> | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch (error) {
      toast.error('Failed to load ad campaigns');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!editingAd?.title || !editingAd?.clientId || !editingAd?.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingAd.id) {
        await updateAdCampaign(editingAd.id, editingAd);
        toast.success('Campaign updated');
      } else {
        await createAdCampaign(editingAd as AdCampaign);
        toast.success('Campaign created');
      }
      setIsModalOpen(false);
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to save campaign');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteAdCampaign(id);
        toast.success('Campaign deleted');
        loadCampaigns();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const columns: ColumnDef<AdCampaign>[] = [
    {
      header: 'Campaign / Client',
      accessorKey: 'title',
      sortable: true,
      cell: (ad) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
            {ad.imageUrl ? (
              <NextImage 
                src={ad.imageUrl} 
                alt={ad.title}
                width={48}
                height={48}
                className="w-full h-full object-cover" 
              />
            ) : (
              <Layers size={20} className="text-muted-foreground/30" />
            )}
          </div>
          <div>
            <p className="font-serif font-black leading-none mb-1">{ad.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users size={12} /> {ad.clientName}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Position',
      accessorKey: 'position',
      sortable: true,
      cell: (ad) => (
        <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/5 border-primary/10 text-primary">
          {ad.position.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (ad) => (
        <div className="flex items-center gap-2">
          {ad.status === 'active' && <CheckCircle2 className="text-emerald-500" size={14} />}
          {ad.status === 'paused' && <Clock className="text-amber-500" size={14} />}
          {ad.status === 'expired' && <AlertCircle className="text-red-500" size={14} />}
          <span className="text-xs font-bold capitalize">{ad.status}</span>
        </div>
      ),
    },
    {
      header: 'Stats',
      accessorKey: 'impressions',
      sortable: true,
      className: 'text-center',
      cell: (ad) => (
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-[9px] font-black uppercase text-muted-foreground">{ad.impressions.toLocaleString()}</p>
            <p className="text-[9px] font-black uppercase opacity-40">Views</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase text-primary">{ad.clicks.toLocaleString()}</p>
            <p className="text-[9px] font-black uppercase opacity-40">Clicks</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (ad) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
            <DropdownMenuItem onClick={() => { setEditingAd(ad); setIsModalOpen(true); }} className="gap-2">
              <Edit size={14} /> Edit Campaign
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(ad.targetUrl, '_blank')} className="gap-2">
              <ExternalLink size={14} /> View Target
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(ad.id)} className="gap-2 text-red-600 focus:text-red-600">
              <Trash2 size={14} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const batchActions: BatchAction<AdCampaign>[] = [
    {
      label: 'Activate Selected',
      value: 'activate',
      icon: <CheckCircle2 size={14} className="text-emerald-500" />,
      onClick: async (items) => {
        try {
          await Promise.all(items.map(item => updateAdCampaign(item.id, { status: 'active' })));
          toast.success(`Activated ${items.length} campaigns`);
          loadCampaigns();
        } catch (error) {
          toast.error('Failed to activate campaigns');
        }
      }
    },
    {
      label: 'Pause Selected',
      value: 'pause',
      icon: <Clock size={14} className="text-amber-500" />,
      onClick: async (items) => {
        try {
          await Promise.all(items.map(item => updateAdCampaign(item.id, { status: 'paused' })));
          toast.success(`Paused ${items.length} campaigns`);
          loadCampaigns();
        } catch (error) {
          toast.error('Failed to pause campaigns');
        }
      }
    },
    {
      label: 'Delete Selected',
      value: 'delete',
      variant: 'destructive',
      icon: <Trash2 size={14} />,
      onClick: async (items) => {
        if (confirm(`Are you sure you want to delete ${items.length} campaigns?`)) {
          try {
            await Promise.all(items.map(item => deleteAdCampaign(item.id)));
            toast.success(`Deleted ${items.length} campaigns`);
            loadCampaigns();
          } catch (error) {
            toast.error('Failed to delete campaigns');
          }
        }
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-black tracking-tight">Ad Management</h2>
          <p className="text-muted-foreground">Monitor performance and manage ad inventory across positions.</p>
        </div>
        <Button onClick={() => { setEditingAd({ type: 'image', status: 'active', position: 'header_main', impressions: 0, clicks: 0 }); setIsModalOpen(true); }} className="rounded-full px-6 font-bold uppercase text-[10px] tracking-widest shadow-lg">
          <Plus className="mr-2" size={16} /> New Campaign
        </Button>
      </div>

      <DataTable 
        data={campaigns}
        columns={columns}
        searchKey="title"
        searchPlaceholder="Search campaigns or clients..."
        batchActions={batchActions}
        isLoading={loading}
      />

      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-2xl font-serif font-black tracking-tight italic">
              {editingAd?.id ? 'Edit Campaign' : 'New Campaign'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Campaign Title*</Label>
              <Input 
                value={editingAd?.title || ''} 
                onChange={e => setEditingAd(prev => ({ ...prev, title: e.target.value }))}
                className="rounded-xl h-12 bg-muted/30 border-none shadow-inner"
                placeholder="Summer Sale 2024..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Client Name*</Label>
              <Input 
                value={editingAd?.clientName || ''} 
                onChange={e => setEditingAd(prev => ({ ...prev, clientName: e.target.value }))}
                className="rounded-xl h-11 bg-muted/30 border-none shadow-inner"
                placeholder="Acme Corp"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Client ID (User UID)*</Label>
              <Input 
                value={editingAd?.clientId || ''} 
                onChange={e => setEditingAd(prev => ({ ...prev, clientId: e.target.value }))}
                className="rounded-xl h-11 bg-muted/30 border-none shadow-inner"
                placeholder="Auth UID"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Position*</Label>
              <Select 
                value={editingAd?.position} 
                onValueChange={v => setEditingAd(prev => ({ ...prev, position: v as AdPosition }))}
              >
                <SelectTrigger className="rounded-xl h-11 bg-muted/30 border-none shadow-inner">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  {AD_POSITIONS.map(pos => (
                    <SelectItem key={pos.value} value={pos.value}>{pos.label} ({pos.dimensions})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Status</Label>
              <Select 
                value={editingAd?.status} 
                onValueChange={v => setEditingAd(prev => ({ ...prev, status: v as AdStatus }))}
              >
                <SelectTrigger className="rounded-xl h-11 bg-muted/30 border-none shadow-inner">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending_payment">Pending Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] uppercase font-black tracking-widest text-primary">Campaign Media</Label>
                <Button variant="outline" size="sm" onClick={() => setIsMediaPickerOpen(true)} className="rounded-full h-8 px-4 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                   Pick Image
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Target URL*</Label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input 
                    value={editingAd?.targetUrl || ''} 
                    onChange={e => setEditingAd(prev => ({ ...prev, targetUrl: e.target.value }))}
                    className="pl-9 rounded-xl h-11 bg-muted/30 border-none shadow-inner"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Direct Image URL (or use picker)</Label>
                <Input 
                  value={editingAd?.imageUrl || ''} 
                  onChange={e => setEditingAd(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="rounded-xl h-11 bg-muted/30 border-none shadow-inner"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/30 border-t border-border/50">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleSave} className="rounded-full px-10 font-black uppercase text-[10px] tracking-widest shadow-lg">
              Save Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPickerModal
        open={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(media) => {
          const url = Array.isArray(media) ? media[0]?.url : media.url;
          if (url) {
            setEditingAd(prev => ({ ...prev, imageUrl: url }));
            setIsMediaPickerOpen(false);
            toast.success('Media attached to campaign');
          }
        }}
        defaultFolder="advertising"
      />
    </div>
  );
}
