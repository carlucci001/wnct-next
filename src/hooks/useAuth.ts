import { useState, useEffect } from 'react';
import { auth, getDb } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserRole } from '@/types/user';

interface AuthUser {
  uid: string;
  email: string | null;
  role: UserRole | null;
  loading: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser>({
    uid: '',
    email: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(getDb(), 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userData.role as UserRole,
              loading: false,
            });
          } else {
            // User exists in Auth but not in Firestore (should not happen in prod ideally)
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'reader', // Default role
              loading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUser((prev) => ({ ...prev, loading: false }));
        }
      } else {
        setUser({
          uid: '',
          email: null,
          role: null,
          loading: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return user;
}
