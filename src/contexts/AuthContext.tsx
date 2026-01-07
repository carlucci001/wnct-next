"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth, getDb } from "@/lib/firebase";

interface UserProfile {
  id?: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  accountType?: string;
  status?: string;
  [key: string]: any;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Impersonation features
  isImpersonating: boolean;
  realUserProfile: UserProfile | null;
  impersonateUser: (userId: string) => Promise<void>;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [realUserProfile, setRealUserProfile] = useState<UserProfile | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing impersonation on mount
  useEffect(() => {
    const storedImpersonation = sessionStorage.getItem('impersonatedUserId');
    if (storedImpersonation) {
      // Will be restored when auth state loads
      console.log('[AuthContext] Found stored impersonation:', storedImpersonation);
    }
  }, []);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Subscribe to real-time updates for the user profile
        try {
          const userDocRef = doc(getDb(), 'users', user.uid);
          unsubscribeSnapshot = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
              console.log('[AuthContext] Fetched real-time user profile:', docSnap.id);
              const profile = { ...docSnap.data(), id: docSnap.id } as UserProfile;
              setRealUserProfile(profile);

              // Check if we should restore impersonation
              const storedImpersonation = sessionStorage.getItem('impersonatedUserId');
              if (storedImpersonation && canImpersonate(profile.role)) {
                // Restore impersonation
                const impersonatedDoc = await getDoc(doc(getDb(), 'users', storedImpersonation));
                if (impersonatedDoc.exists()) {
                  setUserProfile({ ...impersonatedDoc.data(), id: impersonatedDoc.id } as UserProfile);
                  setIsImpersonating(true);
                  console.log('[AuthContext] Restored impersonation:', storedImpersonation);
                } else {
                  // Impersonated user no longer exists
                  sessionStorage.removeItem('impersonatedUserId');
                  setUserProfile(profile);
                }
              } else {
                setUserProfile(profile);
              }
            } else {
              console.log('[AuthContext] User profile not found');
              setUserProfile(null);
              setRealUserProfile(null);
            }
          }, (error) => {
            console.error('[AuthContext] Error syncing user profile:', error);
          });
        } catch (error) {
          console.error('[AuthContext] Error setting up profile sync:', error);
        }
      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        setUserProfile(null);
        setRealUserProfile(null);
        setIsImpersonating(false);
        sessionStorage.removeItem('impersonatedUserId');
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  // Check if user role can impersonate
  const canImpersonate = (role?: string): boolean => {
    return ['admin', 'business-owner', 'editor-in-chief'].includes(role || '');
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);

      // Check if user document exists, create if not (first-time Google sign-in)
      const userDocRef = doc(getDb(), 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: result.user.email,
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          role: 'reader', // Default role for new users
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log('[AuthContext] Created user document for Google sign-in');
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });

      // Create Firestore user document with default role
      const userDocRef = doc(getDb(), 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        email: userCredential.user.email,
        displayName,
        photoURL: '',
        role: 'reader', // Default role for new users
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('[AuthContext] Created user document for email registration');
    } catch (error) {
      console.error("Error registering", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear impersonation on sign out
      sessionStorage.removeItem('impersonatedUserId');
      setIsImpersonating(false);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  // Impersonate another user (admin only)
  const impersonateUser = async (userId: string) => {
    if (!canImpersonate(realUserProfile?.role)) {
      throw new Error('You do not have permission to impersonate users');
    }

    try {
      const userDocRef = doc(getDb(), 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const impersonatedProfile = { ...userDoc.data(), id: userDoc.id } as UserProfile;
      setUserProfile(impersonatedProfile);
      setIsImpersonating(true);
      sessionStorage.setItem('impersonatedUserId', userId);
      console.log('[AuthContext] Impersonating user:', userId, impersonatedProfile.displayName);
    } catch (error) {
      console.error('Error impersonating user:', error);
      throw error;
    }
  };

  // Stop impersonation and return to real user
  const stopImpersonation = () => {
    if (realUserProfile) {
      setUserProfile(realUserProfile);
      setIsImpersonating(false);
      sessionStorage.removeItem('impersonatedUserId');
      console.log('[AuthContext] Stopped impersonation, returned to:', realUserProfile.displayName);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    signOut,
    // Impersonation
    isImpersonating,
    realUserProfile,
    impersonateUser,
    stopImpersonation,
  };

  // Always render children - don't block on loading
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
