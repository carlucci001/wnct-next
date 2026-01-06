'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Trash2, Edit, Search,
  MoreHorizontal, ExternalLink, ChevronLeft, ChevronRight, Eye, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Advertisement, AdStatus, AD_SIZES, AD_PLACEMENTS } from '@/types/advertisement';
import { getAds, createAd, updateAd, deleteAd } from '@/lib/advertising';
import { Timestamp } from 'firebase/firestore';

export default function AdvertisingAdmin() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdStatus>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'banner' as Advertisement['type'],
    placement: 'header',
    size: '728x90',
    imageUrl: '',
    linkUrl: '',
    altText: '',
    campaignName: '',
    startDate: '',
    endDate: '',
    priority: 1,
    status: 'draft' as AdStatus,
  });

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    setLoading(true);
    try {
      const data = await getAds();
      setAds(data);
    } catch (error) {
      console.error('Error loading ads:', error);
      toast.error('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  }

  // Filtering
  const filteredAds = ads.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.campaignName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAds.length / pageSize);
  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Selection
  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginatedAds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedAds.map((a) => a.id)));
    }
  }

  // Reset form
  function resetForm() {
    setFormData({
      name: '',
      type: 'banner',
      placement: 'header',
      size: '728x90',
      imageUrl: '',
      linkUrl: '',
      altText: '',
      campaignName: '',
      startDate: '',
      endDate: '',
      priority: 1,
      status: 'draft',
    });
  }

  // Add ad
  async function handleAdd() {
    if (!formData.name || !formData.imageUrl || !formData.linkUrl) {
      toast.error('Name, image URL, and link URL are required');
      return;
    }

    try {
      await createAd({
        name: formData.name,
        type: formData.type,
        placement: formData.placement,
        size: formData.size,
        imageUrl: formData.imageUrl,
        linkUrl: formData.linkUrl,
        altText: formData.altText || formData.name,
        campaignName: formData.campaignName,
        startDate: formData.startDate ? Timestamp.fromDate(new Date(formData.startDate)) : Timestamp.now(),
        endDate: formData.endDate ? Timestamp.fromDate(new Date(formData.endDate)) : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        priority: formData.priority,
        status: formData.status,
      });
      toast.success('Advertisement created successfully');
      setShowAddModal(false);
      resetForm();
      loadAds();
    } catch (error) {
      console.error('Error adding ad:', error);
      toast.error('Failed to create advertisement');
    }
  }

  // Edit ad
  function openEditModal(ad: Advertisement) {
    setEditingAd(ad);
    const startDate = ad.startDate instanceof Timestamp ? ad.startDate.toDate() : new Date(ad.startDate);
    const endDate = ad.endDate instanceof Timestamp ? ad.endDate.toDate() : new Date(ad.endDate);

    setFormData({
      name: ad.name,
      type: ad.type,
      placement: ad.placement,
      size: ad.size,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      altText: ad.altText,
      campaignName: ad.campaignName || '',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      priority: ad.priority,
      status: ad.status,
    });
    setShowEditModal(true);
  }

  async function handleEdit() {
    if (!editingAd) return;

    try {
      await updateAd(editingAd.id, {
        name: formData.name,
        type: formData.type,
        placement: formData.placement,
        size: formData.size,
        imageUrl: formData.imageUrl,
        linkUrl: formData.linkUrl,
        altText: formData.altText,
        campaignName: formData.campaignName,
        startDate: formData.startDate ? Timestamp.fromDate(new Date(formData.startDate)) : undefined,
        endDate: formData.endDate ? Timestamp.fromDate(new Date(formData.endDate)) : undefined,
        priority: formData.priority,
        status: formData.status,
      });
      toast.success('Advertisement updated successfully');
      setShowEditModal(false);
      setEditingAd(null);
      resetForm();
      loadAds();
    } catch (error) {
      console.error('Error updating ad:', error);
      toast.error('Failed to update advertisement');
    }
  }

  // Delete
  function openDeleteModal(ids: string[]) {
    setDeletingIds(ids);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    try {
      for (const id of deletingIds) {
        await deleteAd(id);
      }
      toast.success(`Deleted ${deletingIds.length} ad(s)`);
      setShowDeleteModal(false);
      setDeletingIds([]);
      setSelectedIds(new Set());
      loadAds();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  }

  const statusBadge = (status: AdStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Paused</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Draft</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Expired</Badge>;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate stats
  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
  const activeAds = ads.filter(a => a.status === 'active').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-green-600" />
              Advertising
            </CardTitle>
            <CardDescription>Manage ad campaigns and placements</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Ad
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold">{activeAds}</p>
            <p className="text-sm text-muted-foreground">Active Ads</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Impressions</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Clicks</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-muted p-3 rounded-lg mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => openDeleteModal(Array.from(selectedIds))}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : filteredAds.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No advertisements found</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === paginatedAds.length && paginatedAds.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Ad</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(ad.id)}
                          onChange={() => toggleSelect(ad.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ad.name}</div>
                          {ad.campaignName && (
                            <div className="text-sm text-muted-foreground">{ad.campaignName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ad.placement}</Badge>
                        <div className="text-xs text-muted-foreground mt-1">{ad.size}</div>
                      </TableCell>
                      <TableCell>{statusBadge(ad.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {(ad.impressions || 0).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <BarChart3 className="h-3 w-3" /> {(ad.clicks || 0).toLocaleString()} clicks
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(ad)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            {ad.linkUrl && (
                              <DropdownMenuItem onClick={() => window.open(ad.linkUrl, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2" /> Preview Link
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDeleteModal([ad.id])}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredAds.length)} of {filteredAds.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">Page {currentPage} of {totalPages || 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowAddModal(false);
          setShowEditModal(false);
          setEditingAd(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditModal ? 'Edit Advertisement' : 'New Advertisement'}</DialogTitle>
            <DialogDescription>
              {showEditModal ? 'Update ad details' : 'Create a new advertisement'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Ad Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter ad name"
                />
              </div>
              <div>
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  placeholder="Optional campaign name"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Advertisement['type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="sponsored">Sponsored</SelectItem>
                    <SelectItem value="native">Native</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="placement">Placement</Label>
                <Select value={formData.placement} onValueChange={(v) => setFormData({ ...formData, placement: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="sidebar-top">Sidebar Top</SelectItem>
                    <SelectItem value="sidebar-middle">Sidebar Middle</SelectItem>
                    <SelectItem value="sidebar-bottom">Sidebar Bottom</SelectItem>
                    <SelectItem value="article-inline">Article Inline</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="size">Size</Label>
                <Select value={formData.size} onValueChange={(v) => setFormData({ ...formData, size: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AD_SIZES).map(([key, value]) => (
                      <SelectItem key={key} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL *</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="linkUrl">Link URL *</Label>
              <Input
                id="linkUrl"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="altText">Alt Text</Label>
              <Input
                id="altText"
                value={formData.altText}
                onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                placeholder="Descriptive text for the ad"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as AdStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={showEditModal ? handleEdit : handleAdd}>
              {showEditModal ? 'Save Changes' : 'Create Ad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ad{deletingIds.length > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingIds.length} ad{deletingIds.length > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
