import { Timestamp } from 'firebase/firestore';

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
  location: {
    name: string;
    address: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  organizer: {
    name: string;
    email?: string;
    phone?: string;
  };
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

export const DEFAULT_EVENT_CATEGORIES = [
  'Festival',
  'Concert',
  'Sports',
  'Community',
  'Markets',
  'Food & Drink',
  'Arts & Culture',
  'Workshops',
  'Nightlife',
  'Other'
];
