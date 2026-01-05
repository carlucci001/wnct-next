'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, X, Check, Search, Filter,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ListOrdered, FileText, Power, PowerOff, MoreVertical,
  Sparkles, RefreshCw
} from 'lucide-react';
import { Category, CategoryInput, CATEGORY_COLORS } from '@/types/category';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
  bulkUpdateCategoryStatus,
  toggleCategoryStatus,
  generateSlug,
  seedDefaultCategories,
  recalculateArticleCounts,
} from '@/lib/categories';

interface CategoryManagerProps {
  currentUserId: string;
}

interface ModalState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  category: Category | null;
}

type FilterStatus = 'all' | 'active' | 'inactive';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

export default function CategoryManager({ currentUserId }: CategoryManagerProps) {
  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: 'add', category: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formColor, setFormColor] = useState('#2563eb');
  const [formDescription, setFormDescription] = useState('');
  const [formDirective, setFormDirective] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [saving, setSaving] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (modal.mode === 'add' && formName) {
      setFormSlug(generateSlug(formName));
    }
  }, [formName, modal.mode]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getAllCategories();
      if (data.length === 0) {
        // Seed default categories if none exist
        await seedDefaultCategories(currentUserId);
        const seeded = await getAllCategories();
        setCategories(seeded);
      } else {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCounts = async () => {
    setRefreshing(true);
    try {
      await recalculateArticleCounts();
      await loadCategories();
    } catch (error) {
      console.error('Error refreshing counts:', error);
      alert('Failed to refresh article counts');
    } finally {
      setRefreshing(false);
    }
  };

  // Filter and search categories
  const filteredCategories = categories.filter((cat) => {
    // Status filter
    if (filterStatus === 'active' && !cat.isActive) return false;
    if (filterStatus === 'inactive' && cat.isActive) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        cat.name.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query) ||
        cat.editorialDirective.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, itemsPerPage]);

  // Modal handlers
  const openAddModal = () => {
    setFormName('');
    setFormSlug('');
    setFormColor('#2563eb');
    setFormDescription('');
    setFormDirective('');
    setFormIsActive(true);
    setFormSortOrder(categories.length + 1);
    setModal({ isOpen: true, mode: 'add', category: null });
  };

  const openEditModal = (category: Category) => {
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormColor(category.color);
    setFormDescription(category.description || '');
    setFormDirective(category.editorialDirective);
    setFormIsActive(category.isActive);
    setFormSortOrder(category.sortOrder);
    setModal({ isOpen: true, mode: 'edit', category });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'add', category: null });
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      alert('Category name is required');
      return;
    }

    setSaving(true);
    try {
      const data: CategoryInput = {
        name: formName.trim(),
        slug: formSlug || generateSlug(formName),
        color: formColor,
        description: formDescription.trim(),
        editorialDirective: formDirective.trim(),
        isActive: formIsActive,
        sortOrder: formSortOrder,
        createdBy: currentUserId,
      };

      if (modal.mode === 'add') {
        await createCategory(data);
      } else if (modal.category) {
        await updateCategory(modal.category.id, data);
      }

      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCategory(category.id);
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await toggleCategoryStatus(category.id, category.isActive);
      await loadCategories();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedCategories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedCategories.map((c) => c.id)));
    }
  };

  // Bulk action handlers
  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateCategoryStatus(Array.from(selectedIds), true);
      await loadCategories();
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error bulk activating:', error);
      alert('Failed to activate categories');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateCategoryStatus(Array.from(selectedIds), false);
      await loadCategories();
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error bulk deactivating:', error);
      alert('Failed to deactivate categories');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} categories? This action cannot be undone.`)) {
      return;
    }
    try {
      await bulkDeleteCategories(Array.from(selectedIds));
      await loadCategories();
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Failed to delete categories');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ListOrdered className="text-blue-600" size={28} />
            Categories
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage categories and editorial directives for AI agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshCounts}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            title="Recalculate article counts"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Counts'}
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleBulkActivate}
              className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
            >
              Activate
            </button>
            <button
              onClick={handleBulkDeactivate}
              className="px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded"
            >
              Deactivate
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === paginatedCategories.length && paginatedCategories.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Articles
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Editorial Directive
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                  {searchQuery || filterStatus !== 'all'
                    ? 'No categories match your filters'
                    : 'No categories yet. Click "Add Category" to create one.'}
                </td>
              </tr>
            ) : (
              paginatedCategories.map((category) => (
                <tr
                  key={category.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    !category.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(category.id)}
                      onChange={() => toggleSelection(category.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {category.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          /{category.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <FileText size={14} />
                      <span>{category.articleCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        category.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {category.isActive ? (
                        <>
                          <Power size={12} /> Active
                        </>
                      ) : (
                        <>
                          <PowerOff size={12} /> Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {category.editorialDirective ? (
                      <div className="flex items-start gap-1.5 max-w-md">
                        <Sparkles size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                          {category.editorialDirective}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">No directive set</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={`p-2 rounded-lg transition-colors ${
                          category.isActive
                            ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                            : 'text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                        title={category.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {category.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredCategories.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
              >
                {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span>per page</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-sm text-slate-600 dark:text-slate-300 mr-4">
                {startIndex + 1}-{Math.min(endIndex, filteredCategories.length)} of{' '}
                {filteredCategories.length}
              </span>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronsLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center sticky top-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ListOrdered size={20} />
                {modal.mode === 'add' ? 'Add Category' : 'Edit Category'}
              </h2>
              <button onClick={closeModal} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., News"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="Auto-generated from name"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  URL-friendly identifier. Auto-generated if left empty.
                </p>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormColor(color.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formColor === color.value
                          ? 'border-slate-900 dark:border-white scale-110'
                          : 'border-transparent hover:border-slate-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formColor}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of this category"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Editorial Directive */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-500" />
                    Editorial Directive
                  </span>
                </label>
                <textarea
                  value={formDirective}
                  onChange={(e) => setFormDirective(e.target.value)}
                  placeholder="Instructions for AI agents working on this category...&#10;&#10;Example: Focus on local high school sports. Include scores, standings, and player highlights. Cover football games in the Western NC region."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This prompt will guide AI agents when generating content for this category.
                </p>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                  min={1}
                  className="w-24 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Lower numbers appear first in lists.
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formIsActive ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      formIsActive ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {formIsActive ? 'Active - Visible in lists and dropdowns' : 'Inactive - Hidden from selection'}
                </span>
              </div>

              {/* Footer Actions */}
              <div className="bg-slate-50 dark:bg-slate-800 -mx-6 -mb-6 px-6 py-4 flex justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {modal.mode === 'add' ? 'Create Category' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
