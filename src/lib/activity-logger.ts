import { addDoc, collection, serverTimestamp, Firestore } from 'firebase/firestore';

/**
 * Global Admin Activity Logger
 */
export async function logActivity(db: Firestore, action: string, userId: string, details?: any) {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      action,
      userId,
      details: details || {},
      timestamp: serverTimestamp(),
      ip: 'Admin Terminal'
    });
  } catch (e) {
    console.warn("[ActivityLog] Failed to record action:", e);
  }
}
