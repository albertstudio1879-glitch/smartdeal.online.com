import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  WishlistEntry, 
  getCartProductIds, 
  saveCartProductIds, 
  getCartQuantities, 
  saveCartQuantities, 
  getWishlistEntries, 
  saveWishlistEntries 
} from './storageService';

export interface CloudCartItem {
  productId: string;
  quantity: number;
  addedAt: number;
}

export interface CloudWishlistItem {
  productId: string;
  addedAt: number;
}

/**
 * Sets up real-time Firestore synchronization for Cart and Wishlist
 */
export function setupCloudSync(
  uid: string, 
  onCartSync: (ids: string[], quantities: Record<string, number>) => void,
  onWishlistSync: (entries: WishlistEntry[]) => void
): () => void {
  const cartRef = collection(db, 'users', uid, 'cart');
  const wishlistRef = collection(db, 'users', uid, 'wishlist');

  // Initial migration check: if cloud is empty and local has items, push local to cloud
  (async () => {
    try {
      const cartSnap = await getDocs(cartRef);
      const wishlistSnap = await getDocs(wishlistRef);

      if (cartSnap.empty && wishlistSnap.empty) {
        const localCart = getCartProductIds();
        const localQuantities = getCartQuantities();
        const localWishlist = getWishlistEntries();

        if (localCart.length > 0 || localWishlist.length > 0) {
          const batch = writeBatch(db);
          localCart.forEach(id => {
            const itemRef = doc(cartRef, id);
            batch.set(itemRef, {
              productId: id,
              quantity: localQuantities[id] || 1,
              addedAt: Date.now()
            });
          });
          localWishlist.forEach(w => {
            const itemRef = doc(wishlistRef, w.id);
            batch.set(itemRef, {
              productId: w.id,
              addedAt: w.addedAt
            });
          });
          await batch.commit();
        }
      }
    } catch (err) {
      console.error('Initial cloud migration sync error:', err);
    }
  })();

  // Real-time listener for Cart
  const unsubCart = onSnapshot(cartRef, (snapshot) => {
    const ids: string[] = [];
    const quantities: Record<string, number> = {};
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as CloudCartItem;
      if (data && data.productId) {
        ids.push(data.productId);
        quantities[data.productId] = data.quantity || 1;
      }
    });
    saveCartProductIds(ids);
    saveCartQuantities(quantities);
    onCartSync(ids, quantities);
  }, (err) => {
    console.error('Cart snapshot sync error:', err);
  });

  // Real-time listener for Wishlist
  const unsubWishlist = onSnapshot(wishlistRef, (snapshot) => {
    const entries: WishlistEntry[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as CloudWishlistItem;
      if (data && data.productId) {
        entries.push({
          id: data.productId,
          addedAt: data.addedAt || Date.now()
        });
      }
    });
    // Sort by addedAt descending (newest first)
    entries.sort((a, b) => b.addedAt - a.addedAt);
    saveWishlistEntries(entries);
    onWishlistSync(entries);
  }, (err) => {
    console.error('Wishlist snapshot sync error:', err);
  });

  return () => {
    unsubCart();
    unsubWishlist();
  };
}

// Cloud mutation functions
export async function cloudAddCartItem(uid: string, productId: string, quantity: number = 1) {
  try {
    const ref = doc(db, 'users', uid, 'cart', productId);
    await setDoc(ref, {
      productId,
      quantity,
      addedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('cloudAddCartItem error:', err);
  }
}

export async function cloudRemoveCartItem(uid: string, productId: string) {
  try {
    const ref = doc(db, 'users', uid, 'cart', productId);
    await deleteDoc(ref);
  } catch (err) {
    console.error('cloudRemoveCartItem error:', err);
  }
}

export async function cloudClearCartCloud(uid: string, currentIds: string[]) {
  try {
    const batch = writeBatch(db);
    currentIds.forEach(id => {
      const ref = doc(db, 'users', uid, 'cart', id);
      batch.delete(ref);
    });
    await batch.commit();
  } catch (err) {
    console.error('cloudClearCartCloud error:', err);
  }
}

export async function cloudAddWishlistItem(uid: string, productId: string) {
  try {
    const ref = doc(db, 'users', uid, 'wishlist', productId);
    await setDoc(ref, {
      productId,
      addedAt: Date.now()
    });
  } catch (err) {
    console.error('cloudAddWishlistItem error:', err);
  }
}

export async function cloudRemoveWishlistItem(uid: string, productId: string) {
  try {
    const ref = doc(db, 'users', uid, 'wishlist', productId);
    await deleteDoc(ref);
  } catch (err) {
    console.error('cloudRemoveWishlistItem error:', err);
  }
}

export async function cloudClearWishlistCloud(uid: string, currentIds: string[]) {
  try {
    const batch = writeBatch(db);
    currentIds.forEach(id => {
      const ref = doc(db, 'users', uid, 'wishlist', id);
      batch.delete(ref);
    });
    await batch.commit();
  } catch (err) {
    console.error('cloudClearWishlistCloud error:', err);
  }
}
