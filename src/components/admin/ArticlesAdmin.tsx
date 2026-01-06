'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Plus, Trash2, Edit, Search, Eye,
  CheckCircle, Clock, Archive, Send, Star, MoreHorizontal,
  ChevronLeft, ChevronRight, ExternalLink, FolderInput
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Article } from '@/types/article';
import {
  getAllArticles, deleteArticle, deleteArticles, updateArticle,
  updateArticlesStatus, updateArticlesCategory, toggleArticleFeatured, getCategories
} from '@/lib/articles';

type StatusFilter = 'all' | 'draft' | 'review' | 'published' | 'archived';

export default function ArticlesAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [targetCategory, setTargetCategory] = useState<string>('');

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
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / pageSize);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

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
    if (selectedIds.size === paginatedArticles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedArticles.map((a) => a.id)));
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
        await deleteArticle(deletingIds[0]);
      } else {
        await deleteArticles(deletingIds);
      }
      toast.success(`Deleted ${deletingIds.length} article(s)`);
      setShowDeleteModal(false);
      setDeletingIds([]);
      setSelectedIds(new Set());
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  }

  // Bulk status change
  async function handleBulkStatusChange(status: Article['status']) {
    try {
      await updateArticlesStatus(Array.from(selectedIds), status);
      toast.success(`Updated ${selectedIds.size} article(s) to ${status}`);
      setSelectedIds(new Set());
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
    try {
      await updateArticlesCategory(Array.from(selectedIds), targetCategory);
      toast.success(`Moved ${selectedIds.size} article(s) to ${targetCategory}`);
      setShowCategoryModal(false);
      setSelectedIds(new Set());
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

  // Status badge
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
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-muted p-3 rounded-lg mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Send className="h-4 w-4 mr-1" /> Change Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('published')}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Publish
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('draft')}>
                  <Edit className="h-4 w-4 mr-2 text-blue-600" /> Move to Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('review')}>
                  <Clock className="h-4 w-4 mr-2 text-yellow-600" /> Send to Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('archived')}>
                  <Archive className="h-4 w-4 mr-2 text-gray-600" /> Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={openCategoryModal}>
              <FolderInput className="h-4 w-4 mr-1" /> Move to Category
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => openDeleteModal(Array.from(selectedIds))}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No articles found</p>
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
                        checked={selectedIds.size === paginatedArticles.length && paginatedArticles.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(article.id)}
                          onChange={() => toggleSelect(article.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <div className="font-medium flex items-center gap-2 truncate">
                            {article.isFeatured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                            <span className="truncate">{article.title}</span>
                          </div>
                          {article.excerpt && (
                            <div className="text-sm text-muted-foreground truncate">
                              {article.excerpt.substring(0, 60)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{ borderColor: article.categoryColor, color: article.categoryColor }}
                        >
                          {article.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>{statusBadge(article.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(article.publishedAt || article.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/admin?action=edit-article&id=${article.id}`, '_blank')}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/article/${article.slug}`, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(article)}>
                              <Star className="h-4 w-4 mr-2" /> {article.isFeatured ? 'Unfeature' : 'Feature'}
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredArticles.length)} of {filteredArticles.length}
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
    </Card>
  );
}
