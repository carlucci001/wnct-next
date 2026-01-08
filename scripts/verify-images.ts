import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');

const startIdx = envContent.indexOf('FIREBASE_SERVICE_ACCOUNT=');
let str = envContent.substring(startIdx + 'FIREBASE_SERVICE_ACCOUNT='.length);
let braceCount = 0, endIdx = 0, started = false;
for (let i = 0; i < str.length; i++) {
  if (str[i] === '{') { braceCount++; started = true; }
  if (str[i] === '}') braceCount--;
  if (started && braceCount === 0) { endIdx = i + 1; break; }
}
const serviceAccountKey = str.substring(0, endIdx).replace(/^"/, '').trim();
const serviceAccount = JSON.parse(serviceAccountKey);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore('gwnct');

async function verifyImages() {
  // Get published articles that would appear in hero
  const snapshot = await db.collection('articles')
    .where('status', '==', 'published')
    .limit(10)
    .get();

  console.log('Verifying hero section images...\n');

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const imageUrl = data.featuredImage || data.imageUrl;

    if (!imageUrl) {
      console.log('NO IMAGE:', data.title?.substring(0, 40));
      continue;
    }

    // Test if URL is accessible
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      const status = response.status;
      console.log(status === 200 ? 'OK' : 'FAIL', status, '-', data.title?.substring(0, 40));
      console.log('  URL:', imageUrl.substring(0, 80) + '...');
    } catch (e: any) {
      console.log('ERROR -', data.title?.substring(0, 40));
      console.log('  ', e.message);
    }
  }
}

verifyImages();