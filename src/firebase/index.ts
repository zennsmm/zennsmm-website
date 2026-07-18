import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { useMemo, DependencyList } from 'react';
import { firebaseConfig } from './config';

/**
 * Singleton instances to prevent multiple initializations and state fragmentation.
 * Ensuring the entire app shares exactly one instance of each service.
 */
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let rtdbInstance: Database | undefined;

/**
 * Initializes Firebase with a stable singleton pattern and production-grade persistence.
 */
export function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore; rtdb: Database | null } {
  if (!appInstance) {
    console.log("[Firebase] Initializing production singleton instances...");
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    
    try {
      rtdbInstance = getDatabase(appInstance);
    } catch (e) {
      console.warn("[Firebase] Realtime Database failed to initialize:", e);
    }

    // Set persistence to LOCAL so login survives page refresh and OAuth redirects.
    if (typeof window !== 'undefined') {
      setPersistence(authInstance, browserLocalPersistence).catch((err) => {
        console.error("[Firebase] Persistence initialization failed:", err.code);
      });
    }
  }

  return { 
    app: appInstance, 
    auth: authInstance, 
    db: dbInstance,
    rtdb: rtdbInstance ?? null
  };
}

/**
 * Stabilization helper for Firestore queries and references.
 * Prevents unnecessary re-subscriptions and infinite re-render loops.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
