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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] safe-pb transition-colors duration-200"
    >
      <div className="max-w-lg md:max-w-2xl mx-auto px-1 sm:px-2">
        <div className="grid grid-cols-5 h-16 items-center">
          
          {/* 1. Home Tab */}
          <button
            type="button"
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all group ${
              activeTab === 'home'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Home 
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-active:scale-90 ${
                  activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                }`} 
              />
            </div>
            <span className="text-[10px] sm:text-xs mt-1 leading-none tracking-tight">
              {getNavLabel('home')}
            </span>
          </button>

          {/* 2. Categories Tab */}
          <button
            type="button"
            onClick={() => onTabChange('categories')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all group ${
              activeTab === 'categories'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <LayoutGrid 
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-active:scale-90 ${
                  activeTab === 'categories' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                }`} 
              />
            </div>
            <span className="text-[10px] sm:text-xs mt-1 leading-tight tracking-tight text-center">
              {t('allCategories') || 'Categories'}
            </span>
          </button>

          {/* 3. Wishlist Tab */}
          <button
            type="button"
            onClick={() => onTabChange('wishlist')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all group ${
              activeTab === 'wishlist'
                ? 'text-red-500 font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Heart 
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-active:scale-90 ${
                  activeTab === 'wishlist' || wishlistCount > 0 
                    ? 'stroke-[2.2px] text-red-500 fill-red-500' 
                    : 'stroke-[1.8px]'
                }`} 
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs mt-1 leading-none tracking-tight">
              {getNavLabel('wishlist')}
            </span>
          </button>

          {/* 4. Account Tab */}
          <button
            type="button"
            onClick={() => onTabChange('account')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all group ${
              activeTab === 'account'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="relative flex items-center justify-center">
              {/* Silhouette style user icon matching screenshot */}
              {activeTab === 'account' ? (
                <svg className="w-6 h-6 fill-current transition-transform group-active:scale-90" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 stroke-current fill-none stroke-[1.8px] transition-transform group-active:scale-90" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <span className="text-[10px] sm:text-xs mt-1 leading-none tracking-tight">
              {getNavLabel('account')}
            </span>
          </button>

          {/* 5. Cart Tab */}
          <button
            type="button"
            onClick={() => onTabChange('cart')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all group ${
              activeTab === 'cart'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <ShoppingCart 
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-active:scale-90 ${
                  activeTab === 'cart' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                }`} 
              />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-75 duration-200">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs mt-1 leading-none tracking-tight">
              {getNavLabel('cart')}
            </span>
          </button>

        </div>
      </div>
    </nav>
  );
};
