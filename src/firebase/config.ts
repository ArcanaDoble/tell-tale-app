import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const hasValidConfig = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.length > 0
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Analytics | undefined;

if (!hasValidConfig) {
  console.warn('Firebase configuration is incomplete. Please verify your environment variables.');
} else {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    if (typeof window !== 'undefined') {
      void isSupported()
        .then((supported) => {
          if (supported && app != null) {
            analytics = getAnalytics(app);
          }
        })
        .catch(() => {
          analytics = undefined;
        });
    }
  } catch (error) {
    console.warn('Firebase initialization failed. Falling back to demo data.', error);
  }
}

export { app, auth, db, storage, analytics, hasValidConfig as isFirebaseConfigured };
