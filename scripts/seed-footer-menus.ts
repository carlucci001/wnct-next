/**
 * Seed Footer Menus Script
 *
 * Run with: npx tsx scripts/seed-footer-menus.ts
 *
 * This creates the footer-quick-links and footer-categories menus in Firestore
 * with proper items matching the main navigation categories.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

// Initialize Firebase Admin
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
  console.error('Make sure .env.local exists and contains FIREBASE_SERVICE_ACCOUNT');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (e) {
  console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e);
  process.exit(1);
}

const app = initializeApp({
  credential: cert(serviceAccount),
});

// Use the 'gwnct' named database
const db = getFirestore(app, 'gwnct');

// Footer Quick Links menu data
const footerQuickLinksMenu = {
  id: 'footer-quick-links',
  name: 'Footer Quick Links',
  slug: 'footer-quick-links',
  description: 'Quick links section in the footer',
  items: [
    { id: 'about', label: 'About WNC Times', path: '/about', enabled: true, order: 0 },
    { id: 'advertise', label: 'Advertise With Us', path: '/advertise', enabled: true, order: 1 },
    { id: 'contact', label: 'Contact Us', path: '/contact', enabled: true, order: 2 },
    { id: 'directory', label: 'Business Directory', path: '/directory', enabled: true, order: 3 },
    { id: 'subscribe', label: 'Subscribe', path: '/subscribe', enabled: true, order: 4 },
    { id: 'privacy', label: 'Privacy Policy', path: '/privacy', enabled: true, order: 5 },
    { id: 'staff-login', label: 'Staff Login', path: '/admin', enabled: true, order: 6 },
  ],
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Footer Categories menu data - matches main-nav categories
const footerCategoriesMenu = {
  id: 'footer-categories',
  name: 'Footer Categories',
  slug: 'footer-categories',
  description: 'Category links section in the footer',
  items: [
    { id: 'news', label: 'News', path: '/category/news', enabled: true, order: 0 },
    { id: 'sports', label: 'Sports', path: '/category/sports', enabled: true, order: 1 },
    { id: 'business', label: 'Business', path: '/category/business', enabled: true, order: 2 },
    { id: 'entertainment', label: 'Entertainment', path: '/category/entertainment', enabled: true, order: 3 },
    { id: 'lifestyle', label: 'Lifestyle', path: '/category/lifestyle', enabled: true, order: 4 },
    { id: 'outdoors', label: 'Outdoors', path: '/category/outdoors', enabled: true, order: 5 },
  ],
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function seedFooterMenus() {
  console.log('Starting footer menu seeding...\n');

  const menusRef = db.collection('menus');

  // Check and create footer-quick-links
  const quickLinksDoc = await menusRef.doc('footer-quick-links').get();
  if (quickLinksDoc.exists) {
    console.log('footer-quick-links already exists, updating...');
    await menusRef.doc('footer-quick-links').update({
      ...footerQuickLinksMenu,
      updatedAt: new Date().toISOString(),
    });
    console.log('footer-quick-links updated successfully!');
  } else {
    console.log('Creating footer-quick-links...');
    await menusRef.doc('footer-quick-links').set(footerQuickLinksMenu);
    console.log('footer-quick-links created successfully!');
  }

  // Check and create footer-categories
  const categoriesDoc = await menusRef.doc('footer-categories').get();
  if (categoriesDoc.exists) {
    console.log('footer-categories already exists, updating...');
    await menusRef.doc('footer-categories').update({
      ...footerCategoriesMenu,
      updatedAt: new Date().toISOString(),
    });
    console.log('footer-categories updated successfully!');
  } else {
    console.log('Creating footer-categories...');
    await menusRef.doc('footer-categories').set(footerCategoriesMenu);
    console.log('footer-categories created successfully!');
  }

  // List all menus to confirm
  console.log('\n--- Current Menus in Firestore ---');
  const snapshot = await menusRef.orderBy('slug').get();
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    console.log(`- ${data.name} (${data.slug}): ${data.items?.length || 0} items`);
  });

  console.log('\nFooter menu seeding completed!');
}

seedFooterMenus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding footer menus:', error);
    process.exit(1);
  });
