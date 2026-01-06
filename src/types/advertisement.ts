import { Timestamp } from 'firebase/firestore';

export type AdType = 'banner' | 'sidebar' | 'sponsored' | 'native';
export type AdStatus = 'draft' | 'active' | 'paused' | 'expired';

export interface Advertisement {
  id: string;
  name: string;
  type: AdType;
  placement: string;
  size: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  advertiserId?: string;
  campaignName?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  impressions: number;
  clicks: number;
  status: AdStatus;
  priority: number;
  createdAt: Timestamp;
}

export interface AdvertisingSettings {
  enabled: boolean;
  showAdsToLoggedIn: boolean;
  headerBannerEnabled: boolean;
  sidebarAdsEnabled: boolean;
  inArticleAdsEnabled: boolean;
  adFrequency: number;
  defaultAdImage: string;
}

// Common ad sizes
export const AD_SIZES = {
  LEADERBOARD: '728x90',
  MEDIUM_RECTANGLE: '300x250',
  WIDE_SKYSCRAPER: '160x600',
  HALF_PAGE: '300x600',
  MOBILE_BANNER: '320x50',
  LARGE_LEADERBOARD: '970x90',
  BILLBOARD: '970x250',
} as const;

// Common ad placements
export const AD_PLACEMENTS = {
  HEADER: 'header',
  SIDEBAR_TOP: 'sidebar-top',
  SIDEBAR_MIDDLE: 'sidebar-middle',
  SIDEBAR_BOTTOM: 'sidebar-bottom',
  ARTICLE_INLINE: 'article-inline',
  FOOTER: 'footer',
} as const;
