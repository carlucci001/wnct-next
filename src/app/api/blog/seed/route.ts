import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, doc, writeBatch, serverTimestamp, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { generateBlogSlug } from '@/lib/blog';

const MOCK_BLOG_POSTS = [
  {
    title: "The Heart of WNC: Why Local Voices Matter Now More Than Ever",
    excerpt: "In an era of global news cycles, the stories in our own backyard often provide the most profound insights into who we are.",
    content: `
      <p>Communication is the lifeblood of any community. In Western North Carolina, we've always prided ourselves on our strong sense of place and our unique regional culture. But as the media landscape shifts, maintaining those local connections requires intentional effort.</p>
      <h2>Bridging the Divide</h2>
      <p>For decades, local newspapers and radio stations were the primary conduits for regional storytelling. They didn't just report news; they curated the conversation. Today, that role is being redefined by digital platforms like this one.</p>
      <blockquote>"The voice of the community is not just about relaying facts; it's about reflecting our shared values and aspirations."</blockquote>
      <p>When someone writes about their experience starting a garden in Candler or the challenges of navigating the French Broad River, they aren't just sharing personal anecdotes. They are contributing to a collective narrative that builds empathy and understanding among neighbors who might otherwise never cross paths.</p>
      <h2>Our Commitment to Guest Voices</h2>
      <p>That's why we've launched this blog section. We want to hear from the educators, the artists, the small business owners, and the everyday residents who make WNC what it is. Your perspectives are the authentic threads that weave the fabric of our community.</p>
      <p>Stay tuned for weekly updates from regular columnists and guest contributors alike. If you have a story to tell, we want to listen.</p>
    `,
    category: "Opinion",
    authorName: "Marcus Sterling",
    authorBio: "Longtime Asheville resident and community advocate focusing on regional media sustainability.",
    tags: ["asheville", "community", "media"],
    featuredImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200",
  },
  {
    title: "Sustainability on the Slope: A Look at Zero-Waste Living in Downtown",
    excerpt: "Local businesses are leading the charge in reducing our regional carbon footprint, one compostable container at a time.",
    content: `
      <p>Walking through the South Slope district on a Tuesday morning, the energy is palpable—and surprisingly clean. Over the last three years, a quiet revolution has taken root among the breweries and independent retailers that define this corner of Asheville.</p>
      <h2>Leading by Example</h2>
      <p>From businesses implementing rooftop solar arrays to cafes eliminating single-use plastics entirely, the commitment to sustainability is no longer a niche interest; it's a core business strategy.</p>
      <p>One local shop owner told us, <strong>"Our customers don't just want a good product; they want to know that their purchase isn't contributing to the problems we see in our environment."</strong></p>
      <p>This shift isn't just about environmental impact—it's about economic resilience. By sourcing locally and minimizing waste, these businesses are creating a more circular regional economy that keeps more dollars within Western North Carolina.</p>
      <h2>How You Can Participate</h2>
      <p>Sustainability doesn't have to be an all-or-nothing endeavor. Small changes, like bringing your own bag or choosing a local vendor over a national chain, make a massive difference when multiplied across our population.</p>
    `,
    category: "Environment",
    authorName: "Sarah Green",
    authorBio: "Environmental journalist and sustainability consultant based in the Blue Ridge Mountains.",
    tags: ["sustainability", "business", "environment"],
    featuredImage: "https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?auto=format&fit=crop&q=80&w=1200",
  },
  {
    title: "The Blue Ridge Art Scene: More Than Just Ceramics",
    excerpt: "Exploring the hidden galleries and avant-garde studios that are pushing the boundaries of traditional Appalachian art.",
    content: `
      <p>While Western North Carolina is world-renowned for its traditional pottery and woodworking, a new generation of artists is expanding the definition of what 'Appalachian art' can be. From digital immersive installations to experimental mixed-media sculpture, the scene is more diverse than ever before.</p>
      <h2>Beyond the Tradition</h2>
      <p>In the River Arts District, you can still find the exquisite clay work that put Asheville on the map. But step into some of the newer studios, and you'll find artists exploring themes of technology, identity, and globalism through a distinctly regional lens.</p>
      <p>This evolution is vital for our region's cultural health. It ensures that our art remains a living, breathing reflection of our current reality, even as it honors the techniques of the past.</p>
    `,
    category: "Lifestyle",
    authorName: "Elena Rodriguez",
    authorBio: "Curator and art critic specializing in contemporary regional movements.",
    tags: ["art", "asheville", "culture"],
    featuredImage: "https://images.unsplash.com/photo-1460661419201-fd4cecdc8a8d?auto=format&fit=crop&q=80&w=1200",
  }
];

export async function GET() {
  try {
    const batch = writeBatch(getDb());
    const blogRef = collection(getDb(), 'blogPosts');
    
    // Create current time for seeding
    const now = Timestamp.now();
    
    MOCK_BLOG_POSTS.forEach((post) => {
      const docRef = doc(blogRef);
      batch.set(docRef, {
        ...post,
        id: docRef.id,
        slug: generateBlogSlug(post.title),
        status: 'published',
        viewCount: Math.floor(Math.random() * 500) + 50,
        allowComments: true,
        authorId: 'system-seed',
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${MOCK_BLOG_POSTS.length} blog posts.` 
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Clear all blog posts (for re-seeding)
export async function DELETE() {
  try {
    const blogRef = collection(getDb(), 'blogPosts');
    const snapshot = await getDocs(blogRef);

    let deleteCount = 0;
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(getDb(), 'blogPosts', docSnap.id));
      deleteCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deleteCount} blog posts.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
