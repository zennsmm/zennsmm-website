import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * Diagnostic endpoint to verify Firebase Admin connectivity.
 * Returns {"success": true} only if listUsers(1) succeeds, 
 * which proves that the Service Account is fully authorized.
 */
export async function GET() {
  try {
    const auth = adminAuth();
    
    // Attempt a real operation that requires an access token exchange
    // This definitively proves the credential is valid
    await auth.listUsers(1);

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK is fully authorized.',
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } catch (error: any) {
    console.error('[Admin Test Error]:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code || 'unknown',
      details: 'Check if the private key was copied correctly and restart the server.',
      debug: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        keyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0
      }
    }, { status: 500 });
  }
}
