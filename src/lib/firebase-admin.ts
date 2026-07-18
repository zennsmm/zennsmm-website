import { cert, getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Standardized Firebase Admin SDK initialization.
 * Restores newlines from environment variables and uses explicit Service Account cert.
 */
export function getAdminApp() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log("[Firebase Admin] Initializing with project:", projectId);

  if (!projectId || !clientEmail || !rawKey) {
    console.error("[Firebase Admin] Missing required env variables");
    console.error("[Firebase Admin] Has FIREBASE_PROJECT_ID:", !!projectId);
    console.error("[Firebase Admin] Has FIREBASE_CLIENT_EMAIL:", !!clientEmail);
    console.error("[Firebase Admin] Has FIREBASE_PRIVATE_KEY:", !!rawKey);
    throw new Error('Missing Firebase Admin environment variables.');
  }

  // Restore true newline characters from string literals
  const privateKey = rawKey.replace(/\\n/g, '\n');

  try {
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    console.log("[Firebase Admin] Successfully initialized");
    return app;
  } catch (err: any) {
    console.error("[Firebase Admin] Initialization error:", err.message);
    throw err;
  }
}

export const adminAuth = () => {
  const app = getAdminApp();
  return getAuth(app);
};

export const adminDb = () => {
  const app = getAdminApp();
  return getFirestore(app);
};
