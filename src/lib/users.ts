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
