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

async function checkImages() {
  const snapshot = await db.collection('articles')
    .limit(15)
    .get();

  console.log('Checking featured images for recent published articles:\n');

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const imageUrl = data.featuredImage || data.imageUrl || 'NO IMAGE';
    console.log('Title: ' + (data.title || 'Untitled').substring(0, 50));
    console.log('Image URL: ' + imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''));
    console.log('Category: ' + (data.category || 'None'));
    console.log('---');
  }
}

checkImages();