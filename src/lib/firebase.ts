import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  connectAuthEmulator,
  Auth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  fetchSignInMethodsForEmail
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase lazily to prevent blocking the main thread
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let facebookProvider: FacebookAuthProvider | undefined;
let appleProvider: OAuthProvider | undefined;
let twitterProvider: TwitterAuthProvider | undefined;

// Lazy initialization function
const initializeFirebase = () => {
  try {
    // Check if Firebase config values are present
    const hasAllConfig = Object.values(firebaseConfig).every(value => value !== undefined && value !== null && value !== '');

    if (!hasAllConfig) {
      console.error('Firebase configuration is incomplete:', firebaseConfig);
      throw new Error('Firebase configuration is incomplete. Check your environment variables.');
    }

    if (!app) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      facebookProvider = new FacebookAuthProvider();
      appleProvider = new OAuthProvider('apple.com');
      twitterProvider = new TwitterAuthProvider();

      // Verify initialization succeeded
      if (!auth || !googleProvider || !facebookProvider || !appleProvider || !twitterProvider) {
        throw new Error('Firebase auth or providers failed to initialize');
      }
    }

    return {
      app,
      auth: auth!,
      googleProvider: googleProvider!,
      facebookProvider: facebookProvider!,
      appleProvider: appleProvider!,
      twitterProvider: twitterProvider!
    };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

// Authentication functions with lazy initialization
export const getFirebaseAuth = () => {
  const { auth } = initializeFirebase();
  return auth;
};

export const logInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    // Check if email and password are provided
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const { auth } = initializeFirebase();

    // Verify auth is initialized
    if (!auth) {
      throw new Error('Firebase auth failed to initialize');
    }

    return await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
};

export const registerWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const { auth } = initializeFirebase();
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const sendPasswordReset = async (email: string) => {
  try {
    const { auth } = initializeFirebase();
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const signInWithGoogle = async () => {
  try {
    const { auth, googleProvider } = initializeFirebase();
    // Set prompt parameter to 'select_account' to force account selection
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const signInWithFacebook = async () => {
  try {
    const { auth, facebookProvider } = initializeFirebase();
    return await signInWithPopup(auth, facebookProvider);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const signInWithApple = async () => {
  try {
    const { auth, appleProvider } = initializeFirebase();
    return await signInWithPopup(auth, appleProvider);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const signInWithTwitter = async () => {
  try {
    const { auth, twitterProvider } = initializeFirebase();
    return await signInWithPopup(auth, twitterProvider);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const logOut = async () => {
  try {
    // Clear user favorites from localStorage on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_favorites');
    }

    const { auth } = initializeFirebase();
    return await signOut(auth);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Reauthenticate with email/password
export const reauthenticateUser = async (email: string, password: string) => {
  try {
    const { auth } = initializeFirebase();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user is currently logged in');
    }

    // Create credential
    const credential = EmailAuthProvider.credential(email, password);

    // Reauthenticate
    return await reauthenticateWithCredential(user, credential);
  } catch (err) {
    console.error('Reauthentication failed:', err);
    throw err;
  }
};

// Update user password
export const updateUserPassword = async (newPassword: string) => {
  try {
    const { auth } = initializeFirebase();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user is currently logged in');
    }

    return await updatePassword(user, newPassword);
  } catch (err) {
    console.error('Password update failed:', err);
    throw err;
  }
};

export { getAuth, fetchSignInMethodsForEmail };