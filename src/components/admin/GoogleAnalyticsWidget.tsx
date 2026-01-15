'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, ExternalLink, TrendingUp, Users, Eye, MousePointerClick } from 'lucide-react';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function GoogleAnalyticsWidget() {
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalyticsId() {
      try {
        // Check site-config first
        const siteConfigDoc = await getDoc(doc(getDb(), 'settings', 'site-config'));
        if (siteConfigDoc.exists()) {
          const data = siteConfigDoc.data();
          const gaId = data.seo?.googleAnalyticsId || '';
          setAnalyticsId(gaId || null);
        }
      } catch (error) {
        console.error('Failed to load Google Analytics ID:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAnalyticsId();
  }, []);

  const openGoogleAnalytics = () => {
    window.open('https://analytics.google.com/', '_blank');
  };

  const openRealtimeReport = () => {
    window.open('https://analytics.google.com/analytics/web/#/realtime', '_blank');
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
          <div className="text-sm text-muted-foreground">Loading...</div>
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

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 dark:border-blue-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-600" />
              Google Analytics
            </CardTitle>
            <CardDescription>
              Analytics ID: <Badge variant="secondary" className="ml-1 font-mono text-xs">{analyticsId}</Badge>
            </CardDescription>
          </div>
          <Badge variant="default" className="bg-green-600">
            <div className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse" />
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info message */}
        <div className="text-sm text-muted-foreground">
          Your site is actively collecting visitor data. View detailed reports in Google Analytics.
        </div>

        {/* Quick stats placeholder */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users size={12} />
              Visitors
            </div>
            <div className="text-sm font-medium text-muted-foreground">View in GA</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Eye size={12} />
              Pageviews
            </div>
            <div className="text-sm font-medium text-muted-foreground">View in GA</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <MousePointerClick size={12} />
              Bounce Rate
            </div>
            <div className="text-sm font-medium text-muted-foreground">View in GA</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp size={12} />
              Avg. Time
            </div>
            <div className="text-sm font-medium text-muted-foreground">View in GA</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={openRealtimeReport} size="sm" className="flex-1">
            <Eye size={14} className="mr-2" />
            View Realtime
          </Button>
          <Button onClick={openGoogleAnalytics} variant="outline" size="sm" className="flex-1">
            <ExternalLink size={14} className="mr-2" />
            Open Dashboard
          </Button>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <strong>Quick Links:</strong> In Google Analytics, check{' '}
          <button onClick={openRealtimeReport} className="text-blue-600 hover:underline">Realtime</button> for live visitors, or{' '}
          <button onClick={() => window.open('https://analytics.google.com/analytics/web/#/report/visitors-overview', '_blank')} className="text-blue-600 hover:underline">Reports</button>{' '}
          for detailed insights.
        </div>
      </CardContent>
    </Card>
  );
}
