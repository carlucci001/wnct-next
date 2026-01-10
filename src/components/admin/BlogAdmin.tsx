'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Trash2, Edit, Search,
  CheckCircle, Star, ExternalLink, MoreHorizontal,
  Database, User, Eye, AlertCircle, Tag as TagIcon,
  Image as ImageIcon, Clock, Archive
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
import { BlogPost, DEFAULT_BLOG_CATEGORIES } from '@/types/blogPost';
import {
  getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost,
  deleteBlogPosts, generateBlogSlug
} from '@/lib/blog';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/data-table';

const MediaPickerModal = dynamic(() => import('@/components/admin/MediaPickerModal'), {
  ssr: false,
});

export default function BlogAdmin() {
  const { userProfile, currentUser } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BlogPost['status']>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: DEFAULT_BLOG_CATEGORIES[0],
    tags: '',
    status: 'published' as BlogPost['status'],
    featuredImage: '',
    allowComments: true,
  });

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await getBlogPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }

  // Filtering
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  function resetForm() {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: DEFAULT_BLOG_CATEGORIES[0],
      tags: '',
      status: 'published',
      featuredImage: '',
      allowComments: true,
    });
  }

  // CRUD handlers
  async function handleAdd() {
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      await createBlogPost({
        title: formData.title,
        slug: generateBlogSlug(formData.title),
        content: formData.content,
        excerpt: formData.excerpt,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        status: formData.status,
        featuredImage: formData.featuredImage || undefined,
        authorId: currentUser?.uid || 'anonymous',
        authorName: userProfile?.displayName || currentUser?.displayName || 'Staff Writer',
        authorPhoto: userProfile?.photoURL || currentUser?.photoURL || undefined,
        authorBio: (userProfile as any)?.bio || undefined,
        allowComments: formData.allowComments,
      });

      toast.success('Blog post created successfully');
      setShowAddModal(false);
      resetForm();
      loadPosts();
    } catch (error) {
      console.error('Error adding post:', error);
      toast.error('Failed to add post');
    }
  }

  function openEditModal(post: BlogPost) {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category,
      tags: post.tags.join(', '),
      status: post.status,
      featuredImage: post.featuredImage || '',
      allowComments: post.allowComments,
    });
    setShowEditModal(true);
  }

  async function handleEdit() {
    if (!editingPost) return;

    try {
      await updateBlogPost(editingPost.id, {
        title: formData.title,
        slug: generateBlogSlug(formData.title),
        content: formData.content,
        excerpt: formData.excerpt,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        status: formData.status,
        featuredImage: formData.featuredImage || undefined,
        allowComments: formData.allowComments,
      });

      toast.success('Post updated successfully');
      setShowEditModal(false);
      setEditingPost(null);
      resetForm();
      loadPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  }

  function openDeleteModal(ids: string[]) {
    setDeletingIds(ids);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    try {
      if (deletingIds.length === 1) {
        await deleteBlogPost(deletingIds[0]);
      } else {
        await deleteBlogPosts(deletingIds);
      }
      toast.success(`Deleted ${deletingIds.length} post(s)`);
      setShowDeleteModal(false);
      setDeletingIds([]);
      loadPosts();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  }

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/blog/seed');
      const data = await resp.json();
      if (data.success) {
        toast.success(data.message);
        loadPosts();
      } else {
        toast.error(data.error || 'Failed to seed');
      }
    } catch {
      toast.error('Failed to seed blog posts');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: BlogPost['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Published</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300">Archived</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Draft</Badge>;
    }
  };

  async function handleBulkStatusChange(status: BlogPost['status'], ids: string[]) {
    try {
      await Promise.all(ids.map(id => updateBlogPost(id, { status })));
      toast.success(`Updated ${ids.length} post(s) to ${status}`);
      loadPosts();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  }

  const columns: ColumnDef<BlogPost>[] = [
    {
      header: 'Title & Author',
      accessorKey: 'title',
      sortable: true,
      cell: (post) => (
        <div>
          <div className="font-medium text-slate-950 dark:text-slate-50 line-clamp-1">{post.title}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <User size={10} /> {post.authorName} • {post.createdAt.toDate().toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (post) => (
        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">{post.category}</Badge>
      ),
    },
    {
      header: 'Views',
      accessorKey: 'viewCount',
      sortable: true,
      cell: (post) => (
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Eye size={14} className="text-primary" />
          {post.viewCount || 0}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (post) => statusBadge(post.status),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (post) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEditModal(post)}>
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteModal([post.id])}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const batchActions: BatchAction<BlogPost>[] = [
    {
      label: 'Publish Selected',
      value: 'publish',
      icon: <CheckCircle size={14} className="text-green-600" />,
      onClick: (items) => handleBulkStatusChange('published', items.map(i => i.id))
    },
    {
      label: 'Move to Draft',
      value: 'draft',
      icon: <Clock size={14} className="text-yellow-600" />,
      onClick: (items) => handleBulkStatusChange('draft', items.map(i => i.id))
    },
    {
      label: 'Archive Selected',
      value: 'archive',
      icon: <Archive size={14} className="text-gray-600" />,
      onClick: (items) => handleBulkStatusChange('archived', items.map(i => i.id))
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
              <BookOpen className="h-5 w-5 text-primary" />
              Blog Post Management
            </CardTitle>
            <CardDescription>Manage community blog posts and opinion pieces</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSeedData} disabled={loading}>
              <Database className="h-4 w-4 mr-2" /> Seed Samples
            </Button>
            <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Create Post
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
              placeholder="Search posts or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DEFAULT_BLOG_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main DataTable */}
        <DataTable
          data={filteredPosts}
          columns={columns}
          searchKey="title"
          searchPlaceholder="Search posts..."
          batchActions={batchActions}
          isLoading={loading}
        />
      </CardContent>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={(v) => { if(!v) { setShowAddModal(false); setShowEditModal(false); }}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditModal ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
            <DialogDescription>Fill in the details for your community blog story.</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
            {/* Main Content Side */}
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Post Title *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Give your story a compelling title..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Story Content (HTML supported) *</Label>
                <Textarea id="content" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} rows={12} placeholder="Share your perspective with the community..." className="font-serif text-lg leading-relaxed" />
              </div>

              <div className="space-y-2">
                 <Label htmlFor="excerpt">Short Excerpt / Teaser *</Label>
                 <Textarea id="excerpt" value={formData.excerpt} onChange={(e) => setFormData({...formData, excerpt: e.target.value})} rows={3} placeholder="A 2-3 sentence teaser for the grid view..." />
              </div>
            </div>

            {/* Sidebar Side */}
            <div className="space-y-6">
               <div className="p-4 bg-muted/30 rounded-2xl border space-y-4">
                 <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                   <TagIcon size={14} className="text-primary" /> Attributes
                 </h3>

                 <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_BLOG_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>

                 <div className="space-y-2">
                   <Label>Status</Label>
                   <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="featuredImage">Featured Image URL</Label>
                    <div className="flex gap-2">
                      <Input id="featuredImage" value={formData.featuredImage} onChange={(e) => setFormData({...formData, featuredImage: e.target.value})} placeholder="https://..." />
                      <Button variant="outline" size="icon" onClick={() => setShowMediaPicker(true)}>
                        <ImageIcon size={16} />
                      </Button>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input id="tags" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="asheville, opinion, community" />
                 </div>

                 <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="allowComments">Allow Public Comments</Label>
                    <Switch id="allowComments" checked={formData.allowComments} onCheckedChange={(v) => setFormData({...formData, allowComments: v})} />
                 </div>
               </div>

               <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                    <AlertCircle size={12} /> Publication Note
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Once published, this blog post will be visible on the public Weekly Post page. Authors can still edit their drafts until they are ready for final publication.
                  </p>
               </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</Button>
            <Button onClick={showEditModal ? handleEdit : handleAdd} className="shadow-lg font-bold">
              {showEditModal ? 'Update Story' : 'Publish Story'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(media) => {
          const m = Array.isArray(media) ? media[0] : media;
          setFormData({ ...formData, featuredImage: m.url });
          setShowMediaPicker(false);
        }}
        allowedTypes={['image']}
        defaultFolder="articles"
        title="Select Featured Image"
      />

      {/* Delete Confirmation */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanent Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingIds.length} story(ies)? This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="shadow-lg">Delete Forever</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
