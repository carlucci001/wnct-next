'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, Trash2, Edit, Search,
  MoreHorizontal, ExternalLink, ChevronLeft, ChevronRight, MapPin, Star
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
import { getEvents, createEvent, updateEvent, deleteEvent, generateEventSlug } from '@/lib/events';
import { Timestamp } from 'firebase/firestore';

export default function EventsAdmin() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'published' | 'cancelled'>('all');
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
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    locationName: '',
    locationAddress: '',
    locationCity: 'Asheville',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    ticketUrl: '',
    price: '',
    featured: false,
    status: 'pending' as Event['status'],
  });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await getEvents({ status: 'all' });
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
      e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location.name.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Reset form
  function resetForm() {
    setFormData({
      title: '',
      description: '',
      category: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      allDay: false,
      locationName: '',
      locationAddress: '',
      locationCity: 'Asheville',
      organizerName: '',
      organizerEmail: '',
      organizerPhone: '',
      ticketUrl: '',
      price: '',
      featured: false,
      status: 'pending',
    });
  }

  // Add event
  async function handleAdd() {
    if (!formData.title || !formData.category || !formData.startDate) {
      toast.error('Title, category, and start date are required');
      return;
    }

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`);
      const endDateTime = formData.endDate
        ? new Date(`${formData.endDate}T${formData.endTime || '23:59'}`)
        : undefined;

      await createEvent({
        title: formData.title,
        slug: generateEventSlug(formData.title),
        description: formData.description,
        category: formData.category,
        startDate: Timestamp.fromDate(startDateTime),
        endDate: endDateTime ? Timestamp.fromDate(endDateTime) : undefined,
        allDay: formData.allDay,
        location: {
          name: formData.locationName,
          address: formData.locationAddress,
          city: formData.locationCity,
        },
        organizer: {
          name: formData.organizerName,
          email: formData.organizerEmail,
          phone: formData.organizerPhone,
        },
        ticketUrl: formData.ticketUrl,
        price: formData.price,
        featured: formData.featured,
        status: formData.status,
      });
      toast.success('Event created successfully');
      setShowAddModal(false);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to create event');
    }
  }

  // Edit event
  function openEditModal(event: Event) {
    setEditingEvent(event);
    const startDate = event.startDate instanceof Timestamp ? event.startDate.toDate() : new Date(event.startDate);
    const endDate = event.endDate
      ? (event.endDate instanceof Timestamp ? event.endDate.toDate() : new Date(event.endDate))
      : null;

    setFormData({
      title: event.title,
      description: event.description || '',
      category: event.category,
      startDate: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endDate: endDate ? endDate.toISOString().split('T')[0] : '',
      endTime: endDate ? endDate.toTimeString().slice(0, 5) : '',
      allDay: event.allDay,
      locationName: event.location.name,
      locationAddress: event.location.address,
      locationCity: event.location.city,
      organizerName: event.organizer.name,
      organizerEmail: event.organizer.email || '',
      organizerPhone: event.organizer.phone || '',
      ticketUrl: event.ticketUrl || '',
      price: event.price || '',
      featured: event.featured,
      status: event.status,
    });
    setShowEditModal(true);
  }

  async function handleEdit() {
    if (!editingEvent) return;

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`);
      const endDateTime = formData.endDate
        ? new Date(`${formData.endDate}T${formData.endTime || '23:59'}`)
        : undefined;

      await updateEvent(editingEvent.id, {
        title: formData.title,
        slug: generateEventSlug(formData.title),
        description: formData.description,
        category: formData.category,
        startDate: Timestamp.fromDate(startDateTime),
        endDate: endDateTime ? Timestamp.fromDate(endDateTime) : undefined,
        allDay: formData.allDay,
        location: {
          name: formData.locationName,
          address: formData.locationAddress,
          city: formData.locationCity,
        },
        organizer: {
          name: formData.organizerName,
          email: formData.organizerEmail,
          phone: formData.organizerPhone,
        },
        ticketUrl: formData.ticketUrl,
        price: formData.price,
        featured: formData.featured,
        status: formData.status,
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
      for (const id of deletingIds) {
        await deleteEvent(id);
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

  const statusBadge = (status: Event['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Published</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Cancelled</Badge>;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-pink-600" />
              Events
            </CardTitle>
            <CardDescription>Manage community events and calendar listings</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Event
          </Button>
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
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
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
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => openDeleteModal(Array.from(selectedIds))}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No events found</p>
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
                        checked={selectedIds.size === paginatedEvents.length && paginatedEvents.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
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
                          <div className="font-medium">{event.title}</div>
                          <Badge variant="outline" className="mt-1">{event.category}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          {formatDate(event.startDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {event.location.name || event.location.city}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(event.status)}</TableCell>
                      <TableCell>
                        {event.featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </TableCell>
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
                            {event.status === 'published' && (
                              <DropdownMenuItem onClick={() => window.open(`/events/${event.slug}`, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                            )}
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

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredEvents.length)} of {filteredEvents.length}
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
          setEditingEvent(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditModal ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogDescription>
              {showEditModal ? 'Update event details' : 'Create a new community event'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the event"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_EVENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Event['status'] })}>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  disabled={formData.allDay}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  disabled={formData.allDay}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allDay"
                checked={formData.allDay}
                onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked })}
              />
              <Label htmlFor="allDay">All Day Event</Label>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Location</Label>
              <div className="grid gap-3 mt-2">
                <Input
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  placeholder="Venue name"
                />
                <Input
                  value={formData.locationAddress}
                  onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                  placeholder="Street address"
                />
                <Input
                  value={formData.locationCity}
                  onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })}
                  placeholder="City"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Organizer</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Input
                  value={formData.organizerName}
                  onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                  placeholder="Name"
                />
                <Input
                  value={formData.organizerEmail}
                  onChange={(e) => setFormData({ ...formData, organizerEmail: e.target.value })}
                  placeholder="Email"
                  type="email"
                />
                <Input
                  value={formData.organizerPhone}
                  onChange={(e) => setFormData({ ...formData, organizerPhone: e.target.value })}
                  placeholder="Phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticketUrl">Ticket URL</Label>
                <Input
                  id="ticketUrl"
                  value={formData.ticketUrl}
                  onChange={(e) => setFormData({ ...formData, ticketUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Free, $10, $10-$25"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label htmlFor="featured">Featured Event</Label>
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
              {showEditModal ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event{deletingIds.length > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingIds.length} event{deletingIds.length > 1 ? 's' : ''}? This action cannot be undone.
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
