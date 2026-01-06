import { Timestamp } from 'firebase/firestore';

export interface EventLocation {
  name: string;
  address: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface EventOrganizer {
  name: string;
  email?: string;
  phone?: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  featuredImage?: string;
  category: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  allDay: boolean;
  location: EventLocation;
  organizer: EventOrganizer;
  ticketUrl?: string;
  price?: string;
  featured: boolean;
  submittedBy?: string;
  status: 'pending' | 'approved' | 'published' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EventsSettings {
  enabled: boolean;
  title: string;
  showInNav: boolean;
  defaultView: 'calendar' | 'list';
  allowSubmissions: boolean;
  requireApproval: boolean;
  categories: string[];
  featuredCount: number;
}

// Default categories for events
export const DEFAULT_EVENT_CATEGORIES = [
  'Festival',
  'Concert',
  'Sports',
  'Community',
  'Markets',
  'Arts & Culture',
  'Food & Drink',
  'Family',
  'Outdoor',
  'Nightlife',
  'Workshop',
  'Charity',
];

// Default event settings
export const DEFAULT_EVENTS_SETTINGS: EventsSettings = {
  enabled: true,
  title: 'Community Events',
  showInNav: true,
  defaultView: 'list',
  allowSubmissions: true,
  requireApproval: true,
  categories: DEFAULT_EVENT_CATEGORIES,
  featuredCount: 3,
};
