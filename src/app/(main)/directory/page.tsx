import { Metadata } from 'next';
import DirectoryClient from './DirectoryClient';

export const metadata: Metadata = {
  title: 'WNC Business Directory | Find Local Services & Shops in Western North Carolina',
  description: 'Explore the WNC Times Business Directory. Discover the best local shops, services, restaurants, and professionals in Western North Carolina. Support local business!',
  keywords: 'WNC Business Directory, Asheville Businesses, Local Services WNC, Shop Local North Carolina, WNC Restaurants',
  openGraph: {
    title: 'WNC Business Directory | Find Local Services & Shops in Western North Carolina',
    description: 'Support local! Discover the best businesses and services in Western North Carolina with our comprehensive directory.',
    url: 'https://wnctimes.com/directory',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WNC Business Directory',
    description: 'Find local services and shops in Western North Carolina. Support your community.',
  },
  alternates: {
    canonical: 'https://wnctimes.com/directory',
  },
};

export default function Page() {
  return <DirectoryClient />;
}
