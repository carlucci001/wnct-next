import { Timestamp } from 'firebase/firestore';

export interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface BusinessHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  address: BusinessAddress;
  coordinates?: {
    lat: number;
    lng: number;
  };
  phone?: string;
  email?: string;
  website?: string;
  hours?: BusinessHours;
  images: string[];
  logo?: string;
  featured: boolean;
  verified: boolean;
  ownerId?: string;
  status: 'pending' | 'active' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DirectorySettings {
  enabled: boolean;
  title: string;
  showInNav: boolean;
  categoriesEnabled: string[];
  featuredCount: number;
}

// Default categories for the directory (matches seed route categories)
export const DEFAULT_BUSINESS_CATEGORIES = [
  'Restaurants & Dining',
  'Shopping & Retail',
  'Health & Medical',
  'Professional Services',
  'Home Services',
  'Automotive',
  'Beauty & Personal Care',
  'Entertainment & Recreation',
  'Real Estate',
  'Education & Childcare',
];

// Default areas/locations
export const DEFAULT_AREAS = [
  'Downtown',
  'North Asheville',
  'South Asheville',
  'West Asheville',
  'East Asheville',
  'Biltmore',
  'River Arts District',
  'Black Mountain',
  'Weaverville',
  'Hendersonville',
];
