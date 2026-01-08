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

async function listUsers() {
  const snapshot = await db.collection('users').get();
  console.log('Users in Firestore:\n');
  snapshot.forEach(doc => {
    const data = doc.data();
    const name = data.displayName || 'No name';
    const email = data.email || 'No email';
    const role = data.role || 'No role';
    console.log('- ' + name);
    console.log('  Email: ' + email);
    console.log('  Role: ' + role);
    console.log('  UID: ' + doc.id);
    console.log('');
  });
}

listUsers();