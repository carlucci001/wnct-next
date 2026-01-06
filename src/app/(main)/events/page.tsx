"use client";

import { useState, useEffect, useMemo } from 'react';
import { Settings, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { EventsList } from '@/components/events/EventsList';
import { EventsSidebar } from '@/components/events/EventsSidebar';
import { EventFilters, DateFilter, ViewMode } from '@/components/events/EventFilters';
import { EventConfigModal } from '@/components/events/EventConfigModal';
import { Event, EventsSettings, DEFAULT_EVENTS_SETTINGS } from '@/types/event';
import {
  getPublishedEvents,
  getUpcomingEvents,
  getEventsSettings,
  isEventToday,
  isEventThisWeekend,
} from '@/lib/events';
import { Timestamp } from 'firebase/firestore';

const EVENTS_PER_PAGE = 10;

export default function EventsPage() {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [settings, setSettings] = useState<EventsSettings>(DEFAULT_EVENTS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [visibleCount, setVisibleCount] = useState(EVENTS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);

  const isAdmin =
    userProfile?.role &&
    ['admin', 'business-owner', 'editor-in-chief'].includes(userProfile.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, upcomingData, settingsData] = await Promise.all([
        getPublishedEvents(),
        getUpcomingEvents(5),
        getEventsSettings(),
      ]);
      setEvents(eventsData);
      setUpcomingEvents(upcomingData);
      if (settingsData) {
        setSettings(settingsData);
        setViewMode(settingsData.defaultView);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location.name.toLowerCase().includes(query) ||
          event.location.city.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (dateFilter === 'today') {
      result = result.filter((event) => isEventToday(event.startDate));
    } else if (dateFilter === 'weekend') {
      result = result.filter((event) => isEventThisWeekend(event.startDate));
    } else if (dateFilter === 'month') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      result = result.filter((event) => {
        const eventDate = event.startDate?.toDate?.();
        return (
          eventDate &&
          eventDate.getMonth() === currentMonth &&
          eventDate.getFullYear() === currentYear
        );
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((event) => event.category === categoryFilter);
    }

    return result;
  }, [events, searchQuery, dateFilter, categoryFilter]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEvents.length;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + EVENTS_PER_PAGE);
      setLoadingMore(false);
    }, 500);
  };

  const handleCategorySelect = (category: string) => {
    setCategoryFilter(category);
    setVisibleCount(EVENTS_PER_PAGE);
  };

  const handleSettingsSave = (newSettings: EventsSettings) => {
    setSettings(newSettings);
  };

  return (
    <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN: Main Content */}
        <div className="lg:w-2/3 flex flex-col w-full">
          {/* Header */}
          <div className="mb-6 flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                {settings.title}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Discover local events, festivals, and community gatherings
              </p>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfigOpen(true)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Settings size={20} />
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search events by name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <EventFilters
              dateFilter={dateFilter}
              categoryFilter={categoryFilter}
              viewMode={viewMode}
              categories={settings.categories}
              onDateFilterChange={(filter) => {
                setDateFilter(filter);
                setVisibleCount(EVENTS_PER_PAGE);
              }}
              onCategoryFilterChange={handleCategorySelect}
              onViewModeChange={setViewMode}
              showViewToggle={true}
            />
          </div>

          {/* Results count */}
          {!loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {filteredEvents.length === 0
                ? 'No events found'
                : filteredEvents.length === 1
                ? '1 event found'
                : `${filteredEvents.length} events found`}
            </p>
          )}

          {/* Events List or Calendar */}
          {viewMode === 'list' ? (
            <EventsList
              events={visibleEvents}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              loadingMore={loadingMore}
              emptyMessage={
                searchQuery || dateFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No events match your filters'
                  : 'No upcoming events'
              }
            />
          ) : (
            // Calendar View Placeholder
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Calendar View
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Full calendar view is coming soon. Switch to list view to see all events.
              </p>
              <Button variant="outline" onClick={() => setViewMode('list')}>
                Switch to List View
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="lg:w-1/3 hidden lg:flex flex-col sticky top-24 space-y-6">
          <EventsSidebar
            upcomingEvents={upcomingEvents}
            categories={settings.categories}
            selectedCategory={categoryFilter}
            onCategorySelect={handleCategorySelect}
            loading={loading}
            eventsForCalendar={events}
          />
        </div>
      </div>

      {/* Config Modal */}
      <EventConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onSave={handleSettingsSave}
      />
    </div>
  );
}
