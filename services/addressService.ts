import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface AddressRecord {
  id: string;
  fullName: string;
  phoneNumber: string;
  houseName: string;
  houseNumber?: string;
  street: string;
  landmark?: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  addressType: 'Home' | 'Work' | 'Other';
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Fetch all saved addresses for a user
 */
export async function fetchUserAddresses(uid: string): Promise<AddressRecord[]> {
  if (!uid) return [];
  const addressesRef = collection(db, 'users', uid, 'addresses');
  try {
    const q = query(addressesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as AddressRecord);
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
    return [];
  }
}

/**
 * Save a new address or update an existing one
 */
export async function saveAddressRecord(uid: string, address: AddressRecord): Promise<void> {
  if (!uid || !address.id) return;
  const addressRef = doc(db, 'users', uid, 'addresses', address.id);
  try {
    const batch = writeBatch(db);

    // If setting as default, unset existing default addresses
    if (address.isDefault) {
      const existing = await getDocs(collection(db, 'users', uid, 'addresses'));
      existing.docs.forEach(d => {
        if (d.id !== address.id && (d.data() as AddressRecord).isDefault) {
          batch.update(doc(db, 'users', uid, 'addresses', d.id), { isDefault: false, updatedAt: Date.now() });
        }
      });
    }

    batch.set(addressRef, address, { merge: true });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/addresses/${address.id}`);
  }
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(uid: string, addressId: string): Promise<void> {
  if (!uid || !addressId) return;
  try {
    const batch = writeBatch(db);
    const addressesSnap = await getDocs(collection(db, 'users', uid, 'addresses'));
    
    addressesSnap.docs.forEach(d => {
      const isTarget = d.id === addressId;
      batch.update(doc(db, 'users', uid, 'addresses', d.id), { 
        isDefault: isTarget, 
        updatedAt: Date.now() 
      });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/addresses/${addressId}`);
  }
}

/**
 * Delete an address record
 */
export async function deleteAddressRecord(uid: string, addressId: string): Promise<void> {
  if (!uid || !addressId) return;
  const addressRef = doc(db, 'users', uid, 'addresses', addressId);
  try {
    await deleteDoc(addressRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/addresses/${addressId}`);
  }
}
