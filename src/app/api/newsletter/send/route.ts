import { NextResponse } from 'next/server';
import { getNewsletter, getSubscribers, updateNewsletter } from '@/lib/newsletter';

export async function POST(request: Request) {
  try {
    const { newsletterId } = await request.json();
    if (!newsletterId) {
        return NextResponse.json({ error: 'Newsletter ID is required' }, { status: 400 });
    }

    const newsletter = await getNewsletter(newsletterId);

    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    if (newsletter.status === 'sent') {
      return NextResponse.json({ error: 'Newsletter already sent' }, { status: 400 });
    }

    // Fetch subscribers
    // In production, you might want to segment this or handle pagination
    const subscribers = await getSubscribers('active');

    if (subscribers.length === 0) {
        return NextResponse.json({ error: 'No active subscribers found' }, { status: 400 });
    }

    console.log(`[Newsletter] Sending "${newsletter.title}" to ${subscribers.length} subscribers...`);

    // TODO: Integrate with Resend API here
    // Example:
    // await resend.emails.send({ ... });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update status
    await updateNewsletter(newsletterId, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      stats: {
        totalRecipients: subscribers.length,
        successful: subscribers.length, // Simulated success
        failed: 0,
        opened: 0,
        clicked: 0
      }
    });

    return NextResponse.json({
        message: 'Newsletter sent successfully',
        recipientCount: subscribers.length
    });
  } catch (error) {
    console.error('Send error:', error);
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 });
  }
}
