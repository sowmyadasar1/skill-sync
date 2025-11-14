// src/lib/firebase.ts
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, GithubAuthProvider } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseEnabled = false;
let githubProvider: GithubAuthProvider | null = null;

// Initialize Firebase only if the API key and project ID are provided
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        githubProvider = new GithubAuthProvider();
        isFirebaseEnabled = true;
    } catch (e) {
        console.error("Failed to initialize Firebase. Please check your .env configuration.", e);
        isFirebaseEnabled = false;
    }
} else {
    console.warn("Firebase configuration is missing. Authentication and database features will be disabled. Please add your credentials to the .env file.");
}


export { app, auth, db, isFirebaseEnabled, githubProvider };
