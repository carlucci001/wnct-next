import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

// Initialize the Google Analytics Data API client
// Uses Application Default Credentials (Firebase Functions default service account)
function getAnalyticsClient() {
  return new BetaAnalyticsDataClient();
}

/**
 * GET /api/analytics/stats
 * Fetches Google Analytics metrics for the dashboard
 */
export async function GET() {
  try {
    const propertyId = process.env.GA_PROPERTY_ID;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'GA_PROPERTY_ID not configured. Please add it to your .env.local file.' },
        { status: 500 }
      );
    }

    const analyticsDataClient = getAnalyticsClient();

    // Fetch multiple reports in parallel
    const [realtimeResponse, last7DaysResponse, todayResponse, yesterdayResponse, topPagesResponse, trafficSourcesResponse] = await Promise.all([
      // 1. Realtime active users
      analyticsDataClient.runRealtimeReport({
        property: `properties/${propertyId}`,
        metrics: [{ name: 'activeUsers' }],
      }),

      // 2. Last 7 days metrics
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
      }),

      // 3. Today's metrics
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
      }),

      // 4. Yesterday's metrics (for comparison)
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
      }),

      // 5. Top 5 pages (last 7 days)
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 5,
      }),

      // 6. Traffic sources (last 7 days)
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5,
      }),
    ]);

    // Parse responses
    const activeUsersNow = parseInt(realtimeResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || '0');

    const last7Days = last7DaysResponse[0]?.rows?.[0]?.metricValues || [];
    const totalVisitors7Days = parseInt(last7Days[0]?.value || '0');
    const totalPageviews7Days = parseInt(last7Days[1]?.value || '0');
    const avgSessionDuration = parseFloat(last7Days[2]?.value || '0');
    const bounceRate = parseFloat(last7Days[3]?.value || '0') * 100; // Convert to percentage

    const todayMetrics = todayResponse[0]?.rows?.[0]?.metricValues || [];
    const visitorsToday = parseInt(todayMetrics[0]?.value || '0');
    const pageviewsToday = parseInt(todayMetrics[1]?.value || '0');

    const yesterdayMetrics = yesterdayResponse[0]?.rows?.[0]?.metricValues || [];
    const visitorsYesterday = parseInt(yesterdayMetrics[0]?.value || '0');
    const pageviewsYesterday = parseInt(yesterdayMetrics[1]?.value || '0');

    // Top pages
    const topPages = (topPagesResponse[0]?.rows || []).map(row => ({
      title: row.dimensionValues?.[0]?.value || 'Unknown',
      path: row.dimensionValues?.[1]?.value || '/',
      views: parseInt(row.metricValues?.[0]?.value || '0'),
    }));

    // Traffic sources
    const trafficSources = (trafficSourcesResponse[0]?.rows || []).map(row => ({
      source: row.dimensionValues?.[0]?.value || 'Unknown',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
    }));

    // Calculate trends (comparison to yesterday)
    const visitorsTrend = visitorsYesterday > 0
      ? ((visitorsToday - visitorsYesterday) / visitorsYesterday * 100).toFixed(1)
      : '0';
    const pageviewsTrend = pageviewsYesterday > 0
      ? ((pageviewsToday - pageviewsYesterday) / pageviewsYesterday * 100).toFixed(1)
      : '0';

    // Format average session duration (convert seconds to mm:ss)
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return NextResponse.json({
      success: true,
      data: {
        realtime: {
          activeUsers: activeUsersNow,
        },
        today: {
          visitors: visitorsToday,
          pageviews: pageviewsToday,
          visitorsTrend: parseFloat(visitorsTrend),
          pageviewsTrend: parseFloat(pageviewsTrend),
        },
        last7Days: {
          totalVisitors: totalVisitors7Days,
          totalPageviews: totalPageviews7Days,
          avgSessionDuration: formatDuration(avgSessionDuration),
          bounceRate: bounceRate.toFixed(1),
        },
        topPages,
        trafficSources,
      },
      cachedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Analytics API] Error fetching data:', error);

    // Provide helpful error messages
    if (error.message?.includes('credentials')) {
      return NextResponse.json(
        {
          error: 'Google Analytics credentials not configured',
          message: 'Please follow the setup guide in GOOGLE_ANALYTICS_SETUP.md',
        },
        { status: 500 }
      );
    }

    if (error.message?.includes('permission')) {
      return NextResponse.json(
        {
          error: 'Permission denied',
          message: 'Make sure your service account has Viewer access to your Google Analytics property',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
