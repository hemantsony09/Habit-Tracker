'use client'

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration from environment variables
// Values are loaded from .env.local file
// Fallback to hardcoded values if env vars are not available (for development)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

function initializeFirebase() {
  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  const auth = getAuth(app);
  const db = getFirestore(app);
  let analytics = null;

  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (err) {
      console.warn('Analytics initialization failed:', err);
      analytics = null;
    }
  }

  return { app, auth, db, analytics };
}

const initialized = initializeFirebase();

// Export with names that match existing imports
export const auth = initialized.auth;
export const db = initialized.db;
export const analytics = initialized.analytics;
export default initialized.app;
