
import React, { useState, useEffect, useRef } from 'react';
import { Category, CATEGORIES, Product, Theme, CATEGORY_DETAILS } from '../types';
import { LANGUAGES, Language, getTranslation } from '../utils/translations';
import { SiteSettings } from '../services/storageService';
import { 
  Menu, Search, LayoutGrid, Languages, Percent, 
  HelpCircle, Scale, Info, ArrowLeft, ChevronRight, 
  Youtube, Facebook, MessageCircle, Send, Instagram, Twitter,
  Zap, Star, Clock, Coffee, Smartphone, Shirt, Sparkles, Package, X as CloseIcon,
  Moon, Sun, Monitor, TrendingUp, Heart, ShoppingCart
} from 'lucide-react';

interface HeaderProps {
  activeCategory: Category;
  onCategoryChange: (cat: Category) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  products: Product[];
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  siteSettings?: SiteSettings;
  onAdminClick?: () => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  onOpenInfoPage: (page: 'help' | 'about' | 'legal', fromSidebar: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isAllCategoriesOpen?: boolean;
  setIsAllCategoriesOpen?: (isOpen: boolean) => void;
  cartCount?: number;
  wishlistCount?: number;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
}

const SidebarItem: React.FC<{ 
  icon?: any; 
  label: string; 
  onClick?: () => void; 
  subText?: string; 
  active?: boolean;
  rightIcon?: React.ReactNode;
}> = ({ icon: Icon, label, onClick, subText, active, rightIcon }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-4 py-3.5 transition-colors border-l-4 ${
      active 
        ? 'bg-blue-950/40 border-blue-500 text-white dark:bg-blue-950/50 dark:text-white font-bold' 
        : 'border-transparent hover:bg-slate-800/60 text-slate-200'
    }`}
  >
     {Icon ? (
        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-400'}`} />
     ) : (
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-blue-500' : 'bg-slate-500'}`}></div>
     )}
     
     <div className="flex-1 text-left flex items-center justify-between">
        <span className={`text-sm ${active ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>{label}</span>
        <div className="flex items-center gap-2">
            {subText && <span className="text-xs text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full font-bold">{subText}</span>}
            {rightIcon}
        </div>
     </div>
  </button>
);

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  products = [],
  currentLang,
  onLanguageChange,
  siteSettings = {} as SiteSettings,
  onAdminClick,
  currentTheme,
  onThemeChange,
  isSidebarOpen,
  setIsSidebarOpen,
  isAllCategoriesOpen,
  setIsAllCategoriesOpen,
  cartCount = 0,
  wishlistCount = 0,
  onOpenCart,
  onOpenWishlist
}) => {
  const [suggestions, setSuggestions] = useState<{product: Product, matchType: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [internalIsAllCategoriesMenuOpen, setInternalIsAllCategoriesMenuOpen] = useState(false);

  const isAllCategoriesMenuOpen = isAllCategoriesOpen !== undefined ? isAllCategoriesOpen : internalIsAllCategoriesMenuOpen;
  const setAllCategoriesMenuOpen = (val: boolean) => {
    if (setIsAllCategoriesOpen) setIsAllCategoriesOpen(val);
    setInternalIsAllCategoriesMenuOpen(val);
  };

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => getTranslation(currentLang, key);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches: {product: Product, matchType: string}[] = [];
    const addedIds = new Set<string>();

    products.forEach(p => {
        if (addedIds.has(p.id)) return;
        
        // Exact name match or partial
        if (p.name.toLowerCase().includes(query)) {
            matches.push({ product: p, matchType: 'name' });
            addedIds.add(p.id);
            return;
        }

        // Code match
        if (p.code.toLowerCase().includes(query)) {
            matches.push({ product: p, matchType: 'code' });
            addedIds.add(p.id);
            return;
        }
        
        // Category match roughly
        const catMatch = p.categories.some(c => c.toLowerCase().includes(query));
        if (catMatch) {
             matches.push({ product: p, matchType: 'category' });
             addedIds.add(p.id);
        }
    });

    setSuggestions(matches.slice(0, 6));
  }, [searchQuery, products]);

  const handleSuggestionClick = (name: string) => {
    onSearchChange(name);
    setShowSuggestions(false);
  };

  const handleCategoryClick = (cat: Category) => {
    onCategoryChange(cat);
    setIsSidebarOpen(false);
    setAllCategoriesMenuOpen(false);
  };

  const getTranslatedCategory = (cat: string) => {
      // Normalize 'For Gen Z' to 'forgenz' for translation key
      const catKey = cat.toLowerCase().replace(/ /g, '').replace('&', '').replace('acc', 'acc') as any;
      return t(catKey) || cat;
  };

  const resetMenus = () => {
      setIsLanguageMenuOpen(false);
      setIsThemeMenuOpen(false);
      setAllCategoriesMenuOpen(false);
  };

  // Define Main Categories that stay on the main menu
  const MAIN_CATEGORY_IDS = ['Trending', 'Offer Zone'];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#F7F9FF]/80 dark:bg-[#071329]/80 backdrop-blur-xl border-b border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)] shadow-[0_4px_20px_rgba(37,137,255,0.06)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          
          {/* Top Row: Menu, Brand, Search, Wishlist & Cart */}
          <div className="flex flex-col md:flex-row md:items-center py-2.5 px-3 sm:px-4 gap-3 md:gap-4 border-b border-[rgba(92,137,220,0.12)] dark:border-[rgba(100,160,255,0.15)]">
            
            <div className="flex items-center gap-3 justify-between">
              
              <div className="flex items-center gap-2.5">
                {/* Hamburger Menu - Top Left */}
                <button 
                  onClick={() => { setIsSidebarOpen(true); resetMenus(); }}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-[#102448]/80 backdrop-blur-md border border-[var(--glow-border-subtle)] hover:border-[var(--glow-border)] glow-interactive shadow-xs text-[#102A56] dark:text-[#F5F7FF] cursor-pointer"
                  aria-label="Open menu"
                >
                   <Menu className="w-5 h-5" />
                </button>

                {/* Brand Name */}
                <div className="flex-shrink-0 cursor-pointer group" onClick={() => onCategoryChange('All')}>
                  <span className="text-xl md:text-2xl font-black tracking-tight text-[#0066FF] dark:text-cyan-400 drop-shadow-sm whitespace-nowrap">
                      Smart Deal Online
                  </span>
                </div>
              </div>

              {/* Mobile Quick Action Buttons: Wishlist & Cart */}
              <div className="flex md:hidden items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenWishlist}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-[#071329] backdrop-blur-md border border-[var(--glow-border)] hover:border-[var(--glow-border-hover)] glow-interactive shadow-[var(--glow-shadow-subtle)] hover:shadow-[var(--glow-shadow)] relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 active:scale-[0.97]"
                  title="My Wishlist"
                  aria-label="My Wishlist"
                >
                  <span className="animate-wishlist-heart inline-flex items-center justify-center pointer-events-none">
                    <Heart className="w-5 h-5 text-[#FF3388] fill-[#FF3388]" />
                  </span>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-gradient-to-r from-[#FF3377] to-[#FF5588] text-white text-[11px] font-black rounded-full flex items-center justify-center animate-wishlist-badge pointer-events-none select-none border border-white/20">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onOpenCart}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-[#071329] backdrop-blur-md border border-[var(--glow-border)] hover:border-[var(--glow-border-hover)] glow-interactive shadow-[var(--glow-shadow-subtle)] hover:shadow-[var(--glow-shadow)] relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 active:scale-[0.97]"
                  title="My Cart"
                  aria-label="My Cart"
                >
                  <span className="animate-cart-rocking inline-flex items-center justify-center pointer-events-none">
                    <ShoppingCart className="w-5 h-5 text-[#102A56] dark:text-white stroke-[2.2px]" />
                  </span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] text-white text-[11px] font-black rounded-full flex items-center justify-center animate-cart-badge pointer-events-none select-none border border-white/20">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Search Area */}
            <div className="flex-1 relative group z-20" ref={searchContainerRef}>
              <div className="relative w-full transition-all duration-300 transform">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-blue-500 dark:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-2.5 rounded-full leading-5 bg-white/80 dark:bg-[#102448]/70 backdrop-blur-md border border-[var(--glow-border-subtle)] focus:border-[var(--glow-border)] focus:shadow-[var(--glow-shadow)] placeholder-[#7889A8] dark:placeholder-[#8294B8] text-[#102A56] dark:text-[#F5F7FF] focus:outline-none transition-all duration-300 text-sm shadow-inner"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => {
                        onSearchChange(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                  <div className="glow-card absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-[#102448]/95 backdrop-blur-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-30">
                      <ul>
                          {suggestions.map((item) => (
                              <li 
                                key={item.product.id}
                                onClick={() => handleSuggestionClick(item.product.name)}
                                className="px-4 py-3 hover:bg-blue-500/10 dark:hover:bg-cyan-400/10 cursor-pointer border-b border-[var(--glow-border-subtle)] last:border-none flex items-center justify-between group"
                              >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    {/* Small thumbnail */}
                                    <div className="w-8 h-8 rounded bg-gray-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-[#102A56] dark:text-[#F5F7FF] truncate" dangerouslySetInnerHTML={{
                                            __html: item.product.name.replace(new RegExp(searchQuery, 'gi'), (match) => `<b>${match}</b>`)
                                        }}></span>
                                        
                                        <span className="text-xs text-brand-600 dark:text-cyan-400 truncate">
                                            {item.matchType === 'category' ? `in ${item.product.categories[0]}` : (item.product.categories[0] || 'Product')}
                                        </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>

            {/* Desktop Quick Action Buttons: Wishlist & Cart */}
            <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={onOpenWishlist}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/70 dark:bg-[#102448]/70 backdrop-blur-md text-[#102A56] dark:text-[#F5F7FF] hover:text-pink-500 border border-[var(--glow-border-subtle)] hover:border-[var(--glow-border)] glow-interactive transition-all font-semibold text-sm relative group shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 active:scale-[0.97]"
                title="My Wishlist"
              >
                <div className="relative flex items-center justify-center">
                  <span className="animate-wishlist-heart inline-flex items-center justify-center pointer-events-none">
                    <Heart className="w-4 h-4 text-[#FF3388] fill-[#FF3388]" />
                  </span>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2.5 -right-3 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-[#FF3377] to-[#FF5588] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-wishlist-badge pointer-events-none select-none border border-white/20">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </div>
                <span>Wishlist</span>
              </button>

              <button
                type="button"
                onClick={onOpenCart}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/70 dark:bg-[#102448]/70 backdrop-blur-md text-[#102A56] dark:text-[#F5F7FF] hover:text-blue-600 dark:hover:text-cyan-400 border border-[var(--glow-border-subtle)] hover:border-[var(--glow-border)] glow-interactive transition-all font-bold text-sm relative shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 active:scale-[0.97]"
                title="My Cart"
              >
                <div className="relative flex items-center justify-center">
                  <span className="animate-cart-rocking inline-flex items-center justify-center pointer-events-none">
                    <ShoppingCart className="w-4 h-4 text-[#102A56] dark:text-white stroke-[2.2px]" />
                  </span>
                  {cartCount > 0 && (
                    <span className="absolute -top-2.5 -right-3 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-cart-badge pointer-events-none select-none border border-white/20">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                <span>Cart</span>
              </button>
            </div>

          </div>

          {/* Bottom Row: Text Pills Categories */}
          <div className="bg-transparent border-b border-[rgba(92,137,220,0.1)] dark:border-[rgba(100,160,255,0.12)]">
            <div className="flex overflow-x-auto no-scrollbar py-2.5 px-3 space-x-2 md:space-x-3 items-center min-w-full">
              {CATEGORY_DETAILS.map((cat) => {
                 const isActive = activeCategory === cat.id;
                 
                 return (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id)}
                    className={`px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                        isActive 
                        ? 'glow-btn-primary text-white border-white/20' 
                        : 'glow-subtle bg-white/75 dark:bg-[#102448]/60 backdrop-blur-md text-[#102A56] dark:text-[#B8C7E8] hover:border-[var(--glow-border)] hover:bg-white dark:hover:bg-[#102448]/90 dark:hover:text-white'
                    }`}
                  >
                        {getTranslatedCategory(cat.id)}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </header>

      {/* Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => {
              setIsSidebarOpen(false);
              setAllCategoriesMenuOpen(false);
            }}
          ></div>

          {/* Sidebar Content matching Image 1 */}
          <div className="relative w-[85%] max-w-sm bg-slate-900 text-white h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col transition-colors duration-300 cursor-default" onClick={(e) => e.stopPropagation()}>
             
             {/* Header */}
             <div 
               className="border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-10"
               style={{ backgroundColor: '#C2185B' }}
             >
                <div className="flex items-center gap-3">
                   <div className="flex flex-col text-white justify-center">
                        <span className="text-lg font-bold leading-tight">Smart Deal Online</span>
                   </div>
                </div>
                <button 
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setAllCategoriesMenuOpen(false);
                  }} 
                  className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-y-auto bg-slate-900 py-2">
                
                {isLanguageMenuOpen ? (
                    // Language Selection View
                    <div className="animate-in slide-in-from-right duration-200">
                        <div className="p-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2 sticky top-0">
                            <button onClick={() => setIsLanguageMenuOpen(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full">
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                            <span className="font-bold text-gray-800 dark:text-gray-100">{t('chooseLanguage')}</span>
                        </div>
                        <div className="p-2">
                            {LANGUAGES.map(lang => (
                                <button
                                key={lang.code}
                                onClick={() => {
                                    onLanguageChange(lang.code);
                                    setIsLanguageMenuOpen(false);
                                    setIsSidebarOpen(false);
                                }}
                                className={`w-full text-left px-4 py-4 rounded-xl flex items-center justify-between transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0 ${currentLang === lang.code ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-bold' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'}`}
                                >
                                <span className="text-base">{lang.name}</span>
                                <span className="text-sm opacity-60 font-sans bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{lang.localName}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : isThemeMenuOpen ? (
                    // Theme Selection View
                    <div className="animate-in slide-in-from-right duration-200">
                        <div className="p-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2 sticky top-0">
                            <button onClick={() => setIsThemeMenuOpen(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full">
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                            <span className="font-bold text-gray-800 dark:text-gray-100">{t('appearance')}</span>
                        </div>
                        <div className="p-2 space-y-1">
                            {[
                                { id: 'light', label: t('light'), icon: Sun },
                                { id: 'dark', label: t('dark'), icon: Moon },
                                { id: 'system', label: t('systemDefault'), icon: Monitor }
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        onThemeChange(option.id as any);
                                        // Optional: close menu after selection or keep open
                                    }}
                                    className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-4 transition-colors ${currentTheme === option.id ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-bold' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'}`}
                                >
                                    <option.icon className={`w-5 h-5 ${currentTheme === option.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`} />
                                    <span className="text-base">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : isAllCategoriesMenuOpen ? (
                     // All Categories Submenu (Matching Image 1)
                     <div className="animate-in slide-in-from-right duration-200">
                        <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center gap-3 sticky top-0 text-white">
                            <button 
                              onClick={() => setAllCategoriesMenuOpen(false)} 
                              className="p-1 hover:bg-slate-800 rounded-full text-white transition-colors"
                              title="Back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <span className="font-bold text-base text-white">{t('allCategories') || 'All Categories'}</span>
                        </div>
                        <div className="py-1">
                             {/* Render categories matching Image 1 */}
                             {CATEGORY_DETAILS.filter(cat => !MAIN_CATEGORY_IDS.includes(cat.id)).map(cat => (
                                    <SidebarItem 
                                        key={cat.id}
                                        label={getTranslatedCategory(cat.id)}
                                        active={activeCategory === cat.id}
                                        onClick={() => {
                                          handleCategoryClick(cat.id);
                                          setAllCategoriesMenuOpen(false);
                                        }} 
                                    />
                             ))}
                        </div>
                     </div>
                ) : (
                    // Main Menu View
                    <div>
                        {/* Quick Access to Wishlist & Cart */}
                        <div className="mb-2">
                            <SidebarItem 
                                icon={Heart} 
                                label="My Wishlist" 
                                subText={wishlistCount > 0 ? `${wishlistCount} items` : undefined}
                                onClick={() => {
                                  setIsSidebarOpen(false);
                                  if (onOpenWishlist) onOpenWishlist();
                                }}
                            />
                            <SidebarItem 
                                icon={ShoppingCart} 
                                label="My Cart" 
                                subText={cartCount > 0 ? `${cartCount} items` : undefined}
                                onClick={() => {
                                  setIsSidebarOpen(false);
                                  if (onOpenCart) onOpenCart();
                                }}
                            />
                        </div>

                        <div className="h-1 bg-slate-800 mx-4 rounded mb-2"></div>

                        {/* Primary Actions */}
                        <div className="mb-2">
                            <SidebarItem icon={Languages} label={t('chooseLanguage')} onClick={() => setIsLanguageMenuOpen(true)} />
                            <SidebarItem icon={Moon} label={t('appearance')} onClick={() => setIsThemeMenuOpen(true)} subText={t(currentTheme === 'system' ? 'systemDefault' : currentTheme)} />
                        </div>

                        <div className="h-1 bg-slate-800 mx-4 rounded mb-2"></div>

                        {/* Highlighted Main Categories */}
                        <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('trending')} & {t('offerZone')}</div>
                        
                        <div className="mb-2">
                            <SidebarItem 
                                icon={TrendingUp} 
                                label={t('trending')} 
                                active={activeCategory === 'Trending'} 
                                onClick={() => handleCategoryClick('Trending')} 
                            />
                             <SidebarItem 
                                icon={Percent} 
                                label={t('offerZone')} 
                                active={activeCategory === 'Offer Zone'} 
                                onClick={() => handleCategoryClick('Offer Zone')} 
                            />
                            
                            {/* All Categories Trigger */}
                            <SidebarItem 
                                icon={LayoutGrid} 
                                label={t('allCategories')} 
                                onClick={() => setAllCategoriesMenuOpen(true)}
                                rightIcon={<ChevronRight className="w-4 h-4 text-gray-400" />}
                            />
                        </div>

                        <div className="h-1 bg-gray-50 dark:bg-slate-800 mx-4 rounded mb-2"></div>
                        
                        {/* Support & Legal */}
                        <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('support')}</div>
                        <SidebarItem icon={HelpCircle} label={t('helpCentre')} onClick={() => { onOpenInfoPage('help', true); setIsSidebarOpen(false); }} />
                        <SidebarItem icon={Info} label={t('aboutUs')} onClick={() => { onOpenInfoPage('about', true); setIsSidebarOpen(false); }} />
                        <SidebarItem icon={Scale} label={t('legal')} onClick={() => { onOpenInfoPage('legal', true); setIsSidebarOpen(false); }} />

                        <div className="h-1 bg-gray-50 dark:bg-slate-800 mx-4 rounded my-2"></div>

                        {/* Social Connect */}
                         <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('connectWithUs')}</div>
                         <div className="px-4 py-2 flex flex-wrap gap-3 mb-6">
                             {/* YouTube - Black Circle, White Icon */}
                             <a 
                               href="https://youtube.com/@smartdeal-online.products?si=DEQhBYCRqwK2apM6" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform bg-white dark:bg-transparent dark:shadow-none overflow-hidden border-2 border-transparent dark:border-white/20"
                             >
                                <img 
                                    src="https://cdn-icons-png.flaticon.com/512/2504/2504965.png" 
                                    alt="YouTube" 
                                    className="w-full h-full object-cover rounded-full" 
                                />
                             </a>

                             {/* Facebook - Black Circle, White Icon */}
                             <a 
                               href="https://www.facebook.com/share/1L7etvDEGm/" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform bg-white dark:bg-transparent dark:shadow-none overflow-hidden border-2 border-transparent dark:border-white/20"
                             >
                                <img 
                                    src="https://cdn-icons-png.flaticon.com/512/2504/2504903.png" 
                                    alt="Facebook" 
                                    className="w-full h-full object-cover rounded-full" 
                                />
                             </a>

                             {/* Instagram - Black Circle, White Icon */}
                             <a 
                               href="https://www.instagram.com/smart_deal_online?igsh=MWxzOTk5bGdobWMycA==" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform bg-white dark:bg-transparent dark:shadow-none overflow-hidden border-2 border-transparent dark:border-white/20"
                             >
                                <img 
                                    src="https://cdn-icons-png.flaticon.com/512/2504/2504918.png" 
                                    alt="Instagram" 
                                    className="w-full h-full object-cover rounded-full" 
                                />
                             </a>

                             {/* Gmail - Colorful Icon */}
                             <a 
                               href="mailto:albert.studio.1879@gmail.com" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform bg-white dark:bg-transparent dark:shadow-none overflow-hidden border-2 border-transparent dark:border-white/20"
                             >
                                <img 
                                    src="https://cdn-icons-png.flaticon.com/512/5968/5968534.png" 
                                    alt="Gmail" 
                                    className="w-full h-full object-contain p-2" 
                                />
                             </a>

                             {/* X (Twitter) - Black Circle, White Icon */}
                             <a 
                               href="https://x.com/smart_deal_on" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform bg-black dark:bg-black dark:shadow-none overflow-hidden border-2 border-transparent dark:border-white/20"
                             >
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                             </a>
                         </div>
                    </div>
                )}
             </div>

             {/* Sidebar Footer with Admin Trigger */}
             <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
               <p className="text-xs text-slate-400 select-none">
                 Smart Deal Online v2.<span onClick={onAdminClick} className="cursor-default">0</span>.{new Date().getFullYear().toString().slice(-2)}
               </p>
             </div>
          </div>
        </div>
      )}
    </>
  );
};
