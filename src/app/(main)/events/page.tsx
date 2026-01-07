'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventsList } from '@/components/events/EventsList';
import { EventsCalendar } from '@/components/events/EventsCalendar';
import { EventFilters } from '@/components/events/EventFilters';
import { EventsSidebar } from '@/components/events/EventsSidebar';
import { EventConfigModal } from '@/components/events/EventConfigModal';
import { getEvents } from '@/lib/events';
import { Event } from '@/types/event';
import Link from 'next/link';

export default function EventsPage() {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [configOpen, setConfigOpen] = useState(false);

  const isAdmin = userProfile?.role && ['admin', 'editor-in-chief'].includes(userProfile.role);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      try {
        const data = await getEvents({ status: 'published' });
        setEvents(data);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Filter events client-side for better performance on search/category change
  const filteredEvents = events.filter(event => {
    const matchesCategory = category === 'all' || event.category === category;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Header section with admin actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-black mb-2 flex items-center gap-3">
            <CalendarIcon className="text-primary hidden md:block" size={40} />
            Community Events
          </h1>
          <p className="text-muted-foreground text-lg">Discover festivals, concerts, and local gatherings in WNC.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" size="icon" onClick={() => setConfigOpen(true)} className="rounded-full h-11 w-11 shadow-sm">
              <Settings size={20} />
            </Button>
          )}
          <Button className="font-bold rounded-full px-6 h-11 shadow-lg" asChild>
            <Link href="/events/submit">
              <Plus size={18} className="mr-2" /> Submit Event
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Content (2/3) */}
        <div className="lg:w-2/3">
          <EventFilters 
            currentCategory={category}
            setCategory={setCategory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
          
          {viewMode === 'list' ? (
            <EventsList events={filteredEvents} loading={loading} />
          ) : (
            <EventsCalendar events={filteredEvents} loading={loading} />
          )}
        </div>

        {/* Sidebar (1/3) */}
        <aside className="lg:w-1/3">
          <EventsSidebar />
        </aside>
      </div>

      <EventConfigModal 
        open={configOpen} 
        onClose={() => setConfigOpen(false)} 
      />
    </div>
  );
}
