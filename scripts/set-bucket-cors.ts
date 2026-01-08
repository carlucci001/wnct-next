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

async function setCors() {
  try {
    console.log('Setting CORS configuration on bucket:', bucketName);

    const bucket = storage.bucket(bucketName);

    await bucket.setCorsConfiguration([
      {
        origin: ['*'],
        method: ['GET', 'HEAD'],
        maxAgeSeconds: 3600
      }
    ]);

    console.log('CORS configuration set successfully!');

    // Verify
    const [metadata] = await bucket.getMetadata();
    console.log('Current CORS config:', JSON.stringify(metadata.cors, null, 2));

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

setCors();