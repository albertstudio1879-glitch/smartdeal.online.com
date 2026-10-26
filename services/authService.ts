import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  signOut as fbSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserAccount {
  uid: string;
  email?: string | null;
  displayName: string;
  avatar?: string;
  role: 'customer' | 'admin';
  createdAt: number;
  lastLoginAt: number;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

const LOCAL_USER_KEY = 'smart_deal_logged_in_user_v1';

/**
 * 1. Sign in with Google using Firebase GoogleAuthProvider & signInWithPopup
 */
export async function loginWithGoogle(): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    const userAccount = await syncUserProfile(fbUser);
    return { success: true, user: userAccount };
  } catch (error: any) {
    console.error('loginWithGoogle error:', error);
    let msg = 'Failed to sign in with Google. Please try again.';
    if (error?.code === 'auth/popup-closed-by-user') {
      msg = 'Sign-in cancelled. Please try again when ready.';
    } else if (error?.code === 'auth/popup-blocked') {
      msg = 'Pop-up blocked by your browser. Please allow pop-ups for this site.';
    } else if (error?.code === 'auth/unauthorized-domain') {
      msg = 'This domain is not authorized in the Firebase Console. Please add this domain under Authentication > Settings > Authorized domains in Firebase.';
    } else if (error?.message) {
      msg = error.message;
    }
    return { success: false, message: msg };
  }
}

/**
 * 2. Sync User Profile in Firestore & Local Storage
 */
async function syncUserProfile(fbUser: FirebaseUser): Promise<UserAccount> {
  const now = Date.now();
  const uid = fbUser.uid;
  const email = fbUser.email || null;
  const displayName = fbUser.displayName || email?.split('@')[0] || 'Smart Deal Member';
  const avatar = fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
  const defaultFirstName = displayName.split(' ')[0] || '';
  const defaultLastName = displayName.split(' ').slice(1).join(' ') || '';

  let userProfile: UserAccount;

  try {
    const userDocRef = doc(db, 'users', uid);
    const existingSnap = await getDoc(userDocRef);

    if (existingSnap.exists()) {
      const data = existingSnap.data() as UserAccount;
      userProfile = {
        ...data,
        email: email || data.email || null,
        displayName: data.displayName || displayName,
        avatar: data.avatar || avatar,
        firstName: data.firstName !== undefined ? data.firstName : defaultFirstName,
        lastName: data.lastName !== undefined ? data.lastName : defaultLastName,
        phoneNumber: data.phoneNumber || '',
        lastLoginAt: now
      };
      await updateDoc(userDocRef, {
        lastLoginAt: now,
        updatedAt: now,
        email: email || data.email || null,
        displayName: data.displayName || displayName,
        avatar: data.avatar || avatar
      });
    } else {
      userProfile = {
        id: uid,
        uid,
        email,
        displayName,
        avatar,
        firstName: defaultFirstName,
        lastName: defaultLastName,
        phoneNumber: '',
        role: 'customer',
        createdAt: now,
        lastLoginAt: now
      } as any;
      await setDoc(userDocRef, userProfile);
    }
  } catch (err) {
    console.error('Firestore user sync error:', err);
    userProfile = {
      uid,
      email,
      displayName,
      avatar,
      firstName: defaultFirstName,
      lastName: defaultLastName,
      phoneNumber: '',
      role: 'customer',
      createdAt: now,
      lastLoginAt: now
    };
  }

  saveLocalUser(userProfile);
  return userProfile;
}

/**
 * 3. Storage & Auth State Management
 */
export function getLocalUser(): UserAccount | null {
  try {
    const stored = localStorage.getItem(LOCAL_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveLocalUser(user: UserAccount | null) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch {
    // ignore
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch {
    // ignore
  }
  saveLocalUser(null);
  try {
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem('smart_deal_cart_guest');
    localStorage.removeItem('smart_deal_cart_quantities_guest');
    localStorage.removeItem('smart_deal_guest_wishlist_v2');
    localStorage.removeItem('smart_deal_guest_wishlist');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('smart_deal_cart_') || key.includes('smart_deal_wishlist_') || key.includes('smart_deal_migrated_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch {
    // ignore
  }
}

/**
 * Listen to auth changes and sync with local storage
 */
export function initAuthListener(onUserChange: (user: UserAccount | null) => void): () => void {
  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const profile = snap.data() as UserAccount;
          saveLocalUser(profile);
          onUserChange(profile);
          return;
        } else {
          const profile = await syncUserProfile(fbUser);
          onUserChange(profile);
          return;
        }
      } catch (err) {
        console.error('Auth state sync error:', err);
      }
      const cached = getLocalUser();
      if (cached) {
        onUserChange(cached);
      } else {
        onUserChange({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Smart Deal Member',
          avatar: fbUser.photoURL || '',
          firstName: fbUser.displayName?.split(' ')[0] || '',
          lastName: fbUser.displayName?.split(' ').slice(1).join(' ') || '',
          phoneNumber: '',
          role: 'customer',
          createdAt: Date.now(),
          lastLoginAt: Date.now()
        });
      }
    } else {
      saveLocalUser(null);
      onUserChange(null);
    }
  });

  return unsubscribe;
}
