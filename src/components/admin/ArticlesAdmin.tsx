'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Plus, Trash2, Edit, Search,
  CheckCircle, Clock, Archive, Send, Star, MoreHorizontal,
  ExternalLink, FolderInput, Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import { Article } from '@/types/article';
import {
  getAllArticles, deleteArticle, deleteArticles, updateArticle,
  updateArticlesStatus, updateArticlesCategory, toggleArticleFeatured, getCategories
} from '@/lib/articles';
import FactCheckBadge from './FactCheckBadge';
import FactCheckPanel from './FactCheckPanel';
import { FactCheckResult, FactCheckStatus } from '@/types/factCheck';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/data-table';

type StatusFilter = 'all' | 'draft' | 'review' | 'published' | 'archived';
type FactCheckFilter = 'all' | 'passed' | 'review_recommended' | 'caution' | 'high_risk' | 'not_checked';

export default function ArticlesAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [factCheckFilter, setFactCheckFilter] = useState<FactCheckFilter>('all');

  // Selection state (internal to DataTable, but we can track for modals)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [targetCategory, setTargetCategory] = useState<string>('');

  // Fact-check state
  const [factCheckPanel, setFactCheckPanel] = useState<{
    isOpen: boolean;
    article: Article | null;
  }>({ isOpen: false, article: null });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [articlesData, categoriesData] = await Promise.all([
        getAllArticles(),
        getCategories()
      ]);
      setArticles(articlesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }

  // Filtering
  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const articleStatus = a.status?.toLowerCase() || 'draft';
    const matchesStatus = statusFilter === 'all' || articleStatus === statusFilter;
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    const articleFactCheck = a.factCheckStatus || 'not_checked';
    const matchesFactCheck = factCheckFilter === 'all' || articleFactCheck === factCheckFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesFactCheck;
  });

  // Delete
  function openDeleteModal(ids: string[]) {
    setDeletingIds(ids);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    try {
      if (deletingIds.length === 1) {
        await deleteArticle(deletingIds[0]);
      } else {
        await deleteArticles(deletingIds);
      }
      toast.success(`Deleted ${deletingIds.length} article(s)`);
      setShowDeleteModal(false);
      setDeletingIds([]);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  }

  // Bulk status change
  async function handleBulkStatusChange(status: Article['status'], ids: string[]) {
    try {
      await updateArticlesStatus(ids, status);
      toast.success(`Updated ${ids.length} article(s) to ${status}`);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  }

  // Bulk category change
  function openCategoryModal() {
    setTargetCategory('');
    setShowCategoryModal(true);
  }

  async function handleBulkCategoryChange() {
    if (!targetCategory) {
      toast.error('Please select a category');
      return;
    }
    const ids = Array.from(selectedIds);
    try {
      await updateArticlesCategory(ids, targetCategory);
      toast.success(`Moved ${ids.length} article(s) to ${targetCategory}`);
      setShowCategoryModal(false);
      loadData();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  }

  // Toggle featured
  async function handleToggleFeatured(article: Article) {
    try {
      await toggleArticleFeatured(article.id, !article.isFeatured);
      toast.success(article.isFeatured ? 'Removed from featured' : 'Marked as featured');
      loadData();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update');
    }
  }

  // Format date
  function formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  // Status badge helper
  const statusBadge = (status?: string) => {
    const s = status?.toLowerCase() || 'draft';
    switch (s) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>;
      case 'review':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"><Clock className="h-3 w-3 mr-1" />In Review</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"><Archive className="h-3 w-3 mr-1" />Archived</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"><Edit className="h-3 w-3 mr-1" />Draft</Badge>;
    }
  };

  const columns: ColumnDef<Article>[] = [
    {
      header: 'Title',
      accessorKey: 'title',
      sortable: true,
      cell: (article) => (
        <div className="max-w-[300px]">
          <div className="font-medium flex items-center gap-2 truncate">
            {article.isFeatured && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
            )}
            <span className="truncate">{article.title}</span>
          </div>
          {article.excerpt && (
            <div className="text-sm text-muted-foreground truncate">
              {article.excerpt.substring(0, 60)}...
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (article) => (
        <Badge
          variant="outline"
          style={{ borderColor: article.categoryColor, color: article.categoryColor }}
        >
          {article.category}
        </Badge>
      ),
    },
    {
      header: 'Author',
      accessorKey: 'author',
      sortable: true,
      cell: (article) => (
        <div className="flex items-center gap-2">
          {article.authorPhotoURL && (
            <img
              src={article.authorPhotoURL}
              alt={article.author}
              className="w-6 h-6 rounded-full object-cover"
            />
          )}
          <span className="text-sm">{article.author}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (article) => statusBadge(article.status),
    },
    {
      header: 'Fact Check',
      accessorKey: 'factCheckStatus',
      sortable: true,
      cell: (article) => (
        <FactCheckBadge
          status={article.factCheckStatus as FactCheckStatus | undefined}
          confidence={article.factCheckConfidence}
          size="sm"
          showLabel={true}
          onClick={(e) => {
            e?.stopPropagation();
            setFactCheckPanel({ isOpen: true, article });
          }}
        />
      ),
    },
    {
      header: 'Date',
      accessorKey: 'publishedAt',
      sortable: true,
      cell: (article) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(article.publishedAt || article.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (article) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.open(`/admin/articles/new?id=${article.id}`, '_blank')}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`/article/${article.slug}`, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleFeatured(article)}>
              <Star className="h-4 w-4 mr-2" /> {article.isFeatured ? 'Unfeature' : 'Feature'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFactCheckPanel({ isOpen: true, article })}>
              <Shield className="h-4 w-4 mr-2" /> Fact Check
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => openDeleteModal([article.id])}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const batchActions: BatchAction<Article>[] = [
    {
      label: 'Publish Selected',
      value: 'publish',
      icon: <CheckCircle size={14} className="text-green-600" />,
      onClick: (items) => handleBulkStatusChange('published', items.map(i => i.id))
    },
    {
      label: 'Move to Draft',
      value: 'draft',
      icon: <Edit size={14} className="text-blue-600" />,
      onClick: (items) => handleBulkStatusChange('draft', items.map(i => i.id))
    },
    {
      label: 'Send to Review',
      value: 'review',
      icon: <Clock size={14} className="text-yellow-600" />,
      onClick: (items) => handleBulkStatusChange('review', items.map(i => i.id))
    },
    {
      label: 'Archive Selected',
      value: 'archive',
      icon: <Archive size={14} className="text-gray-600" />,
      onClick: (items) => handleBulkStatusChange('archived', items.map(i => i.id))
    },
    {
      label: 'Move to Category',
      value: 'category',
      icon: <FolderInput size={14} />,
      onClick: (items) => {
        setSelectedIds(new Set(items.map(i => i.id)));
        openCategoryModal();
      }
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
              <FileText className="h-5 w-5 text-blue-600" />
              Articles
            </CardTitle>
            <CardDescription>Manage news articles and content</CardDescription>
          </div>
          <Button onClick={() => window.open('/admin/articles/new', '_blank')}>
            <Plus className="h-4 w-4 mr-2" /> New Article
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="review">In Review</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={factCheckFilter} onValueChange={(v) => setFactCheckFilter(v as FactCheckFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Fact Check" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fact Checks</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="review_recommended">Review Needed</SelectItem>
              <SelectItem value="caution">Caution</SelectItem>
              <SelectItem value="high_risk">High Risk</SelectItem>
              <SelectItem value="not_checked">Not Checked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main DataTable */}
        <DataTable
          data={filteredArticles}
          columns={columns}
          searchKey="title"
          searchPlaceholder="Search articles..."
          batchActions={batchActions}
          isLoading={loading}
          onRowClick={(article) => {
            window.open(`/admin/articles/new?id=${article.id}`, '_blank');
          }}
        />
      </CardContent>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article{deletingIds.length > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingIds.length} article{deletingIds.length > 1 ? 's' : ''}? This action cannot be undone.
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

      {/* Move to Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Category</DialogTitle>
            <DialogDescription>
              Select the category to move {selectedIds.size} article{selectedIds.size > 1 ? 's' : ''} to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={targetCategory} onValueChange={setTargetCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkCategoryChange}>
              Move Articles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fact Check Panel */}
      {factCheckPanel.article && (
        <FactCheckPanel
          isOpen={factCheckPanel.isOpen}
          onClose={() => setFactCheckPanel({ isOpen: false, article: null })}
          articleId={factCheckPanel.article.id}
          title={factCheckPanel.article.title}
          content={factCheckPanel.article.content || ''}
          sourceTitle={factCheckPanel.article.sourceTitle}
          sourceSummary={factCheckPanel.article.sourceSummary}
          sourceUrl={factCheckPanel.article.sourceUrl}
          initialResult={factCheckPanel.article.factCheckStatus ? {
            mode: (factCheckPanel.article.factCheckMode || 'quick') as 'quick' | 'detailed',
            status: factCheckPanel.article.factCheckStatus,
            summary: factCheckPanel.article.factCheckSummary || '',
            confidence: factCheckPanel.article.factCheckConfidence || 0,
            checkedAt: factCheckPanel.article.factCheckedAt || new Date().toISOString(),
            ...(factCheckPanel.article.factCheckMode === 'detailed' ? {
              claims: factCheckPanel.article.factCheckClaims || [],
              recommendations: factCheckPanel.article.factCheckRecommendations || [],
            } : {}),
          } as FactCheckResult : undefined}
          onResultUpdate={async (result: FactCheckResult) => {
            // Save fact-check result to article
            try {
              await updateArticle(factCheckPanel.article!.id, {
                factCheckStatus: result.status,
                factCheckSummary: result.summary,
                factCheckConfidence: result.confidence,
                factCheckedAt: result.checkedAt,
                factCheckMode: result.mode,
                ...(result.mode === 'detailed' ? {
                  factCheckClaims: (result as any).claims,
                  factCheckRecommendations: (result as any).recommendations,
                } : {}),
              });
              toast.success('Fact-check result saved');
              loadData();
            } catch (error) {
              console.error('Error saving fact-check result:', error);
              toast.error('Failed to save fact-check result');
            }
          }}
        />
      )}
    </Card>
  );
}
