import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, writeBatch, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { generateSlug } from '@/lib/events';

const MOCK_EVENTS = [
  {
    title: "Asheville Wine & Food Festival",
    description: "Experience the best of WNC culinary scene with over 50 local vendors, chefs, and breweries. A weekend of pure indulgence in the heart of downtown Asheville.",
    category: "Food & Drink",
    daysOffset: 15,
    startTime: "11:00",
    allDay: false,
    location: {
      name: "Pack Square Park",
      address: "80 Court Plaza",
      city: "Asheville"
    },
    organizer: {
      name: "Asheville Culinary Society",
      email: "info@ashevillewinefood.com"
    },
    price: "$45 - $120",
    featured: true,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Mountain Music Jam",
    description: "Bring your banjo, fiddle, or just your ears. Join local bluegrass legends for an open-air jam session. All skill levels welcome!",
    category: "Concert",
    daysOffset: 3,
    startTime: "18:30",
    allDay: false,
    location: {
      name: "Grey Eagle",
      address: "185 Clingman Ave",
      city: "Asheville"
    },
    organizer: {
      name: "Western NC Bluegrass Guild",
      phone: "828-555-0123"
    },
    price: "Free",
    featured: true,
    image: "https://images.unsplash.com/photo-1514525253361-bee8a48740d7?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "LEAF Global Arts Festival",
    description: "A multigenerational experience connecting culture through music, art, and community. Two days of workshops, performances, and magic.",
    category: "Festival",
    daysOffset: 45,
    startTime: "09:00",
    allDay: true,
    location: {
      name: "Lake Eden",
      address: "377 Lake Eden Rd",
      city: "Black Mountain"
    },
    organizer: {
      name: "LEAF Community Arts",
      email: "hello@theleaf.org"
    },
    price: "$60",
    featured: false,
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Downtown Farmers Market",
    description: "The freshest local produce, handmade crafts, and artisan breads from our region's finest farmers and makers.",
    category: "Markets",
    daysOffset: 0,
    startTime: "08:00",
    allDay: false,
    location: {
      name: "North Market St",
      address: "Intersection of Market & Walnut",
      city: "Asheville"
    },
    organizer: {
      name: "ASAP Connections",
      email: "info@asapconnections.org"
    },
    price: "Free",
    featured: false,
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Sunset Yoga on the Mountain",
    description: "Centering and stretching with a view. Join us for a 60-minute Vinyasa flow at one of our most scenic overlooks.",
    category: "Community",
    daysOffset: 7,
    startTime: "19:00",
    allDay: false,
    location: {
      name: "Craggy Pinnacle Trailhead",
      address: "Blue Ridge Parkway Milepost 364",
      city: "Asheville"
    },
    organizer: {
      name: "Blue Ridge Wellness",
      phone: "828-555-9876"
    },
    price: "$15 (Suggested Donation)",
    featured: false,
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Biltmore Estate Summer Concert Series",
    description: "An evening of music under the stars with the historic Biltmore House as the backdrop. Featuring world-class performers and local opening acts.",
    category: "Concert",
    daysOffset: 12,
    startTime: "19:30",
    allDay: false,
    location: {
      name: "Biltmore Estate",
      address: "1 Lodge St",
      city: "Asheville"
    },
    organizer: {
      name: "Biltmore Events",
      email: "events@biltmore.com"
    },
    price: "$85+",
    featured: true,
    image: "https://images.unsplash.com/photo-1459749411177-042180ceea72?q=80&w=1000&auto=format&fit=crop"
  }
];

export async function GET() {
  try {
    const batch = writeBatch(getDb());
    const now = new Date();
    
    MOCK_EVENTS.forEach((event) => {
      const eventRef = doc(collection(getDb(), 'events'));
      const startDate = new Date();
      startDate.setDate(now.getDate() + event.daysOffset);
      
      const [hours, minutes] = event.startTime.split(':').map(Number);
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate);
      if (event.allDay) {
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate.setHours(startDate.getHours() + 2);
      }

      batch.set(eventRef, {
        id: eventRef.id,
        title: event.title,
        slug: generateSlug(event.title),
        description: event.description,
        category: event.category,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        allDay: event.allDay,
        location: event.location,
        organizer: event.organizer,
        price: event.price,
        featured: event.featured,
        status: 'published',
        featuredImage: event.image,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${MOCK_EVENTS.length} events` 
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
