'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Menu, Plus, Trash2, Edit, List, LayoutGrid, MoreHorizontal,
  ArrowLeft, ArrowUp, ArrowDown, Eye, EyeOff, GripVertical,
  Save, X, RefreshCw, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { SiteMenu, MenuItem } from '@/types/menu';

const CORE_MENUS = ['top-nav', 'main-nav', 'footer-quick-links', 'footer-categories'];

export default function MenuManager() {
  // Auth
  const { currentUser, userProfile } = useAuth();

  // State
  const [menus, setMenus] = useState<SiteMenu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<SiteMenu | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<SiteMenu | null>(null);

  // Form states
  const [newMenuForm, setNewMenuForm] = useState({ name: '', slug: '', description: '' });
  const [newItemForm, setNewItemForm] = useState({ label: '', path: '' });
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<{ itemId: string; label: string; path: string } | null>(null);

  // Load menus on mount
  useEffect(() => {
    loadMenus();
  }, []);

  async function loadMenus() {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await fetch('/api/admin/menus');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.menus) {
        setMenus(data.menus);
        console.log('[MenuManager] Loaded menus:', data.menus?.length || 0);
        // If we have a selected menu, update it with fresh data
        if (selectedMenu) {
          const updated = data.menus.find((m: SiteMenu) => m.id === selectedMenu.id);
          if (updated) setSelectedMenu(updated);
        }
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load menus';
      console.error('[MenuManager] Error loading menus:', error);
      setError(errorMessage);
      toast.error(`Menu Load Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  // CRUD: Create Menu
  async function createMenu() {
    if (!newMenuForm.name || !newMenuForm.slug) {
      toast.error('Name and slug are required');
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newMenuForm.slug)) {
      toast.error('Slug must contain only lowercase letters, numbers, and hyphens');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMenuForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create menu');

      setMenus(prev => [...prev, data.menu]);
      setNewMenuForm({ name: '', slug: '', description: '' });
      setShowCreateModal(false);
      toast.success('Menu created successfully');
    } catch (error) {
      console.error('Error creating menu:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create menu');
    } finally {
      setSaving(false);
    }
  }

  // CRUD: Update Menu
  async function updateMenu(menuId: string, updates: Partial<SiteMenu>) {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/menus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuId, updates }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update menu');

      setMenus(prev => prev.map(m => m.id === menuId ? data.menu : m));
      if (selectedMenu?.id === menuId) {
        setSelectedMenu(data.menu);
      }
      toast.success('Menu updated');
    } catch (error) {
      console.error('Error updating menu:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update menu');
    } finally {
      setSaving(false);
    }
  }

  // CRUD: Delete Menu
  async function deleteMenu(menu: SiteMenu) {
    if (CORE_MENUS.includes(menu.id)) {
      toast.error('Cannot delete core system menus');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/menus?menuId=${menu.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete menu');

      setMenus(prev => prev.filter(m => m.id !== menu.id));
      setShowDeleteModal(false);
      setMenuToDelete(null);
      toast.success('Menu deleted');
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete menu');
    } finally {
      setSaving(false);
    }
  }

  // Toggle menu enabled state
  async function toggleMenuEnabled(menu: SiteMenu) {
    await updateMenu(menu.id, { enabled: !menu.enabled });
  }

  // CRUD: Add Menu Item
  async function addMenuItem() {
    if (!selectedMenu || !newItemForm.label || !newItemForm.path) {
      toast.error('Label and path are required');
      return;
    }

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      label: newItemForm.label,
      path: newItemForm.path,
      enabled: true,
      order: selectedMenu.items.length,
    };

    const updatedItems = [...selectedMenu.items, newItem];
    await updateMenu(selectedMenu.id, { items: updatedItems });
    setNewItemForm({ label: '', path: '' });
    setShowAddItem(false);
  }

  // CRUD: Update Menu Item
  async function saveEditingItem() {
    if (!selectedMenu || !editingItem) return;

    const updatedItems = selectedMenu.items.map(item =>
      item.id === editingItem.itemId
        ? { ...item, label: editingItem.label, path: editingItem.path }
        : item
    );

    await updateMenu(selectedMenu.id, { items: updatedItems });
    setEditingItem(null);
  }

  // CRUD: Delete Menu Item
  async function deleteMenuItem(itemId: string) {
    if (!selectedMenu) return;
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    const updatedItems = selectedMenu.items
      .filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, order: index }));

    await updateMenu(selectedMenu.id, { items: updatedItems });
  }

  // Toggle item enabled
  async function toggleItemEnabled(itemId: string) {
    if (!selectedMenu) return;

    const updatedItems = selectedMenu.items.map(item =>
      item.id === itemId ? { ...item, enabled: !item.enabled } : item
    );

    await updateMenu(selectedMenu.id, { items: updatedItems });
  }

  // Move item up/down
  async function moveItem(itemId: string, direction: 'up' | 'down') {
    if (!selectedMenu) return;

    const items = [...selectedMenu.items].sort((a, b) => a.order - b.order);
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];

    const updatedItems = items.map((item, i) => ({ ...item, order: i }));
    await updateMenu(selectedMenu.id, { items: updatedItems });
  }

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading menus...</p>
        </div>
      </div>
    );
  }

  // Render error state - ensures we never show blank screen
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Failed to Load Menus
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-300">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Possible causes:</p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Firebase Admin SDK configuration issue</li>
                <li>Missing environment variables (FIREBASE_SERVICE_ACCOUNT)</li>
                <li>Database connection problem</li>
              </ul>
              <Button onClick={loadMenus} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render menu detail view
  if (selectedMenu) {
    return (
      <div className="space-y-6">
        {/* Back button and header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedMenu(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menus
            </Button>
          </div>
          <Button onClick={() => setShowAddItem(true)} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Menu info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Menu className="h-5 w-5 text-indigo-600" />
                  {selectedMenu.name}
                </CardTitle>
                <CardDescription>{selectedMenu.description}</CardDescription>
              </div>
              <Badge variant={selectedMenu.enabled ? "default" : "secondary"}>
                {selectedMenu.enabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add item form */}
            {showAddItem && (
              <div className="mb-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <h4 className="font-medium mb-3">Add New Item</h4>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Label (e.g., About)"
                    value={newItemForm.label}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, label: e.target.value }))}
                    className="max-w-[200px]"
                  />
                  <Input
                    placeholder="Path (e.g., /about)"
                    value={newItemForm.path}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, path: e.target.value }))}
                    className="max-w-[250px]"
                  />
                  <Button size="sm" onClick={addMenuItem} disabled={saving}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAddItem(false); setNewItemForm({ label: '', path: '' }); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Items table */}
            {selectedMenu.items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Menu className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No menu items yet. Click "Add Item" to create one.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMenu.items.sort((a, b) => a.order - b.order).map((item, index) => (
                    <TableRow key={item.id} className={!item.enabled ? 'opacity-50' : ''}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleItemEnabled(item.id)}
                          className={`p-1 rounded transition-colors ${item.enabled ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}`}
                          disabled={saving}
                        >
                          {item.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </TableCell>
                      <TableCell>
                        {editingItem?.itemId === item.id ? (
                          <Input
                            value={editingItem.label}
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, label: e.target.value } : null)}
                            className="h-8 w-[150px]"
                          />
                        ) : (
                          <span className={`font-medium ${!item.enabled ? 'line-through' : ''}`}>
                            {item.label}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItem?.itemId === item.id ? (
                          <Input
                            value={editingItem.path}
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, path: e.target.value } : null)}
                            className="h-8 w-[200px]"
                          />
                        ) : (
                          <span className="font-mono text-sm text-muted-foreground">{item.path}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingItem?.itemId === item.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={saveEditingItem} disabled={saving}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveItem(item.id, 'up')}
                              disabled={index === 0 || saving}
                              className="h-8 w-8 p-0"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveItem(item.id, 'down')}
                              disabled={index === selectedMenu.items.length - 1 || saving}
                              className="h-8 w-8 p-0"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingItem({ itemId: item.id, label: item.label, path: item.path })}
                              disabled={saving}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMenuItem(item.id)}
                              disabled={saving}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render main view (list or grid)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Menu className="h-6 w-6 text-indigo-600" />
            Menu Manager
          </h2>
          <p className="text-muted-foreground">Manage navigation menus across your site</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="border rounded-md p-1 flex">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          {/* Create Button */}
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Menu
          </Button>
          {/* Refresh */}
          <Button variant="outline" size="icon" onClick={loadMenus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {menus.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Menu className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
            <p className="text-muted-foreground mb-4">No menus found</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Menu
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Menu Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.map(menu => (
                  <TableRow
                    key={menu.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedMenu(menu)}
                  >
                    <TableCell>
                      <div>
                        <span className="font-medium">{menu.name}</span>
                        {menu.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {menu.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{menu.slug}</code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {menu.items.filter(i => i.enabled).length} / {menu.items.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={menu.enabled ? "default" : "secondary"}>
                        {menu.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedMenu(menu); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Items
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleMenuEnabled(menu); }}>
                            {menu.enabled ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Disable
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          {!CORE_MENUS.includes(menu.id) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); setMenuToDelete(menu); setShowDeleteModal(true); }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map(menu => (
            <Card
              key={menu.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedMenu(menu)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{menu.name}</CardTitle>
                  <Badge variant={menu.enabled ? "default" : "secondary"} className="text-xs">
                    {menu.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <CardDescription className="truncate">{menu.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">{menu.slug}</code>
                  </span>
                  <span>{menu.items.length} items</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setSelectedMenu(menu); }}
                >
                  Manage Items
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleMenuEnabled(menu); }}>
                      {menu.enabled ? 'Disable' : 'Enable'}
                    </DropdownMenuItem>
                    {!CORE_MENUS.includes(menu.id) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setMenuToDelete(menu); setShowDeleteModal(true); }}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Menu Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Menu</DialogTitle>
            <DialogDescription>
              Add a new navigation menu to your site.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Menu Name *</label>
              <Input
                placeholder="e.g., Footer Navigation"
                value={newMenuForm.name}
                onChange={(e) => setNewMenuForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Slug *</label>
              <Input
                placeholder="e.g., footer-nav"
                value={newMenuForm.slug}
                onChange={(e) => setNewMenuForm(prev => ({
                  ...prev,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Input
                placeholder="Brief description of where this menu appears"
                value={newMenuForm.description}
                onChange={(e) => setNewMenuForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setNewMenuForm({ name: '', slug: '', description: '' });
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={createMenu}
              disabled={saving || !newMenuForm.name || !newMenuForm.slug}
            >
              {saving ? 'Creating...' : 'Create Menu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{menuToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setMenuToDelete(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => menuToDelete && deleteMenu(menuToDelete)}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete Menu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
