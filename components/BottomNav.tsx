import React from 'react';
import { Home, LayoutGrid, ShoppingCart, Heart } from 'lucide-react';
import { Language, getTranslation } from '../utils/translations';

export type BottomNavTab = 'home' | 'categories' | 'wishlist' | 'account' | 'cart';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  cartCount: number;
  wishlistCount?: number;
  lang?: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  cartCount,
  wishlistCount = 0,
  lang = 'en'
}) => {
  const t = (key: string) => getTranslation(lang, key);

  // Translation helpers with fallback to exact screenshot labels
  const getNavLabel = (tab: BottomNavTab) => {
    switch (tab) {
      case 'home':
        return t('all') === 'All' ? 'Home' : t('all');
      case 'categories':
        return t('allCategories') || 'Categories';
      case 'wishlist':
        return 'Wishlist';
      case 'account':
        return t('myAccount') || 'Account';
      case 'cart':
        return t('myCart') || 'Cart';
    }
  };

  return (
    <nav 
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#071329]/85 backdrop-blur-2xl border-t border-[var(--glow-border-subtle)] shadow-[0_-4px_22px_rgba(0,190,255,0.12)] dark:shadow-[0_-6px_28px_rgba(0,217,255,0.18)] safe-pb transition-all duration-300"
    >
      <div className="max-w-lg md:max-w-2xl mx-auto px-1 sm:px-2">
        <div className="grid grid-cols-5 h-16 items-center">
          
          {/* 1. Home Tab */}
          <button
            type="button"
            onClick={() => onTabChange('home')}
            className="flex flex-col items-center justify-center w-full h-full py-1 transition-all group cursor-pointer"
          >
            <div className={`flex flex-col items-center justify-center transition-all ${
              activeTab === 'home'
                ? 'px-3.5 py-1 rounded-2xl bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 text-[#6C3BFF] dark:from-[#6C3BFF]/35 dark:to-[#2589FF]/35 dark:text-cyan-300 border border-[var(--glow-border)] font-bold shadow-[var(--glow-shadow-subtle)]'
                : 'text-[#526B98] dark:text-[#8294B8] hover:text-[#102A56] dark:hover:text-[#F5F7FF]'
            }`}>
              <Home 
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-active:scale-90 ${
                  activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                }`} 
              />
              <span className="text-[10px] sm:text-xs mt-1 leading-none tracking-tight">
                {getNavLabel('home')}
              </span>
            </div>
          </button>

          {/* 2. Categories Tab */}
          <button
            type="button"
            onClick={() => onTabChange('categories')}
            className="flex flex-col items-center justify-center w-full h-full py-1 transition-all group cursor-pointer"
          >
            <div className={`flex flex-col items-center justify-center transition-all ${
              activeTab === 'categories'
                ? 'px-3 py-1 rounded-2xl bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 text-[#6C3BFF] dark:from-[#6C3BFF]/35 dark:to-[#2589FF]/35 dark:text-cyan-300 border border-[var(--glow-border)] font-bold shadow-[var(--glow-shadow-subtle)]'
                : 'text-[#526B98] dark:text-[#8294B8] hover:text-[#102A56] dark:hover:text-[#F5F7FF]'
            }`}>
              <LayoutGrid 
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-active:scale-90 ${
                  activeTab === 'categories' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                }`} 
              />
              <span className="text-[10px] sm:text-xs mt-1 leading-tight tracking-tight text-center">
                {t('allCategories') || 'Categories'}
              </span>
            </div>
          </button>

          {/* 3. Wishlist Tab */}
          <button
            type="button"
            onClick={() => onTabChange('wishlist')}
            className="flex flex-col items-center justify-center w-full h-full py-1 transition-all group cursor-pointer"
          >
            <div className={`flex flex-col items-center justify-center transition-all ${
              activeTab === 'wishlist'
                ? 'px-3 py-1 rounded-2xl bg-gradient-to-r from-pink-500/15 to-rose-500/20 text-pink-500 border border-pink-400/40 font-bold shadow-[var(--glow-shadow-subtle)]'
                : 'text-[#526B98] dark:text-[#8294B8] hover:text-pink-500 dark:hover:text-pink-400'
            }`}>
              <div className="relative flex items-center justify-center">
                <Heart 
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-active:scale-90 ${
                    activeTab === 'wishlist' || wishlistCount > 0 
                      ? 'stroke-[2.2px] text-pink-500 fill-pink-500' 
                      : 'stroke-[1.8px]'
                  }`} 
                />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs mt-1 leading-none tracking-tight">
                {getNavLabel('wishlist')}
              </span>
            </div>
          </button>

          {/* 4. Cart Tab */}
          <button
            type="button"
            onClick={() => onTabChange('cart')}
            className="flex flex-col items-center justify-center w-full h-full py-1 transition-all group cursor-pointer"
          >
            <div className={`flex flex-col items-center justify-center transition-all ${
              activeTab === 'cart'
                ? 'px-3 py-1 rounded-2xl bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 text-[#6C3BFF] dark:from-[#6C3BFF]/35 dark:to-[#2589FF]/35 dark:text-cyan-300 border border-[var(--glow-border)] font-bold shadow-[var(--glow-shadow-subtle)]'
                : 'text-[#526B98] dark:text-[#8294B8] hover:text-[#102A56] dark:hover:text-[#F5F7FF]'
            }`}>
              <div className="relative flex items-center justify-center">
                <ShoppingCart 
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-active:scale-90 ${
                    activeTab === 'cart' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                  }`} 
                />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs mt-1 leading-none tracking-tight">
                {getNavLabel('cart')}
              </span>
            </div>
          </button>

          {/* 5. Account Tab */}
          <button
            type="button"
            onClick={() => onTabChange('account')}
            className="flex flex-col items-center justify-center w-full h-full py-1 transition-all group cursor-pointer"
          >
            <div className={`flex flex-col items-center justify-center transition-all ${
              activeTab === 'account'
                ? 'px-3 py-1 rounded-2xl bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 text-[#6C3BFF] dark:from-[#6C3BFF]/35 dark:to-[#2589FF]/35 dark:text-cyan-300 border border-[var(--glow-border)] font-bold shadow-[var(--glow-shadow-subtle)]'
                : 'text-[#526B98] dark:text-[#8294B8] hover:text-[#102A56] dark:hover:text-[#F5F7FF]'
            }`}>
              <div className="relative flex items-center justify-center">
                {activeTab === 'account' ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current transition-transform group-active:scale-90" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-current fill-none stroke-[1.8px] transition-transform group-active:scale-90" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <span className="text-[10px] sm:text-xs mt-1 leading-none tracking-tight">
                {getNavLabel('account')}
              </span>
            </div>
          </button>

        </div>
      </div>
    </nav>
  );
};
