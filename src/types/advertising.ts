import { Timestamp } from 'firebase/firestore';

export type AdPosition = 
  | 'header_main'    // The 728x90 next to the logo
  | 'sidebar_top'    // Standard box in sidebar
  | 'sidebar_sticky' // Sticky ad at bottom of sidebar
  | 'article_inline' // Injected into article content
  | 'footer_wide'    // Full width above footer
  | 'popup_overlay'; // Urgent/Special overlays

export type AdType = 'image' | 'script' | 'html';

export type AdStatus = 'active' | 'scheduled' | 'paused' | 'expired' | 'pending_payment';

export interface AdCampaign {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  title: string;
  type: AdType;
  position: AdPosition;
  
  // Media
  imageUrl?: string;
  targetUrl?: string;
  htmlContent?: string;
  
  // Scheduling
  startDate: Timestamp | Date;
  endDate?: Timestamp | Date;
  status: AdStatus;
  
  // Stats
  impressions: number;
  clicks: number;
  
  // Financial (Internal)
  budget?: number;
  spent?: number;
  
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface AdStats {
  date: string;
  impressions: number;
  clicks: number;
}

export const AD_POSITIONS: { value: AdPosition; label: string; dimensions: string }[] = [
  { value: 'header_main', label: 'Header Main Banner', dimensions: '728x90' },
  { value: 'sidebar_top', label: 'Sidebar Top Box', dimensions: '300x250' },
  { value: 'sidebar_sticky', label: 'Sidebar Sticky', dimensions: '300x600' },
  { value: 'article_inline', label: 'In-Article Banner', dimensions: 'Adaptive' },
  { value: 'footer_wide', label: 'Footer Wide Banner', dimensions: '970x90' },
  { value: 'popup_overlay', label: 'Splash Popup', dimensions: '800x600' },
];
