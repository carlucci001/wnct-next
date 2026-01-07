'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event } from '@/types/event';
import Link from 'next/link';

interface EventsCalendarProps {
  events: Event[];
  loading: boolean;
}

export function EventsCalendar({ events, loading }: EventsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });

  const numDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const days = Array.from({ length: numDays }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  // Filter events for the current month/year
  const monthlyEvents = events.filter(event => {
    const eventDate = event.startDate.toDate();
    return eventDate.getMonth() === month && eventDate.getFullYear() === year;
  });

  const getEventsForDay = (day: number) => {
    return monthlyEvents.filter(event => event.startDate.toDate().getDate() === day);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-muted rounded w-full" />
        <div className="grid grid-cols-7 gap-px bg-muted h-96 rounded overflow-hidden" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <h2 className="text-xl font-bold font-serif flex items-center gap-2">
          <CalendarIcon className="text-primary" size={20} />
          {monthName} {year}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9 rounded-full">
            <ChevronLeft size={18} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="rounded-full">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9 rounded-full">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 bg-muted/10 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 bg-muted/20 gap-px">
        {emptyDays.map(i => (
          <div key={`empty-${i}`} className="bg-card min-h-[120px] p-2 opacity-50" />
        ))}
        
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
          
          return (
            <div 
              key={day} 
              className={`bg-card min-h-[120px] p-2 hover:bg-muted/10 transition-colors ${
                isToday ? 'relative ring-1 ring-inset ring-primary/20 bg-primary/5' : ''
              }`}
            >
              <span className={`text-sm font-bold inline-block w-7 h-7 flex items-center justify-center rounded-full mb-2 ${
                isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}>
                {day}
              </span>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.slug}`}
                    className="block p-1 text-[10px] leading-tight bg-primary/10 text-primary-foreground border-l-2 border-primary rounded-r bg-primary hover:bg-primary/90 transition-colors truncate"
                    title={event.title}
                  >
                    <span className="font-bold">{event.title}</span>
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground font-bold px-1">
                    + {dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
