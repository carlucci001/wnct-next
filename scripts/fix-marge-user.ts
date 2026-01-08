import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

const auth = getAuth();
const db = getFirestore('gwnct');

const MARGE_EMAIL = 'margefarrington@gmail.com';

async function fixMargeUser() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', MARGE_EMAIL).get();

    if (snapshot.empty) {
      console.log('No Firestore document found for ' + MARGE_EMAIL);
      return;
    }

    const margeDoc = snapshot.docs[0];
    const margeData = margeDoc.data();
    console.log('Found Firestore document:', margeDoc.id);
    console.log('Display Name:', margeData.displayName);
    console.log('Email:', margeData.email);
    console.log('Role:', margeData.role);

    // Check if Auth user exists
    try {
      const existingUser = await auth.getUserByEmail(MARGE_EMAIL);
      console.log('\nAuth user already exists:', existingUser.uid);

      if (existingUser.uid !== margeDoc.id) {
        console.log('UIDs mismatch! Firestore:', margeDoc.id, 'Auth:', existingUser.uid);
        console.log('Updating Firestore doc ID to match Auth UID...');
        await usersRef.doc(existingUser.uid).set({
          ...margeData,
          uid: existingUser.uid,
        });
        await margeDoc.ref.delete();
        console.log('Firestore document updated to match Auth UID');
      } else {
        console.log('UIDs match, no changes needed');
      }

      // Reset password
      await auth.updateUser(existingUser.uid, { password: 'Marge2024!' });
      console.log('\nPassword reset successfully');
      console.log('\n=================================');
      console.log('Marge can now log in with:');
      console.log('Email: ' + MARGE_EMAIL);
      console.log('Password: Marge2024!');
      console.log('=================================');
      return;
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') {
        throw e;
      }
      console.log('\nNo Auth user found, creating new one...');
    }

    // Create new Auth user
    const newUser = await auth.createUser({
      email: MARGE_EMAIL,
      password: 'Marge2024!',
      displayName: margeData.displayName || 'Marge',
    });
    console.log('Created new Auth user:', newUser.uid);

    await usersRef.doc(newUser.uid).set({
      ...margeData,
      uid: newUser.uid,
    });

    await margeDoc.ref.delete();

    console.log('Firestore document migrated to new UID');
    console.log('\n=================================');
    console.log('Marge can now log in with:');
    console.log('Email: ' + MARGE_EMAIL);
    console.log('Password: Marge2024!');
    console.log('=================================');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixMargeUser();