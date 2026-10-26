import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { Language, getTranslation } from '../utils/translations';
import { 
  X, Trash2, Zap, ChevronDown, 
  Info, ArrowRight, ShoppingCart, Heart, Calendar, ArrowLeft, RefreshCw
} from 'lucide-react';
import { WishlistEntry, getWishlistEntries, getCartQuantities, saveCartQuantities } from '../services/storageService';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartProductIds?: string[];
  products?: Product[];
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  onProductClick: (id: string) => void;
  onBuyItem: (product: Product) => void;
  lang?: Language;
  wishlistProductIds?: string[];
  wishlistEntries?: WishlistEntry[];
  onToggleWishlist?: (id: string) => void;
  onClearWishlist?: () => void;
  onAddToCart?: (id: string) => void;
  initialTab?: 'cart' | 'wishlist';
  onUpdateQuantity?: (id: string, qty: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartProductIds = [],
  products = [],
  onRemoveFromCart,
  onClearCart,
  onProductClick,
  onBuyItem,
  lang = 'en',
  wishlistProductIds = [],
  wishlistEntries = [],
  onToggleWishlist,
  onClearWishlist,
  onAddToCart,
  initialTab = 'cart',
  onUpdateQuantity,
}) => {
  const [activeTab, setActiveTab] = useState<'cart' | 'wishlist'>(initialTab);
  const [quantities, setQuantities] = useState<Record<string, number>>(() => getCartQuantities());
  const [activeQtyDropdown, setActiveQtyDropdown] = useState<string | null>(null);
  const [wishlistDateFilter, setWishlistDateFilter] = useState<'recently' | '1month' | '3months' | '1year'>('recently');
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (isOpen) {
      setQuantities(getCartQuantities());
    }
  }, [initialTab, isOpen]);

  // Safe product arrays with strict validation
  const safeProducts = useMemo(() => {
    return Array.isArray(products) ? products.filter((p): p is Product => Boolean(p && p.id)) : [];
  }, [products]);

  const safeCartIds = useMemo(() => {
    return Array.isArray(cartProductIds) ? cartProductIds.map(String).filter(Boolean) : [];
  }, [cartProductIds]);

  const safeWishlistIds = useMemo(() => {
    return Array.isArray(wishlistProductIds) ? wishlistProductIds.map(String).filter(Boolean) : [];
  }, [wishlistProductIds]);

  // Safe price & image helpers
  const cleanPrice = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    try {
      const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
      return isNaN(num) ? 0 : num;
    } catch {
      return 0;
    }
  };

  const formatDisplayPrice = (val: any): string => {
    if (val === undefined || val === null || val === '') return '';
    const str = String(val).trim();
    if (str.startsWith('₹')) return str;
    return `₹${str}`;
  };

  const formatCurrency = (amount: number): string => {
    if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
    return '₹' + Math.max(0, Math.round(amount)).toLocaleString('en-IN');
  };

  const getProductImage = (product: Product | undefined | null): string => {
    if (!product) return 'https://picsum.photos/300/300';
    if (Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'string' && product.images[0].trim()) {
      return product.images[0];
    }
    if (typeof (product as any).images === 'string' && (product as any).images.trim()) {
      return (product as any).images;
    }
    if (typeof (product as any).image === 'string' && (product as any).image.trim()) {
      return (product as any).image;
    }
    return 'https://picsum.photos/300/300';
  };

  const getProductSubtitle = (product: Product): string => {
    try {
      if (Array.isArray(product.highlights) && product.highlights.length > 0) {
        return product.highlights.slice(0, 2).filter(Boolean).join(', ');
      }
      if (typeof product.highlights === 'string' && (product.highlights as string).trim()) {
        return product.highlights;
      }
      if (Array.isArray(product.categories) && product.categories.length > 0) {
        return String(product.categories[0]);
      }
      if (typeof product.categories === 'string' && (product.categories as string).trim()) {
        return product.categories;
      }
    } catch {
      // fallback
    }
    return 'Verified Affiliate Deal';
  };

  const getDiscountPercent = (p: Product): number => {
    const mrp = cleanPrice(p.mrp);
    const price = cleanPrice(p.price);
    if (!mrp || !price || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  const getItemQuantity = (id: string): number => {
    return quantities[String(id)] || 1;
  };

  const handleQuantityChange = (id: string, qty: number) => {
    setQuantities(prev => {
      const updated = { ...prev, [String(id)]: qty };
      saveCartQuantities(updated);
      return updated;
    });
    if (onUpdateQuantity) {
      onUpdateQuantity(id, qty);
    }
    setActiveQtyDropdown(null);
  };

  const formatWishlistDate = (timestamp?: number): string => {
    try {
      if (!timestamp || isNaN(timestamp)) return 'Recently';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Recently';
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return 'Recently';
    }
  };

  // Active cart products
  const cartProducts = useMemo(() => {
    return safeCartIds
      .map(id => safeProducts.find(p => String(p.id) === String(id)))
      .filter((p): p is Product => Boolean(p && p.id));
  }, [safeCartIds, safeProducts]);

  // Resolve wishlist entries with timestamps
  const storedWishlistEntries = useMemo(() => {
    try {
      if (Array.isArray(wishlistEntries) && wishlistEntries.length > 0) {
        return wishlistEntries;
      }
      return getWishlistEntries();
    } catch {
      return [];
    }
  }, [wishlistEntries]);

  const entryMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of storedWishlistEntries) {
      if (e && e.id) {
        map.set(String(e.id), typeof e.addedAt === 'number' ? e.addedAt : Date.now());
      }
    }
    return map;
  }, [storedWishlistEntries]);

  const wishlistItemsWithDates = useMemo(() => {
    return safeWishlistIds
      .map(id => {
        const product = safeProducts.find(p => String(p.id) === String(id));
        if (!product) return null;
        return {
          product,
          addedAt: entryMap.get(String(id)) || Date.now()
        };
      })
      .filter((item): item is { product: Product; addedAt: number } => Boolean(item && item.product));
  }, [safeWishlistIds, safeProducts, entryMap]);

  // Date boundaries calculation
  const now = useMemo(() => Date.now(), [wishlistItemsWithDates.length]);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneMonthMs = 30 * oneDayMs;
  const threeMonthsMs = 90 * oneDayMs;
  const oneYearMs = 365 * oneDayMs;

  const countRecently = wishlistItemsWithDates.length;
  const count1Month = wishlistItemsWithDates.filter(i => (now - i.addedAt) <= oneMonthMs).length;
  const count3Months = wishlistItemsWithDates.filter(i => (now - i.addedAt) <= threeMonthsMs).length;
  const count1Year = wishlistItemsWithDates.filter(i => (now - i.addedAt) <= oneYearMs).length;

  const filteredWishlistItems = useMemo(() => {
    let list = [...wishlistItemsWithDates];
    if (wishlistDateFilter === '1month') {
      list = list.filter(i => (now - i.addedAt) <= oneMonthMs);
    } else if (wishlistDateFilter === '3months') {
      list = list.filter(i => (now - i.addedAt) <= threeMonthsMs);
    } else if (wishlistDateFilter === '1year') {
      list = list.filter(i => (now - i.addedAt) <= oneYearMs);
    }
    list.sort((a, b) => b.addedAt - a.addedAt);
    return list;
  }, [wishlistItemsWithDates, wishlistDateFilter, now]);

  // Calculations across all cart items taking quantity into account
  const totalMrp = useMemo(() => {
    return cartProducts.reduce((sum, p) => {
      const q = getItemQuantity(p.id);
      const mrp = cleanPrice(p.mrp) || cleanPrice(p.price);
      return sum + (mrp * q);
    }, 0);
  }, [cartProducts, quantities]);

  const totalItemPrice = useMemo(() => {
    return cartProducts.reduce((sum, p) => {
      const q = getItemQuantity(p.id);
      const price = cleanPrice(p.price);
      return sum + (price * q);
    }, 0);
  }, [cartProducts, quantities]);

  const protectPromiseFee = cartProducts.length > 0 ? 256 : 0;
  const rawDiscounts = Math.max(0, totalMrp - totalItemPrice);
  const totalAmount = totalItemPrice + protectPromiseFee;
  const netSavings = Math.max(0, totalMrp - totalAmount);

  const deliveryDateString = useMemo(() => {
    try {
      const d = new Date(Date.now() + 4 * 86400000);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    } catch {
      return 'in 3-4 days';
    }
  }, []);

  const scrollToPriceDetails = () => {
    try {
      const el = document.getElementById('cart-price-details');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      // ignore
    }
  };

  const handleBuySafe = (prod: Product) => {
    try {
      if (onBuyItem) {
        onBuyItem(prod);
      } else if (prod.affiliateLink) {
        window.open(prod.affiliateLink, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.error('Failed to trigger buy', e);
    }
  };

  if (!isOpen) return null;

  if (renderError) {
    return (
      <div className="fixed inset-0 z-[80] bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 text-red-500 flex items-center justify-center mb-4">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{renderError}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRenderError(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-sm"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[80] bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden text-gray-900 dark:text-gray-100 transition-colors"
      role="dialog"
      aria-modal="true"
    >
      
      {/* Top Header Bar */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-xs z-30">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
              activeTab === 'wishlist'
                ? 'bg-red-50 dark:bg-red-900/40 text-red-500'
                : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
            }`}>
              {activeTab === 'wishlist' ? (
                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>{activeTab === 'wishlist' ? 'My Wishlist' : 'My Cart'}</span>
                {activeTab === 'cart' && cartProducts.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                    {cartProducts.length} {cartProducts.length === 1 ? 'item' : 'items'}
                  </span>
                )}
                {activeTab === 'wishlist' && wishlistItemsWithDates.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold">
                    {wishlistItemsWithDates.length} {wishlistItemsWithDates.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Switch Button in header */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'wishlist' ? 'cart' : 'wishlist')}
              className={`p-2 rounded-xl transition-all relative flex items-center justify-center cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-500 ring-1 ring-red-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
              title={activeTab === 'wishlist' ? 'Switch to Cart' : 'Switch to Wishlist'}
              aria-label={activeTab === 'wishlist' ? 'Switch to Cart' : 'Switch to Wishlist'}
            >
              <Heart 
                className={`w-5 h-5 transition-transform active:scale-90 ${
                  activeTab === 'wishlist' || safeWishlistIds.length > 0 
                    ? 'text-red-500 fill-red-500' 
                    : 'text-gray-600 dark:text-gray-300'
                }`} 
              />
              {safeWishlistIds.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {safeWishlistIds.length}
                </span>
              )}
            </button>

            {activeTab === 'cart' && cartProducts.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Clear Cart
              </button>
            )}

            {activeTab === 'wishlist' && wishlistItemsWithDates.length > 0 && onClearWishlist && (
              <button
                type="button"
                onClick={onClearWishlist}
                className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Clear Wishlist
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-gray-100/80 dark:bg-slate-800/90 border-t border-gray-200 dark:border-slate-700">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>My Cart ({cartProducts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wishlist')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${safeWishlistIds.length > 0 || activeTab === 'wishlist' ? 'fill-current' : ''}`} />
              <span>My Wishlist ({safeWishlistIds.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-h-0 max-w-4xl w-full mx-auto overflow-hidden">

        {/* ======================================================== */}
        {/* Wishlist View */}
        {/* ======================================================== */}
        {activeTab === 'wishlist' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 pb-28 md:pb-16">
            {wishlistItemsWithDates.length === 0 ? (
              <div className="py-12 px-4 text-center max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-red-500">
                  <Heart className="w-10 h-10 stroke-[1.5] fill-red-100 dark:fill-red-950/40" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Your wishlist is empty!
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Explore our curated products and tap the heart icon on any product to save it to your wishlist.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 mb-8 cursor-pointer"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Popular Products to Add */}
                {safeProducts.length > 0 && (
                  <div className="text-left border-t border-gray-200 dark:border-slate-800 pt-6">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Popular to add to your wishlist:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {safeProducts.slice(0, 4).map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs">
                          <div 
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                            onClick={() => {
                              onProductClick(p.id);
                              onClose();
                            }}
                          >
                            <img 
                              src={getProductImage(p)} 
                              alt={p.name || ''} 
                              className="w-12 h-12 rounded-lg object-contain bg-white flex-shrink-0 border border-gray-100 dark:border-slate-700" 
                            />
                            <div className="truncate">
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{formatDisplayPrice(p.price)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onToggleWishlist && onToggleWishlist(p.id)}
                            className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center flex-shrink-0 hover:scale-110 active:scale-90 transition-transform cursor-pointer"
                            title="Add to wishlist"
                            aria-label="Add to wishlist"
                          >
                            <Heart className="w-4 h-4 fill-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Sorting & Filter by Date Area */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-gray-200 dark:border-slate-700 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-red-500" />
                      <span>Filter & Sort by Date</span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
                      Showing {filteredWishlistItems.length} of {wishlistItemsWithDates.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    {[
                      { id: 'recently', label: 'Recently', count: countRecently },
                      { id: '1month', label: '1 Month', count: count1Month },
                      { id: '3months', label: '3 Months', count: count3Months },
                      { id: '1year', label: '1 Year', count: count1Year },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => setWishlistDateFilter(btn.id as any)}
                        className={`px-2 py-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${
                          wishlistDateFilter === btn.id
                            ? 'bg-red-500 text-white shadow-xs font-bold'
                            : 'bg-gray-100 dark:bg-slate-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{btn.label}</span>
                        <span className={`text-[10px] mt-0.5 ${
                          wishlistDateFilter === btn.id ? 'text-red-100 font-medium' : 'text-gray-400 dark:text-gray-400'
                        }`}>
                          ({btn.count})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Empty state for filtered time range */}
                {filteredWishlistItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                    <Calendar className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2 stroke-[1.5]" />
                    <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
                      No items found in this timeframe
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1 mb-4">
                      You have {wishlistItemsWithDates.length} saved {wishlistItemsWithDates.length === 1 ? 'item' : 'items'} in your wishlist overall.
                    </p>
                    <button
                      type="button"
                      onClick={() => setWishlistDateFilter('recently')}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Show Recently Added
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredWishlistItems.map(({ product, addedAt }) => {
                      const price = cleanPrice(product.price);
                      const mrp = cleanPrice(product.mrp);
                      const discount = getDiscountPercent(product);
                      const isItemInCart = safeCartIds.includes(String(product.id));

                      return (
                        <div 
                          key={product.id}
                          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs overflow-hidden transition-all hover:shadow-sm"
                        >
                          <div className="p-3 sm:p-4">
                            <div className="flex gap-3 sm:gap-4 items-start">
                              {/* Product Image */}
                              <div 
                                onClick={() => {
                                  onProductClick(product.id);
                                  onClose();
                                }}
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-gray-200 dark:border-slate-700 bg-white p-2 flex-shrink-0 cursor-pointer overflow-hidden flex items-center justify-center group"
                              >
                                <img 
                                  src={getProductImage(product)} 
                                  alt={product.name || ''} 
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                />
                              </div>

                              {/* Title & Details */}
                              <div className="flex-1 min-w-0">
                                <h3 
                                  onClick={() => {
                                    onProductClick(product.id);
                                    onClose();
                                  }}
                                  className="text-sm sm:text-base font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                  title={product.name}
                                >
                                  {product.name}
                                </h3>

                                <div className="flex items-baseline gap-2 mt-2">
                                  <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                    {formatDisplayPrice(product.price)}
                                  </span>
                                  {mrp > price && (
                                    <span className="text-xs text-gray-400 line-through">
                                      {formatDisplayPrice(product.mrp)}
                                    </span>
                                  )}
                                  {discount > 0 && (
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                      {discount}% off
                                    </span>
                                  )}
                                </div>

                                {/* Added Date, Month and Year Badge */}
                                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                                  <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                  <span>Added on {formatWishlistDate(addedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="border-t border-gray-100 dark:border-slate-700/80 px-3 py-2.5 bg-gray-50/60 dark:bg-slate-800/60 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-semibold transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onAddToCart) {
                                    onAddToCart(product.id);
                                  }
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                                  isItemInCart
                                    ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 text-blue-600 dark:text-blue-300'
                                    : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-100 hover:border-blue-400'
                                }`}
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>{isItemInCart ? 'In Cart' : 'Add to Cart'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleBuySafe(product)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-500 text-black rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5 fill-black" />
                                <span>Buy Now</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* Cart View */}
        {/* ======================================================== */}
        {activeTab === 'cart' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 pb-28 md:pb-16">
            
            {/* Condition 1: When no items in cart, show 'Your cart is empty' */}
            {cartProducts.length === 0 ? (
              <div className="py-12 px-4 text-center max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                  <ShoppingCart className="w-10 h-10 stroke-[1.5]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Your cart is empty!
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Explore our curated products and trending offers. Add your favorite items to your cart anytime!
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 mb-8 cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Trending products to add to cart */}
                {safeProducts.length > 0 && (
                  <div className="text-left border-t border-gray-200 dark:border-slate-800 pt-6">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Trending deals to add to cart:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {safeProducts.slice(0, 4).map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs">
                          <div 
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                            onClick={() => {
                              onProductClick(p.id);
                              onClose();
                            }}
                          >
                            <img 
                              src={getProductImage(p)} 
                              alt={p.name || ''} 
                              className="w-12 h-12 rounded-lg object-contain bg-white flex-shrink-0 border border-gray-100 dark:border-slate-700" 
                            />
                            <div className="truncate">
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatDisplayPrice(p.price)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onAddToCart && onAddToCart(p.id)}
                            className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg flex items-center gap-1 flex-shrink-0 hover:bg-blue-700 active:scale-95 transition-all shadow-xs cursor-pointer"
                          >
                            <span>+ Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
            <>
              {/* Cart item cards */}
              <div className="space-y-3.5">
                {cartProducts.map((product) => {
                  const price = cleanPrice(product.price);
                  const mrp = cleanPrice(product.mrp);
                  const discount = getDiscountPercent(product);
                  const qty = getItemQuantity(product.id);
                  const itemTotal = price * qty;
                  const itemMrpTotal = (mrp > 0 ? mrp : price) * qty;
                  const subtitle = getProductSubtitle(product);
                  const likesCount = Number(product.likes) > 0 ? Number(product.likes) : 350;

                  return (
                    <div 
                      key={product.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs overflow-hidden transition-all hover:shadow-sm"
                    >
                      {/* Top: Image & Title */}
                      <div className="p-3 sm:p-4">
                        <div className="flex gap-3 sm:gap-4 items-start">
                          {/* Product Image */}
                          <div 
                            onClick={() => {
                              onProductClick(product.id);
                              onClose();
                            }}
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-gray-200 dark:border-slate-700 bg-white p-2 flex-shrink-0 cursor-pointer overflow-hidden flex items-center justify-center group"
                          >
                            <img 
                              src={getProductImage(product)} 
                              alt={product.name || ''} 
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                          </div>

                          {/* Title, Subtitle, Rating & Assured Badge */}
                          <div className="flex-1 min-w-0">
                            <h3 
                              onClick={() => {
                                onProductClick(product.id);
                                onClose();
                              }}
                              className="text-sm sm:text-base font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                              title={product.name}
                            >
                              {product.name}
                            </h3>

                            {/* Subtitle specifications */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                              {subtitle}
                            </p>

                            {/* Rating & Assured Badge */}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">★★★★☆</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">4.4</span>
                                <span className="text-gray-400">• ({likesCount})</span>
                              </div>

                              {/* Assured Badge */}
                              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-[10px] font-black italic px-2 py-0.5 rounded-sm shadow-xs">
                                <span className="text-yellow-300">★</span>
                                <span>Assured</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Qty dropdown, stock note, price & discount */}
                        <div className="mt-3.5 flex items-start justify-between gap-3 pt-2">
                          {/* Left: Qty button + "Only few left" */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveQtyDropdown(activeQtyDropdown === product.id ? null : product.id)}
                              className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 shadow-2xs hover:bg-gray-50 dark:hover:bg-slate-650 cursor-pointer"
                            >
                              <span>Qty: {qty}</span>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                            </button>

                            {/* Quantity Dropdown Menu */}
                            {activeQtyDropdown === product.id && (
                              <div className="absolute left-0 mt-1 w-28 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 py-1 z-30">
                                {[1, 2, 3, 4, 5, 10].map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleQuantityChange(product.id, num)}
                                    className={`w-full px-3 py-1.5 text-xs text-left font-medium flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer ${
                                      qty === num ? 'text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30' : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    <span>Qty: {num}</span>
                                    {qty === num && <span className="text-blue-600">✓</span>}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Urgency note */}
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1">
                              Only few left
                            </p>
                          </div>

                          {/* Right: Discount arrow + MRP + Final Price */}
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {discount > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base flex items-center">
                                  ↓ {discount}%
                                </span>
                              )}
                              {mrp > price && (
                                <span className="text-gray-400 dark:text-gray-500 line-through text-sm sm:text-base">
                                  {formatCurrency(itemMrpTotal)}
                                </span>
                              )}
                              <span className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">
                                {formatCurrency(itemTotal)}
                              </span>
                            </div>

                            {/* Protect Promise Fee */}
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center justify-end gap-1">
                              <span>+ ₹256 Protect Promise Fee</span>
                              <Info className="w-3 h-3 text-gray-400" />
                            </p>
                          </div>
                        </div>

                        {/* Delivery info line */}
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                          <span>Delivery by </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {deliveryDateString}
                          </span>
                          <span className="text-emerald-600 font-medium ml-1.5">• FREE Delivery</span>
                        </div>
                      </div>

                      {/* Bottom: 2-column action buttons */}
                      <div className="border-t border-gray-200 dark:border-slate-700 divide-x divide-gray-200 dark:divide-slate-700 grid grid-cols-2 bg-gray-50/50 dark:bg-slate-800/50">
                        {/* 1. Remove */}
                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(product.id)}
                          className="py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </button>

                        {/* 2. Buy this now */}
                        <button
                          type="button"
                          onClick={() => handleBuySafe(product)}
                          className="py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:text-yellow-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>Buy this now</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Details Card */}
              <div id="cart-price-details" className="pt-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Price Details
                </h3>

                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                  
                  {/* Row 1: MRP (incl. of all taxes) */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-800 dark:text-gray-200 underline decoration-dotted underline-offset-4 cursor-help">
                      MRP (incl. of all taxes)
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(totalMrp)}
                    </span>
                  </div>

                  {/* Row 2: Fees */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1 text-gray-800 dark:text-gray-200">
                      <span>Fees</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(protectPromiseFee)}
                    </span>
                  </div>

                  {/* Dotted border separator */}
                  <div className="border-b border-dashed border-gray-200 dark:border-slate-700 my-1" />

                  {/* Row 3: Discounts */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1 text-gray-800 dark:text-gray-200">
                      <span>Discounts</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      - {formatCurrency(rawDiscounts)}
                    </span>
                  </div>

                  {/* Solid border separator */}
                  <div className="border-b border-gray-200 dark:border-slate-700 my-1" />

                  {/* Row 4: Total Amount */}
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                      Total Amount
                    </span>
                    <span className="font-black text-xl sm:text-2xl text-gray-900 dark:text-white">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>

                  {/* Green Savings banner */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl py-3 px-3.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold mt-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black">
                      %
                    </div>
                    <span>
                      You'll save {formatCurrency(netSavings)} on this order!
                    </span>
                  </div>

                </div>
              </div>
            </>
          )}

        </div>
        )}

        {/* Sticky Bottom Checkout Bar (when items in cart) */}
        {activeTab === 'cart' && cartProducts.length > 0 && (
          <div className="flex-shrink-0 p-3 sm:p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-20 safe-pb">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Total Amount + View price details link */}
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Amount</div>
                <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-tight">
                  {formatCurrency(totalAmount)}
                </div>
                <button
                  type="button"
                  onClick={scrollToPriceDetails}
                  className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  View price details
                </button>
              </div>

              {/* Right: Place Order / Buy Deals Button */}
              <button
                type="button"
                onClick={() => {
                  if (cartProducts[0]) {
                    handleBuySafe(cartProducts[0]);
                  }
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold text-sm sm:text-base py-3 px-6 sm:px-8 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>Place Order</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
