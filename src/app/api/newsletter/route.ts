import { NextResponse } from 'next/server';
import { getNewsletters, createNewsletter } from '@/lib/newsletter';

export async function GET() {
  try {
    const newsletters = await getNewsletters();
    return NextResponse.json(newsletters);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch newsletters' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Basic validation
    if (!body.title || !body.subject || !body.content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = await createNewsletter(body);
    return NextResponse.json({ id, message: 'Newsletter created' }, { status: 201 });
  } catch (error) {
    console.error('Create newsletter error:', error);
    return NextResponse.json({ error: 'Failed to create newsletter' }, { status: 500 });
  }
}
