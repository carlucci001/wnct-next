import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, doc, writeBatch, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const MOCK_ADS = [
  {
    title: 'Blue Ridge Adventure Co.',
    clientName: 'Blue Ridge Outdoors',
    clientEmail: 'ads@blueridge.com',
    position: 'header_main',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1456&h=180',
    targetUrl: 'https://example.com/adventure',
    status: 'active'
  },
  {
    title: 'Asheville Coffee Roasters - Morning Special',
    clientName: 'Local Brews LLC',
    clientEmail: 'hello@ashevillecoffee.com',
    position: 'sidebar_top',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600&h=500',
    targetUrl: 'https://example.com/coffee',
    status: 'active'
  },
  {
    title: 'Visit The Biltmore Estate',
    clientName: 'Biltmore Hospitality',
    clientEmail: 'marketing@biltmore.com',
    position: 'sidebar_sticky',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1590001158193-79013ac36162?auto=format&fit=crop&q=80&w=600&h=1200',
    targetUrl: 'https://example.com/biltmore',
    status: 'active'
  },
  {
    title: 'Support WNC Public Libraries',
    clientName: 'Friends of the Library',
    clientEmail: 'friends@library.org',
    position: 'article_inline',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1940&h=500',
    targetUrl: 'https://example.com/library',
    status: 'active'
  },
  {
    title: 'Annual River Arts Music Festival',
    clientName: 'WNC Arts Council',
    clientEmail: 'events@wncarts.org',
    position: 'footer_wide',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1940&h=180',
    targetUrl: 'https://example.com/festival',
    status: 'active'
  },
  {
    title: 'Sierra Nevada Brewing Co.',
    clientName: 'Sierra Nevada',
    clientEmail: 'ads@sierranevada.com',
    position: 'sidebar_top',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1584225064785-c72a82987217?auto=format&fit=crop&q=80&w=600&h=500',
    targetUrl: 'https://example.com/brewery',
    status: 'active'
  }
];

export async function GET() {
  try {
    const db = getDb();
    const batch = writeBatch(db);
    const adsRef = collection(db, 'advertising');
    
    // First clear existing mock ads to avoid duplicates
    const snapshot = await getDocs(adsRef);
    snapshot.docs.forEach(docSnap => {
      if (docSnap.data().clientId === 'system-seed') {
        batch.delete(docSnap.ref);
      }
    });

    for (const ad of MOCK_ADS) {
      const docRef = doc(adsRef);
      batch.set(docRef, {
        ...ad,
        id: docRef.id,
        clientId: 'system-seed',
        impressions: Math.floor(Math.random() * 5000) + 1000,
        clicks: Math.floor(Math.random() * 200) + 50,
        startDate: new Date(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${MOCK_ADS.length} premium mock advertisements.`,
    });
  } catch (error) {
    console.error('Error seeding ads:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
