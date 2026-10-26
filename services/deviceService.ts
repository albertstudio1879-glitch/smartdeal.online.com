import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firebase';

export interface DeviceRecord {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  isCurrent?: boolean;
  registeredAt: number;
  lastActiveAt: number;
  location?: string;
}

const DEVICE_ID_KEY = 'smart_deal_stable_device_id_v1';

export function getStableDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return 'dev_fallback_' + Date.now();
  }
}

export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = 'Chrome';
  let os = 'Android';
  let deviceType = 'Chrome Mobile';

  if (/android/i.test(ua)) {
    os = 'Android';
    deviceType = 'Chrome Mobile';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
    deviceType = 'Mobile Device';
  } else if (/win/i.test(ua)) {
    os = 'Windows';
    deviceType = 'Windows PC';
  } else if (/mac/i.test(ua)) {
    os = 'macOS';
    deviceType = 'Macintosh';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
    deviceType = 'Linux PC';
  }

  if (/chrome|crios|crmo/i.test(ua) && !/edge|opr/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari';
    deviceType = deviceType.includes('Mobile') ? 'Safari Mobile' : 'Safari Mac';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/edge/i.test(ua)) {
    browser = 'Edge';
  }

  if (!/mobile|android|iphone/i.test(ua)) {
    deviceType = `${browser} on ${os}`;
  }

  return {
    deviceName: deviceType,
    browser,
    os
  };
}

/**
 * Register or update the current device in Firestore under users/{uid}/devices/{deviceId}
 */
export async function registerCurrentDevice(uid: string): Promise<void> {
  if (!uid) return;
  const deviceId = getStableDeviceId();
  const info = getDeviceInfo();
  const now = Date.now();
  const deviceRef = doc(db, 'users', uid, 'devices', deviceId);

  try {
    const snap = await getDoc(deviceRef);
    if (snap.exists()) {
      await setDoc(deviceRef, {
        lastActiveAt: now
      }, { merge: true });
    } else {
      const newRecord: DeviceRecord = {
        id: deviceId,
        deviceName: info.deviceName,
        browser: info.browser,
        os: info.os,
        registeredAt: now,
        lastActiveAt: now,
        location: 'Online Session'
      };
      await setDoc(deviceRef, newRecord);
    }
  } catch (error) {
    console.error('Failed to register current device:', error);
  }
}

/**
 * Fetch all registered devices for user
 */
export async function fetchUserDevices(uid: string): Promise<DeviceRecord[]> {
  if (!uid) return [];
  const devicesRef = collection(db, 'users', uid, 'devices');
  try {
    const q = query(devicesRef, orderBy('lastActiveAt', 'desc'));
    const snapshot = await getDocs(q);
    const currentDevId = getStableDeviceId();
    return snapshot.docs.map(d => {
      const data = d.data() as DeviceRecord;
      return {
        ...data,
        isCurrent: data.id === currentDevId
      };
    });
  } catch (error) {
    console.error('Failed to fetch devices:', error);
    return [];
  }
}

/**
 * Remove a registered device record
 */
export async function removeDeviceRecord(uid: string, deviceId: string): Promise<void> {
  if (!uid || !deviceId) return;
  const deviceRef = doc(db, 'users', uid, 'devices', deviceId);
  try {
    await deleteDoc(deviceRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/devices/${deviceId}`);
  }
}
