import { NextResponse } from 'next/server';

export async function GET() {
  // Placeholder data
  const articles = [
    {
      id: '1',
      title: 'Welcome to WNC Times',
      slug: 'welcome-to-wnc-times',
      excerpt: 'This is the first article on our new platform.',
      content: 'Full content goes here...',
      publishedAt: new Date().toISOString(),
      author: 'Editor',
      category: 'News',
    },
    {
      id: '2',
      title: 'Local Events',
      slug: 'local-events',
      excerpt: 'Check out the upcoming events in Western North Carolina.',
      content: 'List of events...',
      publishedAt: new Date().toISOString(),
      author: 'Community Manager',
      category: 'Events',
    },
  ];

  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate body here
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Placeholder: Simulate database insertion
    const newArticle = {
      id: Math.random().toString(36).substring(7),
      ...body,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ article: newArticle }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
