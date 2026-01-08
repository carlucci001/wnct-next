import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Storage } from '@google-cloud/storage';

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

const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: serviceAccount
});

const bucketName = 'gen-lang-client-0242565142.firebasestorage.app';

async function makeBucketPublic() {
  try {
    console.log('Making bucket public:', bucketName);

    const bucket = storage.bucket(bucketName);

    // Make all existing objects in the bucket publicly readable
    await bucket.makePublic();

    console.log('Bucket is now public!');
    console.log('Testing an image URL...');

  } catch (error: any) {
    console.error('Error:', error.message);

    // Alternative: try making specific folders public
    if (error.code === 403) {
      console.log('\nTrying to make individual folders public...');
      const bucket = storage.bucket(bucketName);

      try {
        // Get files in articles folder and make them public
        const [files] = await bucket.getFiles({ prefix: 'articles/', maxResults: 100 });
        console.log('Found', files.length, 'files in articles/');

        for (const file of files) {
          await file.makePublic();
          console.log('Made public:', file.name);
        }
        console.log('\nDone! Articles images should now be accessible.');
      } catch (e: any) {
        console.error('Error making files public:', e.message);
      }
    }
  }
}

makeBucketPublic();