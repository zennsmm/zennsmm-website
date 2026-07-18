import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * PRODUCTION-GRADE: Identity Synchronization API
 * 
 * Securely updates a user's cloud credential using the Firebase Admin SDK.
 */
export async function POST(req: Request) {
  try {
    const { userId, tempPassword } = await req.json();

    console.log("[API/reset-password] Initiating Cloud Sync for UID:", userId);

    if (!userId || !tempPassword) {
      return NextResponse.json({ message: "userId and tempPassword are required" }, { status: 400 });
    }

    if (userId === "unknown") {
      return NextResponse.json({ 
        message: "Rejected: userId is 'unknown'. Manual identity verification required." 
      }, { status: 400 });
    }

    const auth = adminAuth();
    if (!auth) {
      throw new Error("Critical Failure: Firebase Admin Auth service unavailable.");
    }

    // Update cloud identity
    try {
      const userRecord = await auth.getUser(userId);
      await auth.updateUser(userId, {
        password: tempPassword,
        emailVerified: true
      });

      console.log(`[API/reset-password] ✅ Identity Synced: ${userId}`);

      return NextResponse.json({ 
        success: true, 
        message: 'Credential successfully synchronized.',
        email: userRecord.email,
        uid: userId
      });
    } catch (lookupError: any) {
      console.error("[API/reset-password] Auth Service Error:", lookupError.code);
      if (lookupError.code === "auth/user-not-found") {
        return NextResponse.json({ message: "Cloud user not found." }, { status: 404 });
      }
      return NextResponse.json({ message: lookupError.message }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[API/reset-password] Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}