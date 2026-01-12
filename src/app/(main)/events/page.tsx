import { Metadata } from 'next';
import EventsClient from './EventsClient';

export const metadata: Metadata = {
  title: 'WNC Community Events Calendar | Festivals, Concerts & Gatherings',
  description: 'Explore our Western North Carolina community events calendar. Find local festivals, concerts, workshops, and gatherings in WNC. Submit your own event today!',
  keywords: 'WNC Events, Asheville Events, Western North Carolina Festivals, Community Calendar WNC, Local Events NC',
  openGraph: {
    title: 'WNC Community Events Calendar | Festivals, Concerts & Gatherings',
    description: 'Discover the best local events in Western North Carolina. From festivals to concerts, stay connected with your community.',
    url: 'https://wnctimes.com/events',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WNC Community Events Calendar',
    description: 'Discover the best local events in Western North Carolina. Join festivals, concerts, and more.',
  },
  alternates: {
    canonical: 'https://wnctimes.com/events',
  },
};

export default function Page() {
  return <EventsClient />;
}
