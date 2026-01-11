'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAllComments, 
  updateComment, 
  deleteComment, 
  getCommentSettings, 
  updateCommentSettings 
} from '@/lib/comments';
import { Comment, CommentStatus, CommentSettings } from '@/types/comment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  Trash2, 
  Flag, 
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function CommentAdmin() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<CommentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<CommentSettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getAllComments(filterStatus === 'all' ? undefined : filterStatus as CommentStatus);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSettings() {
    try {
      const s = await getCommentSettings();
      setSettings(s);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }

  const handleStatusChange = async (id: string, status: CommentStatus) => {
    try {
      await updateComment(id, { status });
      toast.success(`Comment ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleBatchStatusChange = async (ids: string[], status: CommentStatus) => {
    try {
      await Promise.all(ids.map(id => updateComment(id, { status })));
      toast.success(`${ids.length} comment(s) ${status}`);
      fetchData();
    } catch (error) {
      toast.error(`Failed to update status for ${ids.length} comment(s)`);
    }
  };

  const handleDelete = async () => {
    if (deletingIds.length === 0) return;
    
    try {
      await Promise.all(deletingIds.map(id => deleteComment(id)));
      toast.success(`${deletingIds.length} comment(s) deleted`);
      setShowDeleteModal(false);
      setDeletingIds([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete comment(s)');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      await updateCommentSettings(settings);
      toast.success('Settings updated');
      setIsSettingsOpen(false);
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const filteredComments = comments.filter(c => 
    c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.articleTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnDef<Comment>[] = [
    {
      header: 'Author / Date',
      accessorKey: 'userName',
      sortable: true,
      cell: (comment) => (
        <div>
          <div className="font-medium">{comment.userName}</div>
          <div className="text-xs text-muted-foreground">
            {typeof comment.createdAt === 'string' ? comment.createdAt : (comment.createdAt as unknown as { toDate: () => Date })?.toDate?.().toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Content',
      accessorKey: 'content',
      cell: (comment) => (
        <p className="text-sm line-clamp-2 max-w-[400px]" title={comment.content}>
          {comment.content}
        </p>
      ),
    },
    {
      header: 'Article',
      accessorKey: 'articleTitle',
      sortable: true,
      cell: (comment) => (
        <div className="max-w-[200px]">
          <div className="text-xs font-medium truncate">
            {comment.articleTitle || 'Unknown Article'}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            ID: {comment.articleId.substring(0, 8)}...
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (comment) => (
        <Badge variant={
          comment.status === 'approved' ? 'default' : 
          comment.status === 'pending' ? 'secondary' : 
          comment.status === 'flagged' ? 'destructive' : 'outline'
        } className="capitalize">
          {comment.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (comment) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {comment.status !== 'approved' && (
              <DropdownMenuItem onClick={() => handleStatusChange(comment.id, 'approved')}>
                <CheckCircle size={14} className="mr-2 text-green-600" />
                Approve
              </DropdownMenuItem>
            )}
            {comment.status !== 'flagged' && (
              <DropdownMenuItem onClick={() => handleStatusChange(comment.id, 'flagged')}>
                <Flag size={14} className="mr-2 text-amber-600" />
                Flag
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => {
                setDeletingIds([comment.id]);
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

  const batchActions: BatchAction<Comment>[] = [
    {
      label: 'Approve Selected',
      value: 'approved',
      icon: <CheckCircle size={14} className="text-green-600" />,
      onClick: (items) => handleBatchStatusChange(items.map(i => i.id), 'approved')
    },
    {
      label: 'Flag Selected',
      value: 'flagged',
      icon: <Flag size={14} className="text-amber-600" />,
      onClick: (items) => handleBatchStatusChange(items.map(i => i.id), 'flagged')
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif">Comment Management</h1>
          <p className="text-muted-foreground text-sm">Moderate user discussions and manage comment settings.</p>
        </div>
        
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings size={18} /> Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Comment System Settings</DialogTitle>
            </DialogHeader>
            {settings && (
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Comments</Label>
                    <p className="text-xs text-muted-foreground">Allow users to comment on articles.</p>
                  </div>
                  <Switch 
                    checked={settings.enabled} 
                    onCheckedChange={(val) => setSettings({...settings, enabled: val})} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Approval</Label>
                    <p className="text-xs text-muted-foreground">Comments must be approved by admin before appearing.</p>
                  </div>
                  <Switch 
                    checked={settings.requireApproval} 
                    onCheckedChange={(val) => setSettings({...settings, requireApproval: val})} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Characters</Label>
                  <Input 
                    type="number" 
                    value={settings.maxCharacters} 
                    onChange={(e) => setSettings({...settings, maxCharacters: parseInt(e.target.value)})} 
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search comments, users, or articles..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-muted-foreground" />
          <Select 
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as CommentStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable 
        data={filteredComments}
        columns={columns}
        searchKey="content"
        searchPlaceholder="Search comments..."
        batchActions={batchActions}
        isLoading={loading}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingIds.length} comment(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
