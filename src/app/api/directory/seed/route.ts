import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

// Force dynamic to prevent prerendering during build
export const dynamic = 'force-dynamic';

const sampleBusinesses = [
  {
    name: "Asheville Coffee Roasters",
    description: "Artisan coffee roasted in the heart of the Blue Ridge Mountains. We source our beans ethically and roast them to perfection.",
    category: "Restaurant",
    slug: "asheville-coffee-roasters",
    address: {
      street: "123 Broadway St",
      city: "Asheville",
      state: "NC",
      zip: "28801"
    },
    phone: "(828) 555-0123",
    email: "info@ashevillecoffee.com",
    website: "https://ashevillecoffee.com",
    featured: true,
    verified: true,
    status: "active",
    hours: {
      monday: "7:00 AM - 6:00 PM",
      tuesday: "7:00 AM - 6:00 PM",
      wednesday: "7:00 AM - 6:00 PM",
      thursday: "7:00 AM - 6:00 PM",
      friday: "7:00 AM - 8:00 PM",
      saturday: "8:00 AM - 8:00 PM",
      sunday: "8:00 AM - 4:00 PM"
    },
    images: ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Blue Ridge Hiking Co.",
    description: "Guided hiking trips and high-quality gear for exploring the Western North Carolina wilderness.",
    category: "Services",
    slug: "blue-ridge-hiking-co",
    address: {
      street: "45 Haywood St",
      city: "Asheville",
      state: "NC",
      zip: "28801"
    },
    phone: "(828) 555-0456",
    email: "explore@blueridgehiking.com",
    website: "https://blueridgehiking.com",
    featured: true,
    verified: true,
    status: "active",
    hours: {
      monday: "9:00 AM - 5:00 PM",
      tuesday: "9:00 AM - 5:00 PM",
      wednesday: "9:00 AM - 5:00 PM",
      thursday: "9:00 AM - 5:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "9:00 AM - 6:00 PM",
      sunday: "10:00 AM - 4:00 PM"
    },
    images: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Mountain Wellness Center",
    description: "Holistic health services including massage, acupuncture, and yoga classes.",
    category: "Health & Wellness",
    slug: "mountain-wellness-center",
    address: {
      street: "78 Merrimon Ave",
      city: "Asheville",
      state: "NC",
      zip: "28804"
    },
    phone: "(828) 555-0789",
    email: "contact@mountainwellness.com",
    website: "https://mountainwellness.com",
    featured: false,
    verified: true,
    status: "active",
    hours: {
      monday: "8:00 AM - 7:00 PM",
      tuesday: "8:00 AM - 7:00 PM",
      wednesday: "8:00 AM - 7:00 PM",
      thursday: "8:00 AM - 7:00 PM",
      friday: "8:00 AM - 5:00 PM",
      saturday: "9:00 AM - 1:00 PM",
      sunday: "Closed"
    },
    images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "River Arts District Pottery",
    description: "Handcrafted pottery and ceramics from local artists. Classes and workshops available for all skill levels.",
    category: "Entertainment",
    slug: "river-arts-district-pottery",
    address: {
      street: "12 Riverside Dr",
      city: "Asheville",
      state: "NC",
      zip: "28801"
    },
    phone: "(828) 555-0987",
    email: "studio@radpottery.com",
    website: "https://radpottery.com",
    featured: false,
    verified: false,
    status: "active",
    hours: {
      monday: "10:00 AM - 5:00 PM",
      tuesday: "10:00 AM - 5:00 PM",
      wednesday: "10:00 AM - 5:00 PM",
      thursday: "10:00 AM - 5:00 PM",
      friday: "10:00 AM - 7:00 PM",
      saturday: "10:00 AM - 7:00 PM",
      sunday: "12:00 PM - 5:00 PM"
    },
    images: ["https://images.unsplash.com/photo-1565191999001-551c187427bb?auto=format&fit=crop&q=80&w=800"]
  }
];

export async function GET() {
  try {
    const batch = writeBatch(db);
    const businessesRef = collection(db, 'businesses');

    sampleBusinesses.forEach((business) => {
      const docRef = doc(businessesRef);
      batch.set(docRef, {
        ...business,
        id: docRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${sampleBusinesses.length} businesses.` 
    });
  } catch (error) {
    console.error('Error seeding businesses:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
