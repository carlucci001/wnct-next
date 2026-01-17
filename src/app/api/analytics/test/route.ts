import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const propertyId = process.env.GA_PROPERTY_ID;

    if (!propertyId) {
      return NextResponse.json({
        status: 'error',
        message: 'GA_PROPERTY_ID not set',
      });
    }

    // Initialize client with Application Default Credentials
    const analyticsDataClient = new BetaAnalyticsDataClient();

    // Try a simple API call
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: 'today',
          endDate: 'today',
        },
      ],
      metrics: [
        {
          name: 'activeUsers',
        },
      ],
    });

    return NextResponse.json({
      status: 'success',
      message: 'Google Analytics API connection successful (using Application Default Credentials)',
      propertyId,
      activeUsers: response.rows?.[0]?.metricValues?.[0]?.value || '0',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      code: error.code,
      details: error.details,
      propertyId: process.env.GA_PROPERTY_ID,
      instructions: {
        step1: 'Verify Google Analytics Data API is enabled in Google Cloud Console',
        step2: 'Add Firebase default service account to GA4 property as Viewer',
        step3: 'Find your service account at: https://console.cloud.google.com/iam-admin/serviceaccounts',
        step4: 'It will be named: gen-lang-client-0242565142@appspot.gserviceaccount.com (or similar)',
        step5: 'Go to GA4 Admin > Property Access Management > Add Users',
        step6: 'Add the service account email and assign "Viewer" role',
      },
    }, { status: 500 });
  }
}
