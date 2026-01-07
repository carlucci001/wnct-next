'use client';

import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, Plus, Trash2, Edit, Search,
  CheckCircle, XCircle, Star, ExternalLink, MoreHorizontal,
  ChevronLeft, ChevronRight, Database, MapPin, Clock, Users,
  Ticket, AlertCircle
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Event, DEFAULT_EVENT_CATEGORIES } from '@/types/event';
import {
  getEvents, createEvent, updateEvent, deleteEvent,
  deleteEvents, updateEventsStatus, generateSlug
} from '@/lib/events';
import { Timestamp } from 'firebase/firestore';

export default function EventsAdmin() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Event['status']>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startDate: '',
    startTime: '12:00',
    endDate: '',
    endTime: '13:00',
    allDay: false,
    locationName: '',
    address: '',
    city: 'Asheville',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    ticketUrl: '',
    price: '',
    featured: false,
    status: 'published' as Event['status'],
    featuredImage: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  // Filtering
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / pageSize);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset form
  function resetForm() {
    setFormData({
      title: '',
      description: '',
      category: DEFAULT_EVENT_CATEGORIES[0],
      startDate: new Date().toISOString().split('T')[0],
      startTime: '12:00',
      endDate: '',
      endTime: '13:00',
      allDay: false,
      locationName: '',
      address: '',
      city: 'Asheville',
      organizerName: '',
      organizerEmail: '',
      organizerPhone: '',
      ticketUrl: '',
      price: '',
      featured: false,
      status: 'published',
      featuredImage: '',
    });
  }

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
    if (selectedIds.size === paginatedEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedEvents.map((e) => e.id)));
    }
  }

  // Add event
  async function handleAdd() {
    if (!formData.title || !formData.category || !formData.startDate) {
      toast.error('Title, category and start date are required');
      return;
    }

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = formData.endDate ? new Date(`${formData.endDate}T${formData.endTime}`) : undefined;

      await createEvent({
        title: formData.title,
        slug: generateSlug(formData.title),
        description: formData.description,
        category: formData.category,
        startDate: Timestamp.fromDate(startDateTime),
        endDate: endDateTime ? Timestamp.fromDate(endDateTime) : undefined,
        allDay: formData.allDay,
        location: {
          name: formData.locationName,
          address: formData.address,
          city: formData.city,
        },
        organizer: {
          name: formData.organizerName,
          email: formData.organizerEmail || undefined,
          phone: formData.organizerPhone || undefined,
        },
        ticketUrl: formData.ticketUrl || undefined,
        price: formData.price || undefined,
        featured: formData.featured,
        status: formData.status,
        featuredImage: formData.featuredImage || undefined,
      });

      toast.success('Event added successfully');
      setShowAddModal(false);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    }
  }

  // Edit event
  function openEditModal(event: Event) {
    setEditingEvent(event);
    const startObj = event.startDate.toDate();
    const endObj = event.endDate?.toDate();

    setFormData({
      title: event.title,
      description: event.description || '',
      category: event.category,
      startDate: startObj.toISOString().split('T')[0],
      startTime: startObj.toTimeString().split(' ')[0].substring(0, 5),
      endDate: endObj ? endObj.toISOString().split('T')[0] : '',
      endTime: endObj ? endObj.toTimeString().split(' ')[0].substring(0, 5) : '13:00',
      allDay: event.allDay,
      locationName: event.location.name,
      address: event.location.address,
      city: event.location.city,
      organizerName: event.organizer.name,
      organizerEmail: event.organizer.email || '',
      organizerPhone: event.organizer.phone || '',
      ticketUrl: event.ticketUrl || '',
      price: event.price || '',
      featured: event.featured,
      status: event.status,
      featuredImage: event.featuredImage || '',
    });
    setShowEditModal(true);
  }

  async function handleEdit() {
    if (!editingEvent) return;

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = formData.endDate ? new Date(`${formData.endDate}T${formData.endTime}`) : undefined;

      await updateEvent(editingEvent.id, {
        title: formData.title,
        slug: generateSlug(formData.title),
        description: formData.description,
        category: formData.category,
        startDate: Timestamp.fromDate(startDateTime),
        endDate: endDateTime ? Timestamp.fromDate(endDateTime) : undefined,
        allDay: formData.allDay,
        location: {
          name: formData.locationName,
          address: formData.address,
          city: formData.city,
        },
        organizer: {
          name: formData.organizerName,
          email: formData.organizerEmail || undefined,
          phone: formData.organizerPhone || undefined,
        },
        ticketUrl: formData.ticketUrl || undefined,
        price: formData.price || undefined,
        featured: formData.featured,
        status: formData.status,
        featuredImage: formData.featuredImage || undefined,
      });

      toast.success('Event updated successfully');
      setShowEditModal(false);
      setEditingEvent(null);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
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
        await deleteEvent(deletingIds[0]);
      } else {
        await deleteEvents(deletingIds);
      }
      toast.success(`Deleted ${deletingIds.length} event(s)`);
      setShowDeleteModal(false);
      setDeletingIds([]);
      setSelectedIds(new Set());
      loadEvents();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  }

  async function handleBulkStatusChange(status: Event['status']) {
    try {
      await updateEventsStatus(Array.from(selectedIds), status);
      toast.success(`Updated ${selectedIds.size} event(s) to ${status}`);
      setSelectedIds(new Set());
      loadEvents();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  }

  // Seeding
  async function handleSeedData() {
    setLoading(true);
    try {
      const resp = await fetch('/api/events/seed');
      const data = await resp.json();
      if (data.success) {
        toast.success(data.message);
        loadEvents();
      } else {
        toast.error(data.error || 'Failed to seed');
      }
    } catch {
      toast.error('Failed to seed events');
    } finally {
      setLoading(false);
    }
  }

  const statusBadge = (status: Event['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Published</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Approved</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Cancelled</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Event Management
            </CardTitle>
            <CardDescription>Manage community event calendar</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSeedData} disabled={loading}>
              <Database className="h-4 w-4 mr-2" /> Seed Samples
            </Button>
            <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Event
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
              placeholder="Search events..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DEFAULT_EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-muted p-3 rounded-lg mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('published')}>
              <CheckCircle className="h-4 w-4 mr-1" /> Publish
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('cancelled')}>
              <XCircle className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => openDeleteModal(Array.from(selectedIds))}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border rounded-lg border-dashed">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No events found</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === paginatedEvents.length && paginatedEvents.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(event.id)}
                          onChange={() => toggleSelect(event.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {event.title}
                            {event.featured && (
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin size={10} /> {event.location.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {event.startDate.toDate().toLocaleDateString()}
                        </div>
                        {!event.allDay && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock size={10} /> {event.startDate.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.category}</Badge>
                      </TableCell>
                      <TableCell>{statusBadge(event.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(event)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/events/${event.slug}`, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDeleteModal([event.id])}
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

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredEvents.length)} of {filteredEvents.length}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm">Page {currentPage} of {totalPages || 1}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={(v) => { if(!v) { setShowAddModal(false); setShowEditModal(false); }}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditModal ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2 border-b pb-2">
                <CalendarIcon className="h-4 w-4 text-primary" /> Basic Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_EVENT_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Featured Image URL</Label>
                <Input id="image" value={formData.featuredImage} onChange={(e) => setFormData({...formData, featuredImage: e.target.value})} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description *</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                </div>
                {!formData.allDay && (
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                </div>
                {!formData.allDay && (
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 py-2">
                <Switch checked={formData.allDay} onCheckedChange={(v) => setFormData({...formData, allDay: v})} />
                <Label>All Day Event</Label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2 border-b pb-2">
                <MapPin className="h-4 w-4 text-primary" /> Venue & Logistics
              </h3>
              
              <div className="space-y-2">
                <Label>Venue Name *</Label>
                <Input value={formData.locationName} onChange={(e) => setFormData({...formData, locationName: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Price / Admission</Label>
                <Input value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="e.g. $15 or Free" />
              </div>

              <div className="space-y-2">
                <Label>Ticket / RSVP URL</Label>
                <Input value={formData.ticketUrl} onChange={(e) => setFormData({...formData, ticketUrl: e.target.value})} placeholder="https://..." />
              </div>

              <h3 className="font-bold flex items-center gap-2 border-b pb-2 pt-4">
                <Users className="h-4 w-4 text-primary" /> Organizer
              </h3>
              
              <div className="space-y-2">
                <Label>Contact Person / Org</Label>
                <Input value={formData.organizerName} onChange={(e) => setFormData({...formData, organizerName: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.organizerEmail} onChange={(e) => setFormData({...formData, organizerEmail: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={formData.organizerPhone} onChange={(e) => setFormData({...formData, organizerPhone: e.target.value})} />
                </div>
              </div>

              <h3 className="font-bold flex items-center gap-2 border-b pb-2 pt-4">
                <AlertCircle className="h-4 w-4 text-primary" /> Publication Settings
              </h3>
              
              <div className="flex items-center justify-between py-2 border rounded-lg px-4 bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Featured Event</Label>
                  <p className="text-xs text-muted-foreground">Highlight on main page</p>
                </div>
                <Switch checked={formData.featured} onCheckedChange={(v) => setFormData({...formData, featured: v})} />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</Button>
            <Button onClick={showEditModal ? handleEdit : handleAdd}>
              {showEditModal ? 'Save Event' : 'Add Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingIds.length} event(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
