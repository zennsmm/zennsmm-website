import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * Diagnostic endpoint to verify Firebase Admin SDK connectivity.
 * Tests if the SDK can successfully authenticate and list users.
 */
export async function GET() {
  try {
    const auth = adminAuth();
    
    if (!auth) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin SDK not configured. Check FIREBASE_PRIVATE_KEY and CLIENT_EMAIL.' 
      }, { status: 500 });
    }

    // Light check
    const listResult = await auth.listUsers(1);
    const appOptions: any = (auth as any).app.options;

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK connected successfully.',
      projectId: appOptions.projectId,
      serviceAccount: appOptions.credential?.clientEmail || 'masked',
      usersFound: listResult.users.length > 0
    });
  } catch (error: any) {
    console.error('[API TEST] Admin Probe Failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code || 'unknown',
      advice: 'Ensure your FIREBASE_PRIVATE_KEY is correctly formatted with newlines.',
      debug: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        emailSet: !!process.env.FIREBASE_CLIENT_EMAIL,
        keySet: !!process.env.FIREBASE_PRIVATE_KEY
      }
    }, { status: 500 });
  }
}
