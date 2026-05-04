import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ensurePersonalWorkspace } from '../services/workspaces';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          setUser(fbUser);
          // Load (or create) profile doc
          const userRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setProfile({ id: fbUser.uid, ...snap.data() });
          } else {
            const newProfile = {
              email: fbUser.email,
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setProfile({ id: fbUser.uid, ...newProfile });
          }
          // Ensure personal workspace exists
          await ensurePersonalWorkspace(fbUser);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[AuthContext] onAuthStateChanged failed:', error);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const signUp = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    // User profile and workspace are created by the auth state listener
    // once the user is signed in and Firestore permissions are fully available.
    return cred.user;
  };

  const signIn = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const signOut = () => fbSignOut(auth);

  const value = {
    user,
    profile,
    displayName: profile?.displayName || user?.displayName || user?.email,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
