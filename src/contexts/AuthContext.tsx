'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirebaseAuth,
  logInWithEmailAndPassword,
  registerWithEmailAndPassword,
  logOut,
  sendPasswordReset,
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple,
  signInWithTwitter
} from '../lib/firebase';

// Create a session storage key for persisting user info
const USER_SESSION_KEY = 'auth_user_session';
const USER_LOADING_KEY = 'auth_loading';

// Helper to check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

export interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  googleSignIn: () => Promise<any>;
  facebookSignIn: () => Promise<any>;
  appleSignIn: () => Promise<any>;
  twitterSignIn: () => Promise<any>;
  resetPassword: (email: string) => Promise<boolean>;
}

const defaultValues: AuthContextProps = {
  currentUser: null,
  loading: true,
  login: async () => null,
  register: async () => null,
  logout: async () => {},
  googleSignIn: async () => null,
  facebookSignIn: async () => null,
  appleSignIn: async () => null,
  twitterSignIn: async () => null,
  resetPassword: async () => false
};

const AuthContext = createContext<AuthContextProps>(defaultValues);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check for cached user data to avoid flicker during navigation
  const getCachedUser = (): User | null => {
    if (!isBrowser) return null;

    try {
      const cachedUserJSON = sessionStorage.getItem(USER_SESSION_KEY);
      return cachedUserJSON ? JSON.parse(cachedUserJSON) : null;
    } catch (e) {
      console.error('Error reading cached user:', e);
      return null;
    }
  };

  // Initialize state with cached values if available
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCachedUser());
  const [loading, setLoading] = useState<boolean>(() => {
    // We want to consider auth as still loading if we had a previous session
    if (!isBrowser) return true;

    const cachedLoading = sessionStorage.getItem(USER_LOADING_KEY);
    return cachedLoading ? cachedLoading === 'true' : true;
  });

  // Use a dedicated useEffect for auth state changes to avoid blocking initial render
  useEffect(() => {
    if (!isBrowser) return;

    // Track that we've started loading auth
    sessionStorage.setItem(USER_LOADING_KEY, 'true');

    // Initialize Firebase auth lazily instead of at the top level
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Only include serializable user data
        const serializableUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber,
          emailVerified: user.emailVerified,
          providerId: user.providerId,
          // Add any other properties you need
        };

        // Cache the user data for future page loads
        try {
          if (isBrowser) {
            sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(serializableUser));
          }
        } catch (e) {
          console.error('Error caching user data:', e);
        }
      } else {
        // Clear the cached user data
        if (isBrowser) {
          sessionStorage.removeItem(USER_SESSION_KEY);
        }
      }

      setCurrentUser(user);
      setLoading(false);
      if (isBrowser) {
        sessionStorage.setItem(USER_LOADING_KEY, 'false');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      return await logInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error("Login error in AuthContext:", error);
      throw error;
    }
  };

  const register = (email: string, password: string) => {
    return registerWithEmailAndPassword(email, password);
  };

  const logout = async () => {
    // Clear any cached auth data
    if (isBrowser) {
      sessionStorage.removeItem(USER_SESSION_KEY);
      localStorage.removeItem('wasAuthenticated');
      localStorage.removeItem('isAdmin');
    }
    return logOut();
  };

  const googleSignIn = () => {
    return signInWithGoogle();
  };

  const facebookSignIn = () => {
    return signInWithFacebook();
  };

  const appleSignIn = () => {
    return signInWithApple();
  };

  const twitterSignIn = () => {
    return signInWithTwitter();
  };

  const resetPassword = (email: string) => {
    return sendPasswordReset(email);
  };

  const value: AuthContextProps = {
    currentUser,
    loading,
    login,
    register,
    logout,
    googleSignIn,
    facebookSignIn,
    appleSignIn,
    twitterSignIn,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;