import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const db = getDb();
    const adsRef = collection(db, 'advertising');
    
    const sampleAds = [
      {
        title: 'Farrington Development - Web Design',
        clientName: 'Farrington Development',
        clientEmail: 'info@farrington.com',
        clientId: 'system-demo',
        type: 'image',
        position: 'header_main',
        imageUrl: '/banners/farrington-banner.png',
        targetUrl: 'https://farringtondevelopment.com',
        status: 'active',
        impressions: 1245,
        clicks: 48,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        title: 'Asheville Hiking Tours',
        clientName: 'WNC Outdoors',
        clientEmail: 'hike@wnc.com',
        clientId: 'system-demo',
        type: 'image',
        position: 'sidebar_top',
        imageUrl: 'https://images.unsplash.com/photo-1551632432-c735e7a030ce?q=80&w=300&h=250&fit=crop',
        targetUrl: 'https://example.com/hike',
        status: 'active',
        impressions: 890,
        clicks: 12,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        title: 'Local Farm to Table - Fresh Weekly',
        clientName: 'Green Valley Farms',
        clientEmail: 'sales@greenvalley.com',
        clientId: 'system-demo',
        type: 'image',
        position: 'sidebar_sticky',
        imageUrl: 'https://images.unsplash.com/photo-1488459711616-d3971c7a2478?q=80&w=300&h=600&fit=crop',
        targetUrl: 'https://example.com/farm',
        status: 'active',
        impressions: 560,
        clicks: 5,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        title: 'WNC Financial Advisors',
        clientName: 'Summitt Wealth',
        clientEmail: 'info@summitt.com',
        clientId: 'system-demo',
        type: 'image',
        position: 'footer_wide',
        imageUrl: 'https://images.unsplash.com/photo-1454165833762-010336149927?q=80&w=970&h=90&fit=crop',
        targetUrl: 'https://example.com/finance',
        status: 'active',
        impressions: 2100,
        clicks: 34,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    ];

    for (const ad of sampleAds) {
      await addDoc(adsRef, ad);
    }

    return NextResponse.json({ message: 'Advertising seed complete' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const db = getDb();
    const q = query(collection(db, 'advertising'), where('clientId', '==', 'system-demo'));
    const snapshot = await getDocs(q);
    
    const results = await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
    
    return NextResponse.json({ message: `Deleted ${results.length} demo ads` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
