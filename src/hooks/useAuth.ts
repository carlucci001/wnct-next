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
    console.log('[useAuth] Hook mounted, setting up auth listener...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('[useAuth] Auth state changed:', firebaseUser?.email);
      if (firebaseUser) {
        try {
          console.log('[useAuth] Fetching user doc for:', firebaseUser.uid);
          const userDoc = await getDoc(doc(getDb(), 'users', firebaseUser.uid));
          console.log('[useAuth] Doc exists:', userDoc.exists());
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('[useAuth] User data:', userData);
            console.log('[useAuth] Role from doc:', userData.role);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userData.role as UserRole,
              loading: false,
            });
          } else {
            // User exists in Auth but not in Firestore (should not happen in prod ideally)
            console.log('[useAuth] No Firestore doc, defaulting to reader');
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'reader', // Default role
              loading: false,
            });
          }
        } catch (error) {
          console.error('[useAuth] Error fetching user role:', error);
          setUser((prev) => ({ ...prev, loading: false }));
        }
      } else {
        console.log('[useAuth] No user signed in');
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
