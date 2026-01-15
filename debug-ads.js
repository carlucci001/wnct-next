// Quick debugging script to check advertising collection
// Run this in your browser console on the production site

async function debugAds() {
  try {
    // This assumes you're logged in as admin
    const response = await fetch('/api/advertising/debug');

    // If no API exists, query directly (if you have Firestore client access)
    console.log('=== ALL ADVERTISING DOCUMENTS ===');

    // Get all docs from advertising collection
    const db = window.firebase?.firestore() || null;
    if (!db) {
      console.error('Firebase not available. Please check manually in Firebase Console.');
      console.log('Go to: https://console.firebase.google.com/project/gen-lang-client-0242565142/firestore/databases/gwnct/data/~2Fadvertising');
      return;
    }

    const snapshot = await db.collection('advertising').get();

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('\n--- Document ID:', doc.id);
      console.log('Title:', data.title);
      console.log('Position:', data.position, '(Type:', typeof data.position + ')');
      console.log('Status:', data.status, '(Type:', typeof data.status + ')');
      console.log('Start Date:', data.startDate);
      console.log('Image URL:', data.imageUrl);
      console.log('Has all fields:', {
        hasPosition: !!data.position,
        hasStatus: !!data.status,
        hasImageUrl: !!data.imageUrl
      });
    });

    console.log('\n=== CHECKING SIDEBAR_TOP QUERY ===');
    const sidebarQuery = await db.collection('advertising')
      .where('position', '==', 'sidebar_top')
      .where('status', '==', 'active')
      .get();

    console.log('Found', sidebarQuery.size, 'ads for sidebar_top');
    sidebarQuery.forEach(doc => {
      console.log('- ', doc.data().title);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

debugAds();
