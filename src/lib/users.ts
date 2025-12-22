import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { User, UserRole } from '@/types/user';

const USERS_COLLECTION = 'users';

export async function getUsers(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      };
    }) as User[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
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
