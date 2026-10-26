import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult, 
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
  phoneNumber?: string | null;
  email?: string | null;
  displayName: string;
  avatar?: string;
  role: 'customer' | 'admin';
  createdAt: number;
  lastLoginAt: number;
}

export interface OtpSession {
  verificationId: string;
  identifier: string; // phone number
  type: 'phone';
  expiresAt: number; // 5 minutes (300,000 ms)
  resendAvailableAt: number; // 30 seconds
  attempts: number;
  maxAttempts: number;
}

const LOCAL_USER_KEY = 'smart_deal_logged_in_user_v1';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_VERIFICATION_ATTEMPTS = 5;

// In-memory verification cache for active flows
let activeConfirmationResult: ConfirmationResult | null = null;
let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

// Ensure Recaptcha container exists in DOM
function ensureRecaptchaContainer(): HTMLElement {
  let el = document.getElementById('recaptcha-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'recaptcha-container';
    el.className = 'fixed bottom-4 left-4 z-[9999] pointer-events-auto';
    document.body.appendChild(el);
  }
  return el;
}

// Clear recaptcha instance
export function clearRecaptchaVerifier() {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {
      // ignore
    }
    activeRecaptchaVerifier = null;
  }
  const el = document.getElementById('recaptcha-container');
  if (el) el.innerHTML = '';
}

/**
 * 1. Send SMS OTP via Firebase Phone Auth (`signInWithPhoneNumber` & `RecaptchaVerifier`)
 */
export async function sendPhoneOtp(rawPhoneNumber: string): Promise<{ success: boolean; session?: OtpSession; message?: string }> {
  try {
    // Format phone number with country code (+91 default for India if 10 digits)
    let cleaned = rawPhoneNumber.replace(/[^0-9+]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = `+91${cleaned}`;
      } else {
        return { success: false, message: 'Please enter a valid 10-digit mobile number with country code (e.g. +91 9876543210).' };
      }
    }

    if (cleaned.length < 10) {
      return { success: false, message: 'Phone number is too short. Please include country code and 10 digits.' };
    }

    ensureRecaptchaContainer();
    clearRecaptchaVerifier();

    // Create reCAPTCHA verifier in invisible mode for Google AI Studio preview domain
    activeRecaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved successfully
      },
      'expired-callback': () => {
        clearRecaptchaVerifier();
      }
    });

    // Use official Firebase signInWithPhoneNumber
    const confirmationResult = await signInWithPhoneNumber(auth, cleaned, activeRecaptchaVerifier);
    activeConfirmationResult = confirmationResult;

    const now = Date.now();
    const session: OtpSession = {
      verificationId: confirmationResult.verificationId || `phone_${now}`,
      identifier: cleaned,
      type: 'phone',
      expiresAt: now + OTP_EXPIRY_MS,
      resendAvailableAt: now + RESEND_COOLDOWN_MS,
      attempts: 0,
      maxAttempts: MAX_VERIFICATION_ATTEMPTS
    };

    return {
      success: true,
      session,
      message: `OTP sent successfully to ${cleaned} via SMS.`
    };
  } catch (error: any) {
    clearRecaptchaVerifier();
    console.error('sendPhoneOtp error:', error);
    let msg = 'Failed to send SMS OTP. Please check your network and mobile number.';
    if (error?.code === 'auth/invalid-phone-number') {
      msg = 'Invalid phone number format. Please check the mobile number.';
    } else if (error?.code === 'auth/too-many-requests') {
      msg = 'Too many requests. Please wait a few moments before trying again.';
    } else if (error?.code === 'auth/quota-exceeded') {
      msg = 'SMS service quota reached. Please try again shortly.';
    } else if (error?.code === 'auth/operation-not-allowed') {
      msg = 'Phone authentication is not enabled in Firebase Console. Please enable Phone Auth under Authentication > Sign-in method in Firebase Console for project "smart-deal-faabd".';
    } else if (error?.message) {
      msg = error.message;
    }
    return { success: false, message: msg };
  }
}

/**
 * 2. Verify Phone OTP
 */
export async function verifyPhoneOtp(
  session: OtpSession, 
  otpCode: string
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  try {
    const now = Date.now();
    if (now > session.expiresAt) {
      return { success: false, message: 'OTP has expired (valid for 5 minutes). Please click Resend OTP.' };
    }

    if (session.attempts >= session.maxAttempts) {
      return { success: false, message: 'Maximum verification attempts (5) exceeded. Please request a new OTP.' };
    }

    if (!activeConfirmationResult) {
      return { success: false, message: 'Verification session expired. Please request a new OTP.' };
    }

    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      return { success: false, message: 'Please enter the complete 6-digit OTP code.' };
    }

    // Confirm with Firebase Phone Auth confirmationResult
    const userCredential = await activeConfirmationResult.confirm(cleanCode);
    const fbUser = userCredential.user;

    // Retrieve or create UserAccount profile in Firestore
    const userAccount = await syncUserProfile(fbUser, {
      phoneNumber: session.identifier,
      displayName: `User ${session.identifier.slice(-4)}`
    });

    // Clear active session
    activeConfirmationResult = null;
    clearRecaptchaVerifier();

    return { success: true, user: userAccount };
  } catch (error: any) {
    session.attempts += 1;
    console.error('verifyPhoneOtp error:', error);
    let msg = 'Incorrect OTP. Please enter the valid 6-digit code received on your phone.';
    if (error?.code === 'auth/invalid-verification-code') {
      const remaining = session.maxAttempts - session.attempts;
      msg = remaining > 0 
        ? `Incorrect OTP. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
        : 'Maximum verification attempts exceeded. Please request a new OTP.';
    } else if (error?.code === 'auth/code-expired') {
      msg = 'OTP has expired. Please click Resend OTP.';
    }
    return { success: false, message: msg };
  }
}

/**
 * 3. Sync User Profile in Firestore & Local Storage
 */
async function syncUserProfile(
  fbUser: FirebaseUser, 
  overrides?: { phoneNumber?: string; displayName?: string }
): Promise<UserAccount> {
  const now = Date.now();
  const uid = fbUser.uid;
  let userProfile: UserAccount;

  try {
    const userDocRef = doc(db, 'users', uid);
    const existingSnap = await getDoc(userDocRef);

    if (existingSnap.exists()) {
      const data = existingSnap.data() as UserAccount;
      userProfile = {
        ...data,
        phoneNumber: overrides?.phoneNumber || data.phoneNumber || fbUser.phoneNumber || null,
        displayName: overrides?.displayName || data.displayName || 'Smart Deal Member',
        lastLoginAt: now
      };
      await updateDoc(userDocRef, {
        lastLoginAt: now,
        updatedAt: now,
        ...(overrides?.phoneNumber ? { phoneNumber: overrides.phoneNumber } : {})
      });
    } else {
      userProfile = {
        uid,
        phoneNumber: overrides?.phoneNumber || fbUser.phoneNumber || null,
        displayName: overrides?.displayName || (overrides?.phoneNumber ? `User ${overrides.phoneNumber.slice(-4)}` : 'Smart Deal Member'),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(overrides?.displayName || uid)}`,
        role: 'customer',
        createdAt: now,
        lastLoginAt: now
      };
      await setDoc(userDocRef, {
        id: uid,
        ...userProfile
      });
    }
  } catch (err) {
    userProfile = {
      uid,
      phoneNumber: overrides?.phoneNumber || fbUser.phoneNumber || null,
      displayName: overrides?.displayName || 'Smart Deal Member',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(uid)}`,
      role: 'customer',
      createdAt: now,
      lastLoginAt: now
    };
  }

  saveLocalUser(userProfile);
  return userProfile;
}

/**
 * 4. Storage & Auth State Listeners
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
  clearRecaptchaVerifier();
}

/**
 * Listen to auth changes and sync with local storage
 */
export function initAuthListener(onUserChange: (user: UserAccount | null) => void): () => void {
  const cached = getLocalUser();
  if (cached) {
    onUserChange(cached);
  }

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
        }
      } catch {
        // fallback
      }
      if (cached) {
        onUserChange(cached);
      }
    }
  });

  return unsubscribe;
}
