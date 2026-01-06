import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

// Sample community posts for Asheville
const SEED_POSTS = [
  {
    authorName: 'Traffic Watch AVL',
    authorPhoto: 'https://api.dicebear.com/7.x/identicon/svg?seed=traffic',
    content: 'Heads up! Major accident on I-40 East near Exit 50. Traffic backed up for 3 miles. Consider alternate routes via Patton Ave.',
    topic: 'alert',
  },
  {
    authorName: 'Sarah Jenkins',
    authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    content: 'Anyone know a good plumber available on weekends? My kitchen sink has been leaking and I need someone reliable. North Asheville area.',
    topic: 'question',
  },
  {
    authorName: 'River Arts District',
    authorPhoto: 'https://api.dicebear.com/7.x/shapes/svg?seed=rad',
    content: '🎨 Gallery walk starts tonight at 5PM! Come enjoy free wine and local art. Over 20 studios open with live music throughout the district.',
    topic: 'event',
  },
  {
    authorName: 'APD Community Watch',
    authorPhoto: 'https://api.dicebear.com/7.x/identicon/svg?seed=apd',
    content: '⚠️ Vehicle break-ins reported in downtown parking garage on College St. Multiple cars targeted overnight. Lock your vehicles and remove valuables.',
    topic: 'crime',
  },
  {
    authorName: 'Mike Thompson',
    authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    content: 'The new coffee shop on Merrimon Ave is excellent! Great local roast and the staff is super friendly. Highly recommend the lavender latte.',
    topic: 'general',
  },
  {
    authorName: 'Mountain Mom',
    authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mountainmom',
    content: 'Looking for recommendations on kid-friendly hiking trails near Black Mountain. My 6-year-old wants to start hiking with me!',
    topic: 'question',
  },
  {
    authorName: 'Buncombe EMS',
    authorPhoto: 'https://api.dicebear.com/7.x/identicon/svg?seed=ems',
    content: '🚨 Flash flood warning in effect until 8PM. Avoid low-lying areas near the French Broad River. Turn around, don\'t drown!',
    topic: 'alert',
  },
  {
    authorName: 'Downtown Asheville',
    authorPhoto: 'https://api.dicebear.com/7.x/shapes/svg?seed=downtown',
    content: '🎉 Pack Square Park hosting free concert series every Friday this month! Bring blankets and picnic baskets. Food trucks on site.',
    topic: 'event',
  },
  {
    authorName: 'West AVL Neighbor',
    authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=westavl',
    content: 'Found a friendly orange tabby cat near Haywood Rd. Very sweet, no collar. DM me if you\'re missing your fur baby!',
    topic: 'general',
  },
  {
    authorName: 'Local Foodie',
    authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=foodie',
    content: 'Just tried the new BBQ spot on Tunnel Road. Amazing brisket! Who else has been? What did you think of the sides?',
    topic: 'general',
  },
];

// GET - Seed community posts
export async function GET() {
  try {
    const postsRef = collection(db, 'communityPosts');

    // Check if posts already exist
    const existingPosts = await getDocs(postsRef);
    if (existingPosts.size > 0) {
      return NextResponse.json({
        success: true,
        message: `Community already has ${existingPosts.size} posts. Use DELETE to clear first.`,
        count: existingPosts.size,
      });
    }

    // Seed posts
    const results = [];
    for (let i = 0; i < SEED_POSTS.length; i++) {
      const post = SEED_POSTS[i];
      const docRef = doc(postsRef);

      await setDoc(docRef, {
        id: docRef.id,
        authorId: `seed-user-${i}`,
        authorName: post.authorName,
        authorPhoto: post.authorPhoto,
        content: post.content,
        topic: post.topic,
        likes: Math.floor(Math.random() * 50),
        likedBy: [],
        commentsCount: Math.floor(Math.random() * 15),
        pinned: i === 0, // Pin the first post
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      results.push({
        id: docRef.id,
        authorName: post.authorName,
        topic: post.topic,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${results.length} community posts`,
      posts: results,
    });
  } catch (error) {
    console.error('Error seeding community posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed community posts' },
      { status: 500 }
    );
  }
}

// DELETE - Clear all community posts
export async function DELETE() {
  try {
    const postsRef = collection(db, 'communityPosts');
    const snapshot = await getDocs(postsRef);

    let deleted = 0;
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, 'communityPosts', docSnap.id));
      deleted++;
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted} community posts`,
      deleted,
    });
  } catch (error) {
    console.error('Error clearing community posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear community posts' },
      { status: 500 }
    );
  }
}
