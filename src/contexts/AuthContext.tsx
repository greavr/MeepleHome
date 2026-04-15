import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider, FirebaseUser } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  homeId?: string; // Keep for backward compatibility
  homeIds?: string[];
  activeHomeId?: string;
  favoriteGames: string[];
  wishlist: string[];
  bggUsername?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create profile
        const userDoc = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userDoc);
        
        if (!docSnap.exists()) {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            email: firebaseUser.email,
            favoriteGames: [],
            wishlist: [],
            homeIds: [],
          };
          await setDoc(userDoc, newProfile);
          setProfile(newProfile);
        } else {
          const data = docSnap.data() as UserProfile;
          // Migration: if homeId exists but homeIds doesn't
          if (data.homeId && (!data.homeIds || !data.homeIds.includes(data.homeId))) {
            data.homeIds = [...(data.homeIds || []), data.homeId];
            data.activeHomeId = data.activeHomeId || data.homeId;
            await updateDoc(userDoc, { homeIds: data.homeIds, activeHomeId: data.activeHomeId });
          }
          setProfile(data);
          // Listen for profile changes
          onSnapshot(userDoc, (doc) => {
            setProfile(doc.data() as UserProfile);
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDoc = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDoc, data as any);
    } catch (error) {
      console.error("Update Profile Error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
