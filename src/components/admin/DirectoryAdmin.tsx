'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Plus, Trash2, Edit, Search,
  CheckCircle, XCircle, Star, ExternalLink, MoreHorizontal,
  Database
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Business, DEFAULT_BUSINESS_CATEGORIES } from '@/types/business';
import {
  getBusinesses, createBusiness, updateBusiness, deleteBusiness,
  deleteBusinesses, updateBusinessesStatus, generateSlug
} from '@/lib/directory';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/data-table';

export default function DirectoryAdmin() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    street: '',
    city: '',
    state: 'NC',
    zip: '',
    phone: '',
    email: '',
    website: '',
    featured: false,
    verified: false,
    status: 'pending' as Business['status'],
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    try {
      const data = await getBusinesses();
      setBusinesses(data);
    } catch (error) {
      console.error('Error loading businesses:', error);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/directory/seed');
      const data = await resp.json();
      if (data.success) {
        toast.success(data.message);
        loadBusinesses();
      } else {
        toast.error(data.error || 'Failed to seed data');
      }
    } catch {
      toast.error('Failed to seed data');
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Reset form
  function resetForm() {
    setFormData({
      name: '',
      description: '',
      category: '',
      street: '',
      city: '',
      state: 'NC',
      zip: '',
      phone: '',
      email: '',
      website: '',
      featured: false,
      verified: false,
      status: 'pending',
    });
  }

  // Add business
  async function handleAdd() {
    if (!formData.name || !formData.category) {
      toast.error('Name and category are required');
      return;
    }

    try {
      await createBusiness({
        name: formData.name,
        slug: generateSlug(formData.name),
        description: formData.description,
        category: formData.category,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        featured: formData.featured,
        verified: formData.verified,
        status: formData.status,
        images: [],
      });
      toast.success('Business added successfully');
      setShowAddModal(false);
      resetForm();
      loadBusinesses();
    } catch (error) {
      console.error('Error adding business:', error);
      toast.error('Failed to add business');
    }
  }

  // Edit business
  function openEditModal(business: Business) {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      description: business.description || '',
      category: business.category,
      street: business.address.street,
      city: business.address.city,
      state: business.address.state,
      zip: business.address.zip,
      phone: business.phone || '',
      email: business.email || '',
      website: business.website || '',
      featured: business.featured,
      verified: business.verified,
      status: business.status,
    });
    setShowEditModal(true);
  }

  async function handleEdit() {
    if (!editingBusiness) return;

    try {
      await updateBusiness(editingBusiness.id, {
        name: formData.name,
        slug: generateSlug(formData.name),
        description: formData.description,
        category: formData.category,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        featured: formData.featured,
        verified: formData.verified,
        status: formData.status,
      });
      toast.success('Business updated successfully');
      setShowEditModal(false);
      setEditingBusiness(null);
      resetForm();
      loadBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error('Failed to update business');
    }
  }

  // Delete
  function openDeleteModal(ids: string[]) {
    setDeletingIds(ids);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    try {
      if (deletingIds.length === 1) {
        await deleteBusiness(deletingIds[0]);
      } else {
        await deleteBusinesses(deletingIds);
      }
      toast.success(`Deleted ${deletingIds.length} business(es)`);
      setShowDeleteModal(false);
      setDeletingIds([]);
      loadBusinesses();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  }

  // Bulk status change
  async function handleBulkStatusChange(status: Business['status'], ids: string[]) {
    try {
      await updateBusinessesStatus(ids, status);
      toast.success(`Updated ${ids.length} business(es) to ${status}`);
      loadBusinesses();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  }

  const statusBadge = (status: Business['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Suspended</Badge>;
    }
  };

  const columns: ColumnDef<Business>[] = [
    {
      header: 'Business',
      accessorKey: 'name',
      sortable: true,
      cell: (business) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {business.name}
            {business.verified && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <CheckCircle className="h-3 w-3 mr-1" /> Verified
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {business.address.city}, {business.address.state}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (business) => (
        <Badge variant="outline">{business.category}</Badge>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (business) => statusBadge(business.status),
    },
    {
      header: 'Featured',
      accessorKey: 'featured',
      sortable: true,
      cell: (business) => (
        business.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (business) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditModal(business)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`/directory/${business.slug}`, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" /> View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => openDeleteModal([business.id])}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const batchActions: BatchAction<Business>[] = [
    {
      label: 'Activate Selected',
      value: 'active',
      icon: <CheckCircle size={14} className="text-green-600" />,
      onClick: (items) => handleBulkStatusChange('active', items.map(i => i.id))
    },
    {
      label: 'Suspend Selected',
      value: 'suspended',
      icon: <XCircle size={14} className="text-red-600" />,
      onClick: (items) => handleBulkStatusChange('suspended', items.map(i => i.id))
    },
    {
      label: 'Delete Selected',
      value: 'delete',
      variant: 'destructive',
      icon: <Trash2 size={14} />,
      onClick: (items) => openDeleteModal(items.map(i => i.id))
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Business Directory
            </CardTitle>
            <CardDescription>Manage local business listings</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSeedData} disabled={loading}>
              <Database className="h-4 w-4 mr-2" /> Seed Samples
            </Button>
            <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Business
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DEFAULT_BUSINESS_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main DataTable */}
        <DataTable
          data={filteredBusinesses}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search businesses..."
          batchActions={batchActions}
          isLoading={loading}
        />
      </CardContent>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowAddModal(false);
          setShowEditModal(false);
          setEditingBusiness(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditModal ? 'Edit Business' : 'Add New Business'}</DialogTitle>
            <DialogDescription>
              {showEditModal ? 'Update business information' : 'Add a new business to the directory'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter business name"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the business"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_BUSINESS_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Business['status'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Address</Label>
                <Input
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Street address"
                  className="mb-2"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                  <Input
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="ZIP"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 555-5555"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@business.com"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.business.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured Business</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="verified"
                  checked={formData.verified}
                  onCheckedChange={(checked) => setFormData({ ...formData, verified: checked })}
                />
                <Label htmlFor="verified">Verified</Label>
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
              {showEditModal ? 'Save Changes' : 'Add Business'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Business{deletingIds.length > 1 ? 'es' : ''}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingIds.length} business{deletingIds.length > 1 ? 'es' : ''}? This action cannot be undone.
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
