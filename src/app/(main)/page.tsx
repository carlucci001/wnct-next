import { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'WNC Times | Local News, Sports, and Events in Western North Carolina',
  description: 'WNC Times is your premier source for local news, community events, sports, and business updates in Western North Carolina. Engaging our community with integrity.',
  keywords: 'Western North Carolina News, WNC News, Asheville News, Local News North Carolina, WNC Events, WNC Sports',
  openGraph: {
    title: 'WNC Times | Local News, Sports, and Events in Western North Carolina',
    description: 'Engaging our community with integrity. Your source for local news in Western North Carolina.',
    url: 'https://wnctimes.com',
    siteName: 'WNC Times',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WNC Times | Local News, Sports, and Events in Western North Carolina',
    description: 'Engaging our community with integrity. Your source for local news in Western North Carolina.',
  },
  alternates: {
    canonical: 'https://wnctimes.com',
  },
};

export default function Home() {
  return <HomeClient />;
}