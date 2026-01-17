import { NextResponse } from 'next/server';
import { subscribe } from '@/lib/newsletter';

export async function POST(request: Request) {
  try {
    const { email, source } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    await subscribe(email, source);
    return NextResponse.json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
