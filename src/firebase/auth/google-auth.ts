
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Firestore, query, collection, where, getDocs, limit } from 'firebase/firestore';

/**
 * Checks if an email is authorized to receive reseller pricing automatically.
 */
export const checkIfAuthorizedReseller = async (db: Firestore, email: string | null | undefined): Promise<boolean> => {
  if (!db || !email) return false;
  
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const authorizedQuery = query(
      collection(db, 'authorized_resellers'), 
      where('email', '==', normalizedEmail),
      limit(1)
    );
    const authorizedSnap = await getDocs(authorizedQuery);
    return !authorizedSnap.empty;
  } catch (err) {
    console.error('[ResellerCheck] Error checking authorization:', err);
    return false;
  }
};

/**
 * Ensures a user profile exists in Firestore and performs the final dashboard redirect.
 * Includes automatic reseller role assignment based on authorization list.
 * Role persists across logout/login cycles.
 */
export const handlePostSignIn = async (db: Firestore, user: User) => {
  if (!db || !user) return;
  
  console.log('[AuthSync] Post-sign-in verification for:', user.email);

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    // Check authorization list
    const isAuthorizedReseller = await checkIfAuthorizedReseller(db, user.email);

    if (!userSnap.exists()) {
      // Initialize new profile with authorized role
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        balance: 0,
        totalSpent: 0,
        totalOrders: 0,
        role: isAuthorizedReseller ? 'reseller' : 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('[AuthSync] New profile created with role:', isAuthorizedReseller ? 'reseller' : 'user');
    } else {
      // Synchronize existing role based on current authorization
      const currentProfile = userSnap.data();
      
      // Admin role is permanent and never overwritten
      let newRole = currentProfile.role;
      
      if (currentProfile.role === 'admin') {
        newRole = 'admin';
      } else if (isAuthorizedReseller) {
        // If authorized, set as reseller
        newRole = 'reseller';
      } else if (currentProfile.role === 'reseller') {
        // If not authorized but was previously reseller, demote to user
        newRole = 'user';
      }

      await setDoc(userRef, { 
        updatedAt: serverTimestamp(),
        role: newRole,
        // Ensure email and display name are current
        email: user.email || currentProfile.email,
        displayName: user.displayName || currentProfile.displayName
      }, { merge: true });
      
      console.log('[AuthSync] Profile synchronized. Current Role:', newRole, 'Authorized:', isAuthorizedReseller);
    }
    
    // Redirect to order page
    if (typeof window !== 'undefined') {
      window.location.href = '/order';
    }
  } catch (err) {
    console.error("[AuthSync] Critical verification failure:", err);
    if (typeof window !== 'undefined') {
      window.location.href = '/order';
    }
  }
};

/**
 * Google Sign-In with popup -> redirect fallback strategy.
 */
export const signInWithGoogle = async (db: Firestore) => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({
    prompt: 'select_account',
    access_type: 'online'
  });

  console.log('[GoogleAuth] Initiating session.');

  try {
    const result = await signInWithPopup(auth, provider);
    await handlePostSignIn(db, result.user);
    return result.user;
  } catch (error: any) {
    console.error('[GoogleAuth] Popup failed:', error.code, error.message);

    if (
      error.code === 'auth/popup-blocked' || 
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('[GoogleAuth] Switching to Redirect Mode');
      return signInWithRedirect(auth, provider);
    }
    throw error;
  }
};
