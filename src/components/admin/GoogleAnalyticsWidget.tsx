'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Eye, MousePointerClick, Clock, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AnalyticsData {
  realtime: {
    activeUsers: number;
  };
  today: {
    visitors: number;
    pageviews: number;
    visitorsTrend: number;
    pageviewsTrend: number;
  };
  last7Days: {
    totalVisitors: number;
    totalPageviews: number;
    avgSessionDuration: string;
    bounceRate: string;
  };
  topPages: Array<{
    title: string;
    path: string;
    views: number;
  }>;
  trafficSources: Array<{
    source: string;
    sessions: number;
  }>;
}

export default function GoogleAnalyticsWidget() {
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyticsConfig();
  }, []);

  async function loadAnalyticsConfig() {
    try {
      // Check site-config for Analytics ID
      const siteConfigDoc = await getDoc(doc(getDb(), 'settings', 'site-config'));
      if (siteConfigDoc.exists()) {
        const configData = siteConfigDoc.data();
        const gaId = configData.seo?.googleAnalyticsId || '';
        setAnalyticsId(gaId || null);

        if (gaId) {
          // If Analytics is configured, fetch stats
          await fetchAnalyticsData();
        }
      }
    } catch (err) {
      console.error('Failed to load Google Analytics config:', err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalyticsData() {
    try {
      setError(null);
      const response = await fetch('/api/analytics/stats');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to fetch analytics');
      }

      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  }

  const openGoogleAnalytics = () => {
    window.open('https://analytics.google.com/', '_blank');
  };

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <TrendingUp size={12} />+{value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <TrendingDown size={12} />{value}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <Minus size={12} />0%
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            Google Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsId) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} className="text-amber-600" />
            Google Analytics
          </CardTitle>
          <CardDescription>Track visitor behavior and site performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Google Analytics is not configured yet. Add your Measurement ID to start collecting data.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin?tab=site-config'}>
            Configure Analytics
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={20} className="text-amber-600" />
                Google Analytics
              </CardTitle>
              <CardDescription>
                Analytics ID: <Badge variant="secondary" className="ml-1 font-mono text-xs">{analyticsId}</Badge>
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw size={14} className="mr-2" />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <AlertCircle size={16} className="text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Setup Required</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{error}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Please follow the setup guide in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">GOOGLE_ANALYTICS_SETUP.md</code> to configure the Google Analytics Data API.
          </p>
          <Button variant="outline" size="sm" onClick={openGoogleAnalytics}>
            <ExternalLink size={14} className="mr-2" />
            Open Google Analytics
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            Google Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 dark:border-blue-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-600" />
              Google Analytics
              {data.realtime.activeUsers > 0 && (
                <Badge variant="default" className="bg-green-600 ml-2">
                  <div className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse" />
                  {data.realtime.activeUsers} active now
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Live visitor data from your site
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users size={12} />
              Visitors Today
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{data.today.visitors.toLocaleString()}</div>
              <TrendIndicator value={data.today.visitorsTrend} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Eye size={12} />
              Pageviews Today
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{data.today.pageviews.toLocaleString()}</div>
              <TrendIndicator value={data.today.pageviewsTrend} />
            </div>
          </div>
        </div>

        {/* Last 7 Days Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users size={12} />
              7-Day Visitors
            </div>
            <div className="text-lg font-semibold">{data.last7Days.totalVisitors.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Eye size={12} />
              7-Day Views
            </div>
            <div className="text-lg font-semibold">{data.last7Days.totalPageviews.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock size={12} />
              Avg. Session
            </div>
            <div className="text-lg font-semibold">{data.last7Days.avgSessionDuration}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <MousePointerClick size={12} />
              Bounce Rate
            </div>
            <div className="text-lg font-semibold">{data.last7Days.bounceRate}%</div>
          </div>
        </div>

        {/* Top Pages & Traffic Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Pages */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-sm font-semibold mb-2">Top Pages (7 days)</div>
            <div className="space-y-2">
              {data.topPages.slice(0, 5).map((page, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1 mr-2" title={page.title}>
                    {page.title || page.path}
                  </span>
                  <Badge variant="secondary" className="shrink-0">{page.views}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-sm font-semibold mb-2">Traffic Sources (7 days)</div>
            <div className="space-y-2">
              {data.trafficSources.slice(0, 5).map((source, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="capitalize">{source.source}</span>
                  <Badge variant="secondary">{source.sessions}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t">
          <Button onClick={openGoogleAnalytics} variant="outline" size="sm" className="w-full">
            <ExternalLink size={14} className="mr-2" />
            View Full Analytics Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
