/**
 * API Endpoint: Seed 6 Professional AI Journalists
 * Call this ONCE to populate your newsroom
 *
 * Usage: POST http://localhost:3000/api/seed-journalists
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

const journalists = [
  {
    name: 'Marcus Harrell',
    title: 'Senior News Reporter',
    beat: 'News',
    bio: 'Marcus brings 15 years of investigative journalism experience to WNC Times, specializing in local government, community affairs, and breaking news. A graduate of UNC Chapel Hill, he\'s committed to keeping Western North Carolina informed about the issues that matter most.',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    useWebSearch: true,
    useFullArticleContent: true,
    isActive: false, // Start inactive - user configures first
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Jessica Chen',
    title: 'Business & Economy Reporter',
    beat: 'Business',
    bio: 'Jessica covers local business development, economic trends, and entrepreneurship across Western North Carolina. With an MBA and a passion for highlighting local success stories, she brings clarity to complex economic issues affecting our community.',
    photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    useWebSearch: true,
    useFullArticleContent: true,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Tyler "Coach" Williams',
    title: 'Sports Editor',
    beat: 'Sports',
    bio: 'Coach Williams lives and breathes Western North Carolina sports. From high school football to local college athletics, Tyler brings energy and insight to every game. A former college athlete himself, he understands what drives our local teams to excel.',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    useWebSearch: true,
    useFullArticleContent: true,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Sarah Monroe',
    title: 'Lifestyle & Culture Editor',
    beat: 'Lifestyle',
    bio: 'Sarah celebrates the vibrant culture and unique lifestyle of Western North Carolina. From farm-to-table dining to local arts and wellness trends, she uncovers the stories that make our mountain communities special.',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    useWebSearch: true,
    useFullArticleContent: true,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Mia Rodriguez',
    title: 'Entertainment Reporter',
    beat: 'Entertainment',
    bio: 'Mia keeps her finger on the pulse of Western North Carolina\'s entertainment scene. From music festivals to theater productions, art galleries to film screenings, she ensures you never miss what\'s happening in our creative community.',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    useWebSearch: true,
    useFullArticleContent: true,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Jake "Trailblazer" Thompson',
    title: 'Outdoors & Recreation Editor',
    beat: 'Outdoors',
    bio: 'Jake is your guide to the incredible outdoor adventures Western North Carolina has to offer. Whether it\'s hiking the Appalachian Trail, fly fishing mountain streams, or discovering hidden waterfalls, Jake knows where to go and what to bring.',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    useWebSearch: true,
    useFullArticleContent: true,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function POST(request: NextRequest) {
  try {
    const db = getAdminFirestore();
    const created = [];

    for (const journalist of journalists) {
      const docRef = await db.collection('aiJournalists').add(journalist);
      created.push({
        id: docRef.id,
        name: journalist.name,
        beat: journalist.beat,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${created.length} AI journalists`,
      journalists: created,
      nextSteps: [
        '1. Go to Admin → AI Journalists tab',
        '2. Edit each journalist to configure:',
        '   - RSS sources for their beat',
        '   - Schedule (daily/weekly)',
        '   - Category assignment',
        '   - Enable auto-publish for vacation mode',
        '3. Click "Activate" to enable each journalist',
      ],
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed journalists',
      },
      { status: 500 }
    );
  }
}
