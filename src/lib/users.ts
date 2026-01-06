import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { User, UserRole, UserUpdate } from '@/types/user';

const USERS_COLLECTION = 'users';

export async function getUsers(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        accountType: data.accountType || 'free',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
      };
    }) as User[];
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    const data = userSnap.data();
    return {
      id: userSnap.id,
      ...data,
      accountType: data.accountType || 'free',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
    } as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, { role: newRole, updatedAt: new Date() });
}

export async function toggleUserStatus(userId: string, currentStatus: 'active' | 'blocked'): Promise<void> {
  const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, { status: newStatus, updatedAt: new Date() });
}

export async function updateUser(userId: string, updates: UserUpdate): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, { ...updates, updatedAt: new Date() });
}

export async function createUser(userData: {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
  role: UserRole;
  accountType?: 'free' | 'basic' | 'premium' | 'enterprise';
  photoURL?: string;
}): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userData.id);
  await setDoc(userRef, {
    ...userData,
    accountType: userData.accountType || 'free',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function deleteUser(userId: string): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await deleteDoc(userRef);
}

export async function searchUsers(searchTerm: string): Promise<User[]> {
  // Note: Firestore doesn't support full-text search, so we fetch all and filter client-side
  // For production, consider using Algolia or Elasticsearch
  const users = await getUsers();
  const term = searchTerm.toLowerCase();
  return users.filter(
    (user) =>
      user.email.toLowerCase().includes(term) ||
      (user.displayName?.toLowerCase().includes(term) ?? false)
  );
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        accountType: data.accountType || 'free',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
      };
    }) as User[];
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return [];
  }
}

/**
 * Test user definitions for each role and account type
 */
const TEST_USERS: Array<{
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountType: 'free' | 'basic' | 'premium' | 'enterprise';
}> = [
  // Admin - Enterprise
  {
    id: 'test-admin',
    email: 'admin@test.wnctimes.com',
    displayName: 'Test Admin',
    role: 'admin',
    accountType: 'enterprise',
  },
  // Business Owner - Enterprise
  {
    id: 'test-business-owner',
    email: 'businessowner@test.wnctimes.com',
    displayName: 'Test Business Owner',
    role: 'business-owner',
    accountType: 'enterprise',
  },
  // Editor-in-Chief - Premium
  {
    id: 'test-editor-in-chief',
    email: 'editorinchief@test.wnctimes.com',
    displayName: 'Test Editor-in-Chief',
    role: 'editor-in-chief',
    accountType: 'premium',
  },
  // Editor - Premium
  {
    id: 'test-editor',
    email: 'editor@test.wnctimes.com',
    displayName: 'Test Editor',
    role: 'editor',
    accountType: 'premium',
  },
  // Content Contributor - Basic
  {
    id: 'test-contributor',
    email: 'contributor@test.wnctimes.com',
    displayName: 'Test Contributor',
    role: 'content-contributor',
    accountType: 'basic',
  },
  // Commenter - Free
  {
    id: 'test-commenter',
    email: 'commenter@test.wnctimes.com',
    displayName: 'Test Commenter',
    role: 'commenter',
    accountType: 'free',
  },
  // Reader - Free
  {
    id: 'test-reader',
    email: 'reader@test.wnctimes.com',
    displayName: 'Test Reader',
    role: 'reader',
    accountType: 'free',
  },
];

/**
 * Seed test users for each role/account type
 * Returns list of created user IDs
 */
export async function seedTestUsers(): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const testUser of TEST_USERS) {
    try {
      // Check if user already exists
      const existingUser = await getUserById(testUser.id);
      if (existingUser) {
        skipped.push(`${testUser.displayName} (${testUser.role})`);
        continue;
      }

      // Create the test user
      await createUser({
        id: testUser.id,
        email: testUser.email,
        displayName: testUser.displayName,
        role: testUser.role,
        accountType: testUser.accountType,
      });

      created.push(`${testUser.displayName} (${testUser.role})`);
    } catch (error) {
      console.error(`Error creating test user ${testUser.id}:`, error);
      errors.push(`${testUser.displayName}: ${error}`);
    }
  }

  return { created, skipped, errors };
}

/**
 * Delete all test users
 */
export async function deleteTestUsers(): Promise<{ deleted: string[]; errors: string[] }> {
  const deleted: string[] = [];
  const errors: string[] = [];

  for (const testUser of TEST_USERS) {
    try {
      const existingUser = await getUserById(testUser.id);
      if (existingUser) {
        await deleteUser(testUser.id);
        deleted.push(`${testUser.displayName} (${testUser.role})`);
      }
    } catch (error) {
      console.error(`Error deleting test user ${testUser.id}:`, error);
      errors.push(`${testUser.displayName}: ${error}`);
    }
  }

  return { deleted, errors };
}
