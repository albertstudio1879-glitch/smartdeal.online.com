
import { Product } from '../types';

const STORAGE_KEY = 'smart_deal_products';
const API_URL_KEY = 'smart_deal_api_url';
const SITE_SETTINGS_KEY = 'smart_deal_site_settings';
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzythvKSwTOuAgIpp1SBf1zT5ZKJGcbwPIWUmMmUZ30B0AMfiRJ6wyV1tssa8V2hPzwqQ/exec';

export interface SiteSettings {
  footerText?: string;
  advertisingUrl?: string;
  blogUrl?: string;
  aboutUrl?: string;
  supportUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  whatsappUrl?: string;
  telegramUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
}

// 1. Priority: User manually entered URL in Admin Panel (LocalStorage)
// 2. Priority: Vercel Environment Variable (Public Deployment)
// 3. Priority: Hardcoded Default
export const getEffectiveApiUrl = (): string => {
  const localUrl = localStorage.getItem(API_URL_KEY);
  if (localUrl) return localUrl;
  
  // This comes from Vercel settings
  // Safely access env to avoid "Cannot read properties of undefined"
  return (import.meta as any)?.env?.VITE_GOOGLE_SHEET_URL || DEFAULT_API_URL;
};

export const getApiUrl = (): string | null => {
  return localStorage.getItem(API_URL_KEY);
};

export const setApiUrl = (url: string) => {
  if (url) {
    localStorage.setItem(API_URL_KEY, url);
  } else {
    localStorage.removeItem(API_URL_KEY);
  }
};

export const getSiteSettings = (): SiteSettings => {
  try {
    const stored = localStorage.getItem(SITE_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Failed to load settings", e);
    return {};
  }
};

export const saveSiteSettings = (settings: SiteSettings) => {
  localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
};

export const getProducts = async (): Promise<Product[]> => {
  const apiUrl = getEffectiveApiUrl();
  
  // 1. Google Sheet Mode (Cloud)
  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl}?action=read`);
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.sort((a: any, b: any) => b.timestamp - a.timestamp);
      }
      return [];
    } catch (e) {
      console.error("API Fetch Error:", e);
      // Fallback to local storage if network fails
    }
  }

  // 2. Local Storage Mode (Fallback)
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const products = JSON.parse(stored);
    return Array.isArray(products) ? products.sort((a, b) => b.timestamp - a.timestamp) : [];
  } catch (e) {
    console.error("Failed to load products from local storage", e);
    return [];
  }
};

export const saveProduct = async (product: Product): Promise<Product[]> => {
  const apiUrl = getEffectiveApiUrl();

  // 1. Google Sheet Mode
  if (apiUrl) {
    try {
      // Check if it's an update or new
      const current = await getProducts();
      const exists = current.find(p => p.id === product.id);
      const action = exists ? 'update' : 'create';

      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, product: product }),
      });
      
      // Wait a moment for sheet to update then re-fetch
      await new Promise(r => setTimeout(r, 1000));
      return await getProducts();
    } catch (e) {
      alert("Failed to save to Cloud Database. Please check internet.");
      return await getProducts();
    }
  }

  // 2. Local Storage Mode
  try {
    const currentProducts = await getProducts();
    const existingIndex = currentProducts.findIndex(p => p.id === product.id);
    
    let updatedProducts;
    if (existingIndex >= 0) {
      updatedProducts = [...currentProducts];
      updatedProducts[existingIndex] = product;
    } else {
      updatedProducts = [product, ...currentProducts];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    return updatedProducts.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error("Failed to save product", e);
    alert("Failed to save. Storage might be full. Try deleting old items or using smaller images.");
    return await getProducts();
  }
};

export const deleteProduct = async (productId: string): Promise<Product[]> => {
  const apiUrl = getEffectiveApiUrl();

  // 1. Google Sheet Mode
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', id: productId }),
      });
      await new Promise(r => setTimeout(r, 1000));
      return await getProducts();
    } catch (e) {
      alert("Failed to delete from Cloud.");
      return await getProducts();
    }
  }

  // 2. Local Storage Mode
  try {
    const currentProducts = await getProducts();
    const updatedProducts = currentProducts.filter(p => p.id !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    return updatedProducts;
  } catch (e) {
    console.error("Failed to delete product", e);
    return await getProducts();
  }
};

export const updateProductInteraction = async (id: string, updates: { likes?: number, dislikes?: number }) => {
  const apiUrl = getEffectiveApiUrl();

  // 1. Google Sheet Mode
  if (apiUrl) {
    // For cloud, we need the full product to update the row.
    // This is expensive, so we do it optimistically in UI, but in background here.
    try {
        const current = await getProducts();
        const product = current.find(p => p.id === id);
        if (product) {
            if (updates.likes !== undefined) product.likes = updates.likes;
            if (updates.dislikes !== undefined) product.dislikes = updates.dislikes;
            
            await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'update', product: product }),
            });
        }
    } catch (e) {
        console.error("Failed to update interactions in cloud", e);
    }
    return;
  }

  // 2. Local Storage Mode
  try {
    const currentProducts = await getProducts();
    const productIndex = currentProducts.findIndex(p => p.id === id);
    if (productIndex === -1) return;
    
    const product = currentProducts[productIndex];
    if (updates.likes !== undefined) product.likes = updates.likes;
    if (updates.dislikes !== undefined) product.dislikes = updates.dislikes;
    
    currentProducts[productIndex] = product;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProducts));
  } catch (e) {
    console.error("Failed to update interaction", e);
  }
};

const CART_KEY = 'smart_deal_cart_items';
const CART_QUANTITIES_KEY = 'smart_deal_cart_quantities';

export const getCartProductIds = (): string[] => {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch (e) {
    console.error("Failed to get cart items", e);
    return [];
  }
};

export const saveCartProductIds = (ids: string[]) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error("Failed to save cart items", e);
  }
};

export const getCartQuantities = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem(CART_QUANTITIES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
};

export const saveCartQuantities = (quantities: Record<string, number>) => {
  try {
    localStorage.setItem(CART_QUANTITIES_KEY, JSON.stringify(quantities));
  } catch (e) {
    console.error("Failed to save cart quantities", e);
  }
};

export const toggleCartProduct = (productId: string, currentIds: string[]): string[] => {
  const exists = currentIds.includes(productId);
  const updated = exists ? currentIds.filter(id => id !== productId) : [...currentIds, productId];
  saveCartProductIds(updated);
  return updated;
};

export interface WishlistEntry {
  id: string;
  addedAt: number; // milliseconds timestamp
}

const WISHLIST_KEY = 'smart_deal_wishlist_items_v2';
const LEGACY_WISHLIST_KEY = 'smart_deal_wishlist_items';

export const getWishlistEntries = (): WishlistEntry[] => {
  try {
    const storedV2 = localStorage.getItem(WISHLIST_KEY);
    if (storedV2 !== null) {
      const parsed = JSON.parse(storedV2);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => {
          if (typeof item === 'string') {
            return { id: item, addedAt: Date.now() - (parsed.length - idx) * 3600000 };
          }
          if (item && typeof item === 'object' && item.id) {
            return {
              id: String(item.id),
              addedAt: typeof item.addedAt === 'number' ? item.addedAt : Date.now()
            };
          }
          return null;
        }).filter((item): item is WishlistEntry => Boolean(item));
      }
    }

    // Check legacy key for existing users
    const legacyStored = localStorage.getItem(LEGACY_WISHLIST_KEY);
    if (legacyStored !== null) {
      const legacyParsed = JSON.parse(legacyStored);
      if (Array.isArray(legacyParsed)) {
        const migrated: WishlistEntry[] = legacyParsed.map((item, idx) => {
          if (typeof item === 'string') {
            return { id: item, addedAt: Date.now() - (legacyParsed.length - idx) * 86400000 };
          }
          if (item && typeof item === 'object' && item.id) {
            return { id: String(item.id), addedAt: typeof item.addedAt === 'number' ? item.addedAt : Date.now() };
          }
          return null;
        }).filter((item): item is WishlistEntry => Boolean(item));

        saveWishlistEntries(migrated);
        return migrated;
      }
    }

    return [];
  } catch (e) {
    console.error("Failed to get wishlist entries", e);
    return [];
  }
};

export const saveWishlistEntries = (entries: WishlistEntry[]) => {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(entries));
    // Also mirror to legacy key for any components reading legacy key
    localStorage.setItem(LEGACY_WISHLIST_KEY, JSON.stringify(entries.map(e => e.id)));
  } catch (e) {
    console.error("Failed to save wishlist items", e);
  }
};

export const getWishlistProductIds = (): string[] => {
  return getWishlistEntries().map(e => e.id);
};

export const saveWishlistProductIds = (ids: string[]) => {
  const currentEntries = getWishlistEntries();
  const entryMap = new Map(currentEntries.map(e => [e.id, e.addedAt]));
  const updatedEntries: WishlistEntry[] = ids.map(id => ({
    id,
    addedAt: entryMap.get(id) || Date.now()
  }));
  saveWishlistEntries(updatedEntries);
};

export const toggleWishlistProduct = (productId: string, currentIds?: string[]): string[] => {
  const currentEntries = getWishlistEntries();
  const exists = currentEntries.some(e => e.id === productId);
  let updatedEntries: WishlistEntry[];
  if (exists) {
    updatedEntries = currentEntries.filter(e => e.id !== productId);
  } else {
    // Add to front with current timestamp
    updatedEntries = [{ id: productId, addedAt: Date.now() }, ...currentEntries];
  }
  saveWishlistEntries(updatedEntries);
  return updatedEntries.map(e => e.id);
};


