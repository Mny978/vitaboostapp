import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getAnalytics,
  isSupported,
  logEvent as fbLogEvent,
  setUserId,
  setUserProperties,
  Analytics,
} from 'firebase/analytics';
import firebaseConfigData from '../../firebase-applet-config.json';
import { UserProfile, DailyTracking, DietPlan } from '../types';

export const GA_MEASUREMENT_ID = 'G-413294831';

export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  measurementId: firebaseConfigData.measurementId || GA_MEASUREMENT_ID,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore
export const db = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Analytics
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(app);
          console.log('[VitaBoost Diagnostic] Google Analytics connected with ID: G-413294831');
        } catch (e) {
          console.warn('[VitaBoost Diagnostic] Google Analytics init skipped:', e);
        }
      }
    })
    .catch((err) => {
      console.warn('[VitaBoost Diagnostic] Analytics isSupported check skipped:', err);
    });
}


/**
 * Analytics Logger & User Property Tracker (Dual Firebase Analytics + gtag.js)
 */
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (analytics) {
    try {
      fbLogEvent(analytics, eventName, eventParams);
    } catch (e) {
      console.warn('Analytics event tracking error:', e);
    }
  }
  if (typeof window !== 'undefined' && (window as any).gtag) {
    try {
      (window as any).gtag('event', eventName, eventParams);
    } catch (e) {
      console.warn('gtag tracking error:', e);
    }
  }
}

export function setAnalyticsUser(user: User | null) {
  if (user) {
    if (analytics) {
      try {
        setUserId(analytics, user.uid);
        setUserProperties(analytics, {
          email: user.email || 'anonymous',
          is_anonymous: user.isAnonymous ? 'yes' : 'no',
        });
      } catch (e) {
        console.warn('Error setting analytics user:', e);
      }
    }
    if (typeof window !== 'undefined' && (window as any).gtag) {
      try {
        (window as any).gtag('set', 'user_properties', {
          user_id: user.uid,
          email: user.email || 'anonymous',
        });
        (window as any).gtag('config', GA_MEASUREMENT_ID, {
          user_id: user.uid,
        });
      } catch (e) {
        console.warn('gtag set user error:', e);
      }
    }
  }
}

/**
 * Sign In with Google
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    setAnalyticsUser(result.user);
    trackEvent('login', { method: 'google' });
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  }
}

/**
 * Sign In / Sign Up with Email (e.g. patelmanya73@gmail.com)
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    setAnalyticsUser(cred.user);
    trackEvent('login', { method: 'email' });
    return cred.user;
  } catch (error: any) {
    // If user not found, try creating account automatically
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, email, password);
        setAnalyticsUser(newCred.user);
        trackEvent('sign_up', { method: 'email' });
        return newCred.user;
      } catch (createErr: any) {
        throw createErr;
      }
    }
    throw error;
  }
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
    trackEvent('logout');
  } catch (err) {
    console.warn('[VitaBoost Diagnostic] Logout error:', err);
  }
}

/**
 * Validate connection to Firestore
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    console.warn('[VitaBoost Diagnostic] Firestore connection status:', error?.message || error);
    return false;
  }
}


/**
 * Auth state listener
 */
export function initAuthListener(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      setAnalyticsUser(user);
      callback(user);
    } else {
      try {
        // Silently sign in anonymously so user data is never lost
        const cred = await signInAnonymously(auth);
        setAnalyticsUser(cred.user);
        callback(cred.user);
      } catch (err) {
        console.warn('Anonymous auth initialization skipped:', err);
        callback(null);
      }
    }
  });
}

/**
 * Cloud Sync: Save User Profile
 */
export async function syncProfileToFirestore(userId: string, profile: UserProfile) {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        weight: profile.weight,
        height: profile.height,
        activity: profile.activity,
        dietaryPreference: profile.dietaryPreference,
        goal: profile.goal,
        medicalConditions: profile.medicalConditions,
        allergies: profile.allergies,
        likesDislikes: profile.likesDislikes,
        assessment: profile.assessment,
        aiSummary: profile.aiSummary || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    trackEvent('profile_updated', { goal: profile.goal, diet: profile.dietaryPreference });
    return true;
  } catch (e) {
    console.error('Failed to sync profile to Firestore:', e);
    return false;
  }
}

/**
 * Cloud Sync: Load User Profile
 */
export async function loadProfileFromFirestore(userId: string): Promise<Partial<UserProfile> | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as Partial<UserProfile>;
    }
  } catch (e) {
    console.warn('Error loading profile from Firestore:', e);
  }
  return null;
}

/**
 * Cloud Sync: Save Daily Tracking
 */
export async function syncTrackingToFirestore(userId: string, tracking: DailyTracking) {
  try {
    const dateKey = tracking.date || new Date().toISOString().split('T')[0];
    const trackRef = doc(db, 'users', userId, 'tracking', dateKey);
    await setDoc(
      trackRef,
      {
        date: dateKey,
        waterIntakeMl: tracking.waterIntakeMl,
        fruitVegServings: tracking.fruitVegServings,
        mealLog: tracking.mealLog,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    trackEvent('tracking_synced', { waterMl: tracking.waterIntakeMl, mealsCount: tracking.mealLog.length });
    return true;
  } catch (e) {
    console.error('Failed to sync daily tracking to Firestore:', e);
    return false;
  }
}

/**
 * Cloud Sync: Save Diet Plan
 */
export async function syncDietPlanToFirestore(userId: string, plan: DietPlan) {
  try {
    const planId = 'active_plan';
    const planRef = doc(db, 'users', userId, 'plans', planId);
    await setDoc(
      planRef,
      {
        ...plan,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    trackEvent('diet_plan_saved', { days: plan.days?.length || 3 });
    return true;
  } catch (e) {
    console.error('Failed to sync diet plan to Firestore:', e);
    return false;
  }
}
