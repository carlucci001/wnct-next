import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const propertyId = process.env.GA_PROPERTY_ID;

    if (!credentialsPath) {
      return NextResponse.json({
        status: 'error',
        message: 'GOOGLE_APPLICATION_CREDENTIALS not set',
      });
    }

    if (!propertyId) {
      return NextResponse.json({
        status: 'error',
        message: 'GA_PROPERTY_ID not set',
      });
    }

    // Initialize client
    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: credentialsPath,
    });

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
      message: 'Google Analytics API connection successful',
      propertyId,
      credentialsPath,
      serviceAccount: 'analytics-reader@gen-lang-client-0242565142.iam.gserviceaccount.com',
      activeUsers: response.rows?.[0]?.metricValues?.[0]?.value || '0',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      code: error.code,
      details: error.details,
      propertyId: process.env.GA_PROPERTY_ID,
      credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      serviceAccount: 'analytics-reader@gen-lang-client-0242565142.iam.gserviceaccount.com',
      instructions: {
        step1: 'Verify Google Analytics Data API is enabled in Google Cloud Console',
        step2: 'Add service account email to GA4 property as Viewer',
        step3: 'Go to GA4 Admin > Property Access Management > Add Users',
        step4: 'Add: analytics-reader@gen-lang-client-0242565142.iam.gserviceaccount.com',
        step5: 'Assign "Viewer" role',
      },
    }, { status: 500 });
  }
}
