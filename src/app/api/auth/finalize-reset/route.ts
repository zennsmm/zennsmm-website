import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * PRODUCTION-GRADE: Identity Synchronization API
 * 
 * Securely updates a user's password in Firebase Auth and cleans up recovery tokens.
 */
export async function POST(req: Request) {
  try {
    const { email, newPassword, requestId } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ message: "Email and new password are required" }, { status: 400 });
    }

    const auth = adminAuth();
    const db = adminDb();

    if (!auth || !db) {
      throw new Error("Critical Failure: Identity services unavailable.");
    }

    // 1. Find User in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email.toLowerCase().trim());
    } catch (lookupError: any) {
      if (lookupError.code === 'auth/user-not-found') {
        return NextResponse.json({ message: "Cloud identity not found. Please register first." }, { status: 404 });
      }
      throw lookupError;
    }

    // 2. Update Cloud Credential
    await auth.updateUser(userRecord.uid, {
      password: newPassword,
      emailVerified: true
    });

    // 3. Cleanup Recovery Ledger
    if (requestId && requestId !== 'manual') {
      await db.collection('password_reset_requests').doc(requestId).update({
        status: 'completed',
        used: true,
        temporaryPassword: null, // Wipe sensitive data from ledger
        finalizedAt: FieldValue.serverTimestamp(),
      });
    }

    // 4. Update User Profile Flag
    await db.collection('users').doc(userRecord.uid).update({
      mustChangePassword: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[API/finalize-reset] ✅ Identity fully synchronized for: ${email}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Credential successfully synchronized.'
    });

  } catch (error: any) {
    console.error('[API/finalize-reset] Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
