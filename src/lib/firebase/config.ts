"use client";

/**
 * Firebase — lazy-initialized singleton.
 * Dynamic imports keep the Firebase bundle out of the initial JS chunk
 * and only load each service when it's actually used.
 */

import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let _appPromise: Promise<FirebaseApp> | null = null;
let _firestorePromise: Promise<Firestore> | null = null;
let _authPromise: Promise<Auth> | null = null;

export const getFirebaseApp = (): Promise<FirebaseApp> => {
  if (!_appPromise) {
    _appPromise = import("firebase/app").then(({ initializeApp, getApps, getApp }) =>
      getApps().length ? getApp() : initializeApp(firebaseConfig),
    );
  }
  return _appPromise;
};

export const getFirebaseAuth = async (): Promise<Auth> => {
  if (!_authPromise) {
    _authPromise = (async () => {
      const [app, { getAuth }] = await Promise.all([
        getFirebaseApp(),
        import("firebase/auth"),
      ]);
      return getAuth(app);
    })();
  }
  return _authPromise;
};

export const getFirebaseFirestore = async (): Promise<Firestore> => {
  if (!_firestorePromise) {
    _firestorePromise = (async () => {
      const [app, { getFirestore }] = await Promise.all([
        getFirebaseApp(),
        import("firebase/firestore"),
      ]);
      return getFirestore(app);
    })();
  }
  return _firestorePromise;
};
