'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare, Plus, Trash2, Edit, Search, Pin, PinOff,
  MoreHorizontal, Eye, EyeOff, Flag, AlertTriangle, Calendar,
  HelpCircle, Info, ShieldAlert, Users, Settings, ChevronLeft,
  ChevronRight, RefreshCw, TrendingUp, BarChart3, Check, X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  CommunityPostData,
  CommunitySettings,
  getCommunityPosts,
  getCommunityPostById,
  createCommunityPost,
  updateCommunityPost,
  deleteCommunityPost,
  togglePinPost,
  setPostVisibility,
  flagPost,
  getCommunitySettings,
  updateCommunitySettings,
  getCommunityStats,
} from '@/lib/communityPosts';
import { Timestamp } from 'firebase/firestore';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/data-table';

// Post type configurations
const POST_TYPES = {
  general: { label: 'General', color: 'bg-blue-100 text-blue-700', icon: Info },
  alert: { label: 'Alert', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  crime: { label: 'Crime', color: 'bg-purple-100 text-purple-700', icon: ShieldAlert },
  event: { label: 'Event', color: 'bg-green-100 text-green-700', icon: Calendar },
  question: { label: 'Question', color: 'bg-orange-100 text-orange-700', icon: HelpCircle },
};

const POST_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  hidden: { label: 'Hidden', color: 'bg-gray-100 text-gray-700' },
  flagged: { label: 'Flagged', color: 'bg-red-100 text-red-700' },
};

export default function CommunityAdmin() {
  // Posts state
  const [posts, setPosts] = useState<CommunityPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Settings state
  const [settings, setSettings] = useState<CommunitySettings>({
    enabled: true,
    title: 'Community Feed',
    showInNav: true,
    requireApproval: false,
    topics: ['general', 'alert', 'crime', 'event', 'question'],
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalPosts: 0,
    postsThisWeek: 0,
    activeTopics: 0,
  });

  // Modal states
  const [activeTab, setActiveTab] = useState<'posts' | 'settings' | 'moderation'>('posts');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPostData | null>(null);
  const [viewingPost, setViewingPost] = useState<CommunityPostData | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    authorName: '',
    content: '',
    topic: 'general',
    images: [] as string[],
  });

  // Load data on mount
  useEffect(() => {
    loadPosts();
    loadSettings();
    loadStats();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await getCommunityPosts({ includeHidden: true });
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    try {
      const data = await getCommunitySettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function loadStats() {
    try {
      const data = await getCommunityStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  // Filtering
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = topicFilter === 'all' || p.topic === topicFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesTopic && matchesStatus;
  });

  // Reset form
  function resetForm() {
    setFormData({
      authorName: '',
      content: '',
      topic: 'general',
      images: [],
    });
  }

  // CRUD Operations

  // CREATE
  async function handleAdd() {
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }

    try {
      await createCommunityPost({
        authorId: 'admin',
        authorName: formData.authorName || 'Admin',
        content: formData.content,
        topic: formData.topic,
        images: formData.images.length > 0 ? formData.images : undefined,
      });
      toast.success('Post created successfully');
      setShowAddModal(false);
      resetForm();
      loadPosts();
      loadStats();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  }

  // UPDATE
  async function handleUpdate() {
    if (!editingPost) return;

    try {
      await updateCommunityPost(editingPost.id, {
        content: formData.content,
        topic: formData.topic,
        images: formData.images.length > 0 ? formData.images : undefined,
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

  // DELETE
  async function handleDelete() {
    try {
      for (const id of deletingIds) {
        await deleteCommunityPost(id);
      }
      toast.success(`${deletingIds.length} post(s) deleted successfully`);
      setShowDeleteModal(false);
      setDeletingIds([]);
      loadPosts();
      loadStats();
    } catch (error) {
      console.error('Error deleting posts:', error);
      toast.error('Failed to delete posts');
    }
  }

  // Moderation actions
  async function handleTogglePin(post: CommunityPostData) {
    try {
      await togglePinPost(post.id, !post.pinned);
      toast.success(post.pinned ? 'Post unpinned' : 'Post pinned');
      loadPosts();
    } catch (error) {
      toast.error('Failed to update pin status');
    }
  }

  async function handleToggleVisibility(post: CommunityPostData) {
    try {
      await setPostVisibility(post.id, post.status !== 'hidden');
      toast.success(post.status === 'hidden' ? 'Post now visible' : 'Post hidden');
      loadPosts();
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  }

  async function handleBatchVisibility(ids: string[], hide: boolean) {
    try {
      await Promise.all(ids.map(id => setPostVisibility(id, hide)));
      toast.success(`${ids.length} post(s) ${hide ? 'hidden' : 'visible'}`);
      loadPosts();
    } catch (error) {
      toast.error('Failed to update visibility for selected posts');
    }
  }

  async function handleFlag(post: CommunityPostData) {
    try {
      await flagPost(post.id);
      toast.success('Post flagged for review');
      loadPosts();
    } catch (error) {
      toast.error('Failed to flag post');
    }
  }

  async function handleApprove(post: CommunityPostData) {
    try {
      await updateCommunityPost(post.id, { status: 'active' });
      toast.success('Post approved');
      loadPosts();
    } catch (error) {
      toast.error('Failed to approve post');
    }
  }

  // Settings update
  async function handleSaveSettings() {
    setSettingsLoading(true);
    try {
      await updateCommunitySettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  }

  // Open edit modal
  function openEditModal(post: CommunityPostData) {
    setEditingPost(post);
    setFormData({
      authorName: post.authorName,
      content: post.content,
      topic: post.topic,
      images: post.images || [],
    });
    setShowEditModal(true);
  }

  // Open view modal
  function openViewModal(post: CommunityPostData) {
    setViewingPost(post);
    setShowViewModal(true);
  }

  // Format date
  function formatDate(timestamp: Timestamp | undefined) {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Get type badge
  function getTypeBadge(topic: string) {
    const config = POST_TYPES[topic as keyof typeof POST_TYPES] || POST_TYPES.general;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon size={12} className="mr-1" />
        {config.label}
      </Badge>
    );
  }

  // Get status badge
  function getStatusBadge(status: string) {
    const config = POST_STATUS[status as keyof typeof POST_STATUS] || POST_STATUS.active;
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  }

  // Get avatar display - RESPECTS USER PRIVACY
  function getAvatarDisplay(post: CommunityPostData) {
    if (post.authorPhoto) {
      return (
        <img
          src={post.authorPhoto}
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    // Show initials for privacy - no user IDs or personal data exposed
    const initials = post.authorName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return (
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">
        {initials}
      </div>
    );
  }

  const columns: ColumnDef<CommunityPostData>[] = [
    {
      header: 'Author',
      accessorKey: 'authorName',
      sortable: true,
      cell: (post) => (
        <div className="flex items-center gap-2">
          {getAvatarDisplay(post)}
          <span className="font-medium truncate max-w-[120px]">
            {post.authorName}
          </span>
        </div>
      ),
    },
    {
      header: 'Content',
      accessorKey: 'content',
      sortable: true,
      cell: (post) => (
        <div className="flex items-center gap-2">
          {post.pinned && <Pin size={14} className="text-blue-500" />}
          <span className="truncate max-w-[200px]">{post.content}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'topic',
      sortable: true,
      cell: (post) => getTypeBadge(post.topic),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (post) => getStatusBadge(post.status),
    },
    {
      header: 'Engagement',
      accessorKey: 'likes',
      sortable: true,
      cell: (post) => (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>❤️ {post.likes}</span>
          <span>💬 {post.commentsCount}</span>
        </div>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (post) => formatDate(post.createdAt),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (post) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openViewModal(post)}>
              <Eye size={14} className="mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditModal(post)}>
              <Edit size={14} className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleTogglePin(post)}>
              {post.pinned ? (
                <>
                  <PinOff size={14} className="mr-2" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin size={14} className="mr-2" />
                  Pin
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleVisibility(post)}>
              {post.status === 'hidden' ? (
                <>
                  <Eye size={14} className="mr-2" />
                  Show
                </>
              ) : (
                <>
                  <EyeOff size={14} className="mr-2" />
                  Hide
                </>
              )}
            </DropdownMenuItem>
            {post.status !== 'flagged' && (
              <DropdownMenuItem onClick={() => handleFlag(post)}>
                <Flag size={14} className="mr-2" />
                Flag
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                setDeletingIds([post.id]);
                setShowDeleteModal(true);
              }}
            >
              <Trash2 size={14} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const batchActions: BatchAction<CommunityPostData>[] = [
    {
      label: 'Hide Selected',
      value: 'hide',
      icon: <EyeOff size={14} className="text-gray-600" />,
      onClick: (items) => handleBatchVisibility(items.map(i => i.id), true)
    },
    {
      label: 'Show Selected',
      value: 'show',
      icon: <Eye size={14} className="text-green-600" />,
      onClick: (items) => handleBatchVisibility(items.map(i => i.id), false)
    },
    {
      label: 'Delete Selected',
      value: 'delete',
      variant: 'destructive',
      icon: <Trash2 size={14} />,
      onClick: (items) => {
        setDeletingIds(items.map(i => i.id));
        setShowDeleteModal(true);
      }
    }
  ];

  // Flagged posts count
  const flaggedCount = posts.filter((p) => p.status === 'flagged').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="text-teal-600" size={28} />
            Community Management
          </h2>
          <p className="text-muted-foreground">
            Manage community posts, settings, and moderation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { loadPosts(); loadStats(); }}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} className="mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsThisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Topics</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTopics}</div>
          </CardContent>
        </Card>
        <Card className={flaggedCount > 0 ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <Flag className={`h-4 w-4 ${flaggedCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${flaggedCount > 0 ? 'text-red-600' : ''}`}>
              {flaggedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare size={16} />
            Posts
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <Flag size={16} />
            Moderation
            {flaggedCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {flaggedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings size={16} />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {Object.entries(POST_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(POST_STATUS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Posts Table */}
          <DataTable
            data={filteredPosts}
            columns={columns}
            searchKey="content"
            searchPlaceholder="Search posts..."
            batchActions={batchActions}
            isLoading={loading}
          />
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="text-red-500" size={20} />
                Flagged Posts for Review
              </CardTitle>
              <CardDescription>
                Review and moderate flagged community posts. Protect user privacy while maintaining community standards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts.filter((p) => p.status === 'flagged').length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Check size={48} className="mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">All clear!</p>
                  <p>No posts need moderation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts
                    .filter((p) => p.status === 'flagged')
                    .map((post) => (
                      <div
                        key={post.id}
                        className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getAvatarDisplay(post)}
                              <span className="font-medium">{post.authorName}</span>
                              {getTypeBadge(post.topic)}
                              <span className="text-sm text-muted-foreground">
                                {formatDate(post.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{post.content}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>❤️ {post.likes}</span>
                              <span>💬 {post.commentsCount}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleApprove(post)}
                            >
                              <Check size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleVisibility(post)}
                            >
                              <EyeOff size={14} className="mr-1" />
                              Hide
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setDeletingIds([post.id]);
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 size={14} className="mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={20} />
                Community Settings
              </CardTitle>
              <CardDescription>
                Configure community features and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Community</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn the community feature on or off
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enabled: checked })
                  }
                />
              </div>

              {/* Show in Navigation */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Show in Navigation</Label>
                  <p className="text-sm text-muted-foreground">
                    Display Community link in site navigation
                  </p>
                </div>
                <Switch
                  checked={settings.showInNav}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showInNav: checked })
                  }
                />
              </div>

              {/* Require Approval */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Require Post Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    New posts must be approved before appearing
                  </p>
                </div>
                <Switch
                  checked={settings.requireApproval}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireApproval: checked })
                  }
                />
              </div>

              {/* Community Title */}
              <div className="space-y-2">
                <Label>Community Title</Label>
                <Input
                  value={settings.title}
                  onChange={(e) =>
                    setSettings({ ...settings, title: e.target.value })
                  }
                  placeholder="Community Feed"
                />
              </div>

              {/* Topics */}
              <div className="space-y-2">
                <Label>Available Topics</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Select which post types are available to users
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(POST_TYPES).map(([key, config]) => {
                    const isSelected = settings.topics.includes(key);
                    return (
                      <Badge
                        key={key}
                        variant={isSelected ? 'default' : 'outline'}
                        className={`cursor-pointer ${isSelected ? '' : 'opacity-50'}`}
                        onClick={() => {
                          const newTopics = isSelected
                            ? settings.topics.filter((t) => t !== key)
                            : [...settings.topics, key];
                          setSettings({ ...settings, topics: newTopics });
                        }}
                      >
                        {config.label}
                        {isSelected && <Check size={12} className="ml-1" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Users size={16} className="text-blue-600" />
                  User Privacy
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• User avatars are optional and respect privacy settings</li>
                  <li>• Author IDs are never exposed in the admin interface</li>
                  <li>• Personal information is protected and not shared</li>
                  <li>• Users can be anonymous or use display names</li>
                </ul>
              </div>

              <Button onClick={handleSaveSettings} disabled={settingsLoading}>
                {settingsLoading ? (
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                  <Check size={16} className="mr-2" />
                )}
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Post Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Create an admin post for the community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Author Name</Label>
              <Input
                value={formData.authorName}
                onChange={(e) =>
                  setFormData({ ...formData, authorName: e.target.value })
                }
                placeholder="Admin"
              />
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select
                value={formData.topic}
                onValueChange={(v) => setFormData({ ...formData, topic: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Write your post content..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Create Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Post Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Modify post content (author info is protected)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Author</Label>
              <Input value={editingPost?.authorName || ''} disabled />
              <p className="text-xs text-muted-foreground">
                Author info cannot be changed to protect user identity
              </p>
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select
                value={formData.topic}
                onValueChange={(v) => setFormData({ ...formData, topic: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditModal(false);
              setEditingPost(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Post Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>View Post</DialogTitle>
          </DialogHeader>
          {viewingPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getAvatarDisplay(viewingPost)}
                <div>
                  <p className="font-medium">{viewingPost.authorName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(viewingPost.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {getTypeBadge(viewingPost.topic)}
                {getStatusBadge(viewingPost.status)}
                {viewingPost.pinned && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                    <Pin size={12} className="mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="whitespace-pre-wrap">{viewingPost.content}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>❤️ {viewingPost.likes} likes</span>
                <span>💬 {viewingPost.commentsCount} comments</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (viewingPost) {
                openEditModal(viewingPost);
                setShowViewModal(false);
              }
            }}>
              Edit Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post(s)</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingIds.length} post(s)? This action cannot be undone.
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
    </div>
  );
}
