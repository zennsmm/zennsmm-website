'use server';
/**
 * @fileOverview Resilient Password Reset Auth Sync.
 * Uses verified Firebase Admin SDK for identity management.
 */

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Generates a random secure password.
 */
function generateSecurePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export type AuthSyncResult = {
  success: boolean;
  password?: string;
  message: string;
  code: string;
};

/**
 * Synchronizes a user's password with Firebase Authentication.
 */
export async function syncUserPassword(input: { email: string, requestId: string }): Promise<AuthSyncResult> {
  const sanitizedEmail = input.email?.trim().toLowerCase();
  const requestId = input.requestId;

  if (!sanitizedEmail) {
    return { success: false, message: "Email is required.", code: 'email_missing' };
  }
  
  const tempPass = generateSecurePassword();

  try {
    const auth = adminAuth();
    const db = adminDb();

    if (!auth || !db) {
      throw new Error("Firebase Admin SDK is not initialized.");
    }

    let userRecord;
    let syncAction = 'updated';

    try {
      userRecord = await auth.getUserByEmail(sanitizedEmail);
      console.log("[Password Reset] User found:", userRecord.uid);
      await auth.updateUser(userRecord.uid, { password: tempPass });
      console.log("[Password Reset] Password updated for:", userRecord.uid);
    } catch (lookupError: any) {
      console.log("[Password Reset] User lookup error:", lookupError.code);
      if (lookupError.code === 'auth/user-not-found') {
        console.log("[Password Reset] Creating new user:", sanitizedEmail);
        userRecord = await auth.createUser({
          email: sanitizedEmail,
          password: tempPass,
          emailVerified: true
        });
        console.log("[Password Reset] User created:", userRecord.uid);
        syncAction = 'created';
      } else {
        throw lookupError;
      }
    }

    // Save to Firestore ledger
    console.log("[Password Reset] Updating Firestore document:", requestId);
    await db.collection('password_reset_requests').doc(requestId).update({
      temporaryPassword: tempPass,
      status: 'completed',
      used: false,
      mustChangePassword: true,
      authSyncStatus: 'success',
      syncAction: syncAction,
      targetUid: userRecord.uid,
      generatedAt: FieldValue.serverTimestamp(),
      completedAt: FieldValue.serverTimestamp(),
    });
    
    console.log("[Password Reset] SUCCESS - Password synced to Firebase Auth");
    return { 
      success: true, 
      password: tempPass, 
      message: syncAction === 'created' ? "Account created & synced." : "Auth password updated.",
      code: 'success'
    };

  } catch (err: any) {
    console.error("[Password Reset] Error:", err.message);
    return { 
      success: false, 
      password: tempPass,
      message: `Auth sync failed: ${err.message}`,
      code: 'sync_error'
    };
  }
}

/**
 * Diagnostic function for the debug-auth page.
 */
export async function runAuthDiagnostics(email: string) {
  try {
    const auth = adminAuth();
    const app: any = (auth as any).app;
    
    let lookup: any = null;
    if (email && email.includes('@')) {
      lookup = await auth.getUserByEmail(email)
        .then(u => ({ success: true, uid: u.uid, email: u.email }))
        .catch(e => ({ success: false, error: e.message, code: e.code }));
    }

    return {
      projectId: app.options.projectId,
      serviceAccountEmail: app.options.credential?.clientEmail || 'Unknown',
      lookup
    };
  } catch (err: any) {
    return { error: err.message };
  }
}