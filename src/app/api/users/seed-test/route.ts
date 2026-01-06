import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/user';

export const dynamic = 'force-dynamic';

const TEST_PASSWORD = 'test123';

const TEST_USERS: Array<{
  email: string;
  displayName: string;
  role: UserRole;
  accountType: 'free' | 'basic' | 'premium' | 'enterprise';
}> = [
  {
    email: 'admin@test.wnctimes.com',
    displayName: 'Test Admin',
    role: 'admin',
    accountType: 'enterprise',
  },
  {
    email: 'businessowner@test.wnctimes.com',
    displayName: 'Test Business Owner',
    role: 'business-owner',
    accountType: 'enterprise',
  },
  {
    email: 'editorinchief@test.wnctimes.com',
    displayName: 'Test Editor-in-Chief',
    role: 'editor-in-chief',
    accountType: 'premium',
  },
  {
    email: 'editor@test.wnctimes.com',
    displayName: 'Test Editor',
    role: 'editor',
    accountType: 'premium',
  },
  {
    email: 'contributor@test.wnctimes.com',
    displayName: 'Test Contributor',
    role: 'content-contributor',
    accountType: 'basic',
  },
  {
    email: 'commenter@test.wnctimes.com',
    displayName: 'Test Commenter',
    role: 'commenter',
    accountType: 'free',
  },
  {
    email: 'reader@test.wnctimes.com',
    displayName: 'Test Reader',
    role: 'reader',
    accountType: 'free',
  },
];

/**
 * POST /api/users/seed-test
 * Creates test users with Firebase Auth accounts (password: test123)
 */
export async function POST(request: NextRequest) {
  try {
    // Dynamic imports to avoid Turbopack symlink issues on Windows
    const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
    const { getAuth } = await import('firebase-admin/auth');
    const { getFirestore } = await import('firebase-admin/firestore');

    // Initialize Firebase Admin
    getFirebaseAdmin();
    const auth = getAuth();
    const db = getFirestore();

    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const testUser of TEST_USERS) {
      try {
        // Check if user already exists in Auth
        let existingUser = null;
        try {
          existingUser = await auth.getUserByEmail(testUser.email);
        } catch (e: any) {
          // User doesn't exist in Auth, which is fine
          if (e.code !== 'auth/user-not-found') {
            throw e;
          }
        }

        if (existingUser) {
          // User exists in Auth, make sure Firestore doc exists too
          const userDoc = await db.collection('users').doc(existingUser.uid).get();
          if (!userDoc.exists) {
            // Create Firestore doc for existing Auth user
            const now = new Date().toISOString();
            await db.collection('users').doc(existingUser.uid).set({
              email: testUser.email,
              displayName: testUser.displayName,
              phone: '',
              role: testUser.role,
              accountType: testUser.accountType,
              status: 'active',
              photoURL: '',
              createdAt: now,
              updatedAt: now,
            });
          }
          skipped.push(`${testUser.displayName} (${testUser.role}) - already exists`);
          continue;
        }

        // Create Firebase Auth user
        const userRecord = await auth.createUser({
          email: testUser.email,
          displayName: testUser.displayName,
          password: TEST_PASSWORD,
        });

        // Create Firestore user document
        const now = new Date().toISOString();
        await db.collection('users').doc(userRecord.uid).set({
          email: testUser.email,
          displayName: testUser.displayName,
          phone: '',
          role: testUser.role,
          accountType: testUser.accountType,
          status: 'active',
          photoURL: '',
          createdAt: now,
          updatedAt: now,
        });

        created.push(`${testUser.displayName} (${testUser.role})`);
      } catch (error: any) {
        console.error(`Error creating test user ${testUser.email}:`, error);
        errors.push(`${testUser.displayName}: ${error.message || error}`);
      }
    }

    return NextResponse.json({
      success: true,
      password: TEST_PASSWORD,
      created,
      skipped,
      errors,
      message: `Created ${created.length} users, skipped ${skipped.length}, errors: ${errors.length}`,
    });
  } catch (error) {
    console.error('Error seeding test users:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed test users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/seed-test
 * Deletes all test users from Firebase Auth and Firestore
 */
export async function DELETE(request: NextRequest) {
  try {
    const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
    const { getAuth } = await import('firebase-admin/auth');
    const { getFirestore } = await import('firebase-admin/firestore');

    getFirebaseAdmin();
    const auth = getAuth();
    const db = getFirestore();

    const deleted: string[] = [];
    const errors: string[] = [];

    for (const testUser of TEST_USERS) {
      try {
        // Find user by email
        let existingUser = null;
        try {
          existingUser = await auth.getUserByEmail(testUser.email);
        } catch (e: any) {
          if (e.code !== 'auth/user-not-found') {
            throw e;
          }
        }

        if (existingUser) {
          // Delete Firestore doc
          await db.collection('users').doc(existingUser.uid).delete();
          // Delete Auth user
          await auth.deleteUser(existingUser.uid);
          deleted.push(`${testUser.displayName} (${testUser.role})`);
        }
      } catch (error: any) {
        console.error(`Error deleting test user ${testUser.email}:`, error);
        errors.push(`${testUser.displayName}: ${error.message || error}`);
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
      errors,
      message: `Deleted ${deleted.length} users, errors: ${errors.length}`,
    });
  } catch (error) {
    console.error('Error deleting test users:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete test users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
