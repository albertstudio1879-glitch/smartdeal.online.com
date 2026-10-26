
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductDetails } from './components/ProductDetails';
import { AdminPanel } from './components/AdminPanel';
import { TrendingBanner } from './components/TrendingBanner';
import { BestOfferBanner } from './components/BestOfferBanner';
import { Footer } from './components/Footer';
import { InfoPage } from './components/InfoPage';
import { FilterBar } from './components/FilterBar';
import { ShareModal } from './components/ShareModal';
import { BottomNav, BottomNavTab } from './components/BottomNav';
import { CartDrawer } from './components/CartDrawer';
import { AccountDrawer } from './components/AccountDrawer';
import { LoginModal } from './components/LoginModal';
import { UserAccount, initAuthListener, getLocalUser } from './services/authService';
import { 
  setupCloudSync, 
  cloudAddCartItem, 
  cloudUpdateCartQuantity,
  cloudRemoveCartItem, 
  cloudClearCartCloud, 
  cloudAddWishlistItem, 
  cloudRemoveWishlistItem, 
  cloudClearWishlistCloud 
} from './services/syncService';
import { Product, Category, Theme } from './types';
import { 
  getProducts, 
  saveProduct, 
  deleteProduct, 
  updateProductInteraction, 
  getSiteSettings, 
  SiteSettings,
  getCartProductIds,
  saveCartProductIds,
  toggleCartProduct,
  getWishlistProductIds,
  saveWishlistProductIds,
  toggleWishlistProduct,
  WishlistEntry,
  getWishlistEntries
} from './services/storageService';
import { Language, getTranslation } from './utils/translations';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F9FF] dark:bg-[#071329] text-[#102A56] dark:text-[#F5F7FF] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold">SD</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Smart Deal Online</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
            Something unexpected occurred. Tap below to reload the store smoothly.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            Reload Store
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [sharingProduct, setSharingProduct] = useState<Product | null>(null);
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});

  // Bottom Navigation & Drawer States
  const [activeBottomTab, setActiveBottomTab] = useState<BottomNavTab>('home');
  const [cartProductIds, setCartProductIds] = useState<string[]>([]);
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([]);
  const [wishlistEntries, setWishlistEntries] = useState<WishlistEntry[]>([]);
  const [cartDrawerInitialTab, setCartDrawerInitialTab] = useState<'cart' | 'wishlist'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'wishlist' || params.get('view') === 'wishlist') return 'wishlist';
    return 'cart';
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAllCategoriesOpen, setIsAllCategoriesOpen] = useState(false);
  
  // Filtering & Sorting State
  const [activePriceRange, setActivePriceRange] = useState<string | null>(null);
  const [activeMinOffer, setActiveMinOffer] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'discount' | 'likes'>('default');

  // Info Page & Navigation State
  const [activeInfoPage, setActiveInfoPage] = useState<{title: string, content: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [returnToSidebar, setReturnToSidebar] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  // User Authentication State for Cloud Sync
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = initAuthListener((u) => {
      setCurrentUser(prevUser => {
        if (prevUser?.uid !== u?.uid) {
          setCartProductIds([]);
          setWishlistProductIds([]);
          setWishlistEntries([]);
        }
        return u;
      });
      setIsAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!currentUser || !currentUser.uid) {
      setCartProductIds(getCartProductIds(null));
      setWishlistProductIds(getWishlistProductIds(null));
      setWishlistEntries(getWishlistEntries(null));
      return;
    }
    const unsubSync = setupCloudSync(
      currentUser.uid,
      (ids, quantities) => {
        setCartProductIds(ids);
      },
      (entries) => {
        setWishlistEntries(entries);
        setWishlistProductIds(entries.map(e => e.id));
      }
    );
    return () => unsubSync();
  }, [isAuthLoading, currentUser?.uid]);

  // Apply Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (t: Theme) => {
        if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme('system');
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Body Scroll Lock Effect
  useEffect(() => {
    if (selectedProductId || activeInfoPage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProductId, activeInfoPage]);

  const loadData = async () => {
    setIsLoading(true);
    const data = await getProducts();
    setProducts(data);
    setSiteSettings(getSiteSettings());
    const uid = currentUser?.uid || null;
    const cartIds = getCartProductIds(uid);
    setCartProductIds(cartIds);
    const wishlistIds = getWishlistProductIds(uid);
    setWishlistProductIds(wishlistIds);
    setWishlistEntries(getWishlistEntries(uid));
    setIsLoading(false);

    // Deep Link Logic: Check URL for ?code=XYZ
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && data.length > 0) {
        // Find product by code (case-insensitive)
        const foundProduct = data.find(p => p.code.toLowerCase() === codeParam.toLowerCase());
        if (foundProduct) {
            setSelectedProductId(foundProduct.id);
        }
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      loadData();
    }
  }, [isAuthLoading]);

  // Sync bottom tab when sidebar closes
  useEffect(() => {
    if (!isSidebarOpen) {
      setIsAllCategoriesOpen(false);
      if (activeBottomTab === 'categories') {
        setActiveBottomTab('home');
      }
    }
  }, [isSidebarOpen, activeBottomTab]);

  // Bottom Navigation Handlers
  const handleBottomTabChange = (tab: BottomNavTab) => {
    setActiveBottomTab(tab);
    if (tab === 'home') {
      setIsCartOpen(false);
      setIsAccountOpen(false);
      setIsAllCategoriesOpen(false);
      setIsSidebarOpen(false);
      setActiveCategory('All');
      setSearchQuery('');
      setActivePriceRange(null);
      setActiveMinOffer(null);
      setSortBy('default');
      setSelectedProductId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'categories') {
      setIsSidebarOpen(true);
      setIsAllCategoriesOpen(true);
      setIsCartOpen(false);
      setIsAccountOpen(false);
    } else if (tab === 'account') {
      setIsAccountOpen(true);
      setIsCartOpen(false);
      setIsAllCategoriesOpen(false);
      setIsSidebarOpen(false);
    } else if (tab === 'wishlist') {
      setSelectedProductId(null);
      setCartDrawerInitialTab('wishlist');
      setIsCartOpen(true);
      setIsAccountOpen(false);
      setIsAllCategoriesOpen(false);
      setIsSidebarOpen(false);
    } else if (tab === 'cart') {
      setSelectedProductId(null);
      setCartDrawerInitialTab('cart');
      setIsCartOpen(true);
      setIsAccountOpen(false);
      setIsAllCategoriesOpen(false);
      setIsSidebarOpen(false);
    }
  };

  const handleCloseDrawers = () => {
    setIsCartOpen(false);
    setIsAccountOpen(false);
    setIsAllCategoriesOpen(false);
    setIsSidebarOpen(false);
    setActiveBottomTab('home');
  };

  const handleToggleCart = (id: string) => {
    const uid = currentUser?.uid || null;
    const updated = toggleCartProduct(id, cartProductIds, uid);
    setCartProductIds(updated);
    if (currentUser) {
      const isNowInCart = updated.includes(id);
      if (isNowInCart) {
        cloudAddCartItem(currentUser.uid, id, 1);
      } else {
        cloudRemoveCartItem(currentUser.uid, id);
      }
    }
  };

  const handleRemoveFromCart = (id: string) => {
    const uid = currentUser?.uid || null;
    const updated = cartProductIds.filter(itemId => itemId !== id);
    setCartProductIds(updated);
    saveCartProductIds(updated, uid);
    if (currentUser) {
      cloudRemoveCartItem(currentUser.uid, id);
    }
  };

  const handleClearCart = () => {
    const uid = currentUser?.uid || null;
    const oldIds = [...cartProductIds];
    setCartProductIds([]);
    saveCartProductIds([], uid);
    if (currentUser && oldIds.length > 0) {
      cloudClearCartCloud(currentUser.uid, oldIds);
    }
  };

  const handleToggleWishlist = (id: string) => {
    const uid = currentUser?.uid || null;
    const updated = toggleWishlistProduct(id, wishlistProductIds, uid);
    setWishlistProductIds(updated);
    setWishlistEntries(getWishlistEntries(uid));
    if (currentUser) {
      const isNowInWishlist = updated.includes(id);
      if (isNowInWishlist) {
        cloudAddWishlistItem(currentUser.uid, id);
      } else {
        cloudRemoveWishlistItem(currentUser.uid, id);
      }
    }
  };

  const handleOpenWishlist = () => {
    setSelectedProductId(null);
    setCartDrawerInitialTab('wishlist');
    setIsCartOpen(true);
    setActiveBottomTab('cart');
  };

  const handleOpenCart = () => {
    setSelectedProductId(null);
    setCartDrawerInitialTab('cart');
    setIsCartOpen(true);
    setActiveBottomTab('cart');
  };

  const handleClearWishlist = () => {
    const uid = currentUser?.uid || null;
    const oldIds = [...wishlistProductIds];
    setWishlistProductIds([]);
    setWishlistEntries([]);
    saveWishlistEntries([], uid);
    if (currentUser && oldIds.length > 0) {
      cloudClearWishlistCloud(currentUser.uid, oldIds);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveProduct = async (newProduct: Product) => {
    // Optimistic update for UI speed, but real data comes from sheet refresh
    setProducts(prev => [newProduct, ...prev]);
    const updatedList = await saveProduct(newProduct);
    setProducts(updatedList);
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    const updatedList = await deleteProduct(id);
    setProducts(updatedList);
  }

  const handleInteraction = (productId: string, type: 'like' | 'dislike', currentLikeState: 'none' | 'liked' | 'disliked') => {
    setProducts(prevProducts => {
       return prevProducts.map(p => {
          if (p.id !== productId) return p;

          let newLikes = p.likes;
          let newDislikes = p.dislikes;
          
          if (type === 'like') {
             if (currentLikeState === 'liked') {
               newLikes--;
             } else {
               newLikes++;
               if (currentLikeState === 'disliked') newDislikes--;
             }
          } else { 
             if (currentLikeState === 'disliked') {
               newDislikes--;
             } else {
               newDislikes++;
               if (currentLikeState === 'liked') newLikes--;
             }
          }
          updateProductInteraction(productId, { likes: newLikes, dislikes: newDislikes });
          return { ...p, likes: newLikes, dislikes: newDislikes };
       });
    });
  };

  const cleanPrice = (val: string | undefined): number => {
      if (!val) return 0;
      return parseFloat(val.toString().replace(/[^0-9.]/g, '')) || 0;
  };

  const getDiscount = (p: Product): number => {
       const mrp = cleanPrice(p.mrp);
       const price = cleanPrice(p.price);
       if (!mrp || !price || mrp <= price) return 0;
       return ((mrp - price) / mrp) * 100;
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.code.toLowerCase().includes(query)
      );
    } else {
      // 2. Category Filter
      if (activeCategory === 'All') {
        filtered = products;
      } else if (activeCategory === 'Offer Zone') {
         filtered = filtered
            .filter(p => getDiscount(p) > 55)
            .sort((a, b) => getDiscount(b) - getDiscount(a));
      } else if (activeCategory === 'Trending') {
        const taggedTrending = filtered.filter(p => p.categories && p.categories.includes('Trending'));
        filtered = taggedTrending.length > 0 ? taggedTrending : filtered.slice(0, 10);
      } else {
        filtered = filtered.filter(p => {
          const cats = p.categories || [];
          if (activeCategory === 'Mobile') {
             return cats.includes('Mobile') || (cats as string[]).includes('Mobiles');
          }
          if (activeCategory === 'Home & Appliances') {
             return cats.includes('Home & Appliances') || cats.includes('Home') || cats.includes('Appliances');
          }
          return cats.includes(activeCategory);
        });
      }
    }

    // 3. Price Range Filter
    if (activePriceRange) {
        filtered = filtered.filter(p => {
            const price = cleanPrice(p.price);
            if (activePriceRange === '100000+') return price >= 100000;
            
            const [min, max] = activePriceRange.split('-').map(Number);
            return price >= min && price <= max;
        });
    }

    // 4. Min Offer Filter
    if (activeMinOffer) {
        filtered = filtered.filter(p => getDiscount(p) >= activeMinOffer);
    }

    // 5. Sorting
    if (sortBy === 'likes') {
        filtered = [...filtered].sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'discount') {
        filtered = [...filtered].sort((a, b) => getDiscount(b) - getDiscount(a));
    }
    
    return filtered;
  }, [products, activeCategory, searchQuery, activePriceRange, activeMinOffer, sortBy]);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleBuy = (product: Product) => {
    if (product.affiliateLink) {
        window.open(product.affiliateLink, '_blank');
    }
  };

  const t = (key: string) => getTranslation(currentLang, key);

  const handleOpenInfoPage = (pageKey: 'help' | 'about' | 'legal', fromSidebar: boolean = false) => {
      const title = getTranslation(currentLang, `${pageKey}Title`);
      const content = getTranslation(currentLang, `${pageKey}Content`);
      setActiveInfoPage({ title, content });
      setReturnToSidebar(fromSidebar);
      setIsSidebarOpen(false); 
  };

  const handleInfoPageBack = () => {
    setActiveInfoPage(null);
    if (returnToSidebar) setIsSidebarOpen(true);
    setReturnToSidebar(false);
  };

  const getCategoryTitle = () => {
    if (searchQuery) return `${t('resultsFor')} "${searchQuery}"`;
    if (activeCategory === 'All') return ''; 
    if (activeCategory === 'Offer Zone') return t('offerZone');
    
    const catKey = activeCategory.toLowerCase().replace(/ /g, '').replace('&', '').replace('acc', 'acc') as any;
    return t(catKey) !== catKey ? t(catKey) : activeCategory;
  };

  // Determine if we should show the Best Offer Banner interspersed in the grid
  const showBestOffersBanner = activeCategory === 'All' && !searchQuery && !activePriceRange && !activeMinOffer && sortBy === 'default';
  const productsBeforeBanner = showBestOffersBanner ? filteredProducts.slice(0, 4) : filteredProducts;
  const productsAfterBanner = showBestOffersBanner ? filteredProducts.slice(4) : [];

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FF] dark:bg-[#071329] text-[#102A56] dark:text-[#F5F7FF] flex items-center justify-center flex-col transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FF] dark:bg-[#071329] text-[#102A56] dark:text-[#F5F7FF] font-sans transition-colors duration-300">
      
      {/* 
         Structure Change:
         Render Header, Main, Footer ALWAYS to preserve scroll position.
         Render Overlays (ProductDetails, InfoPage) on top based on state.
      */}

      <Header 
        activeCategory={activeCategory} 
        onCategoryChange={(cat) => {
          setActiveCategory(cat);
          setSearchQuery('');
          // Reset filters when changing categories
          setActivePriceRange(null);
          setActiveMinOffer(null);
          setSortBy('default');
          window.scrollTo({ top: 0, behavior: 'smooth' }); // Explicitly scroll to top on category change
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        products={products}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        siteSettings={siteSettings}
        onAdminClick={() => setIsAdminOpen(true)}
        currentTheme={theme}
        onThemeChange={setTheme}
        onOpenInfoPage={handleOpenInfoPage}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isAllCategoriesOpen={isAllCategoriesOpen}
        setIsAllCategoriesOpen={setIsAllCategoriesOpen}
        cartCount={cartProductIds.length}
        wishlistCount={wishlistProductIds.length}
        onOpenCart={handleOpenCart}
        onOpenWishlist={handleOpenWishlist}
      />

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
        
        {/* Show Trending Banner only on Home (All) tab and when not searching */}
        {activeCategory === 'All' && !searchQuery && !activePriceRange && !activeMinOffer && sortBy === 'default' && (
          <TrendingBanner products={products} onProductClick={setSelectedProductId} />
        )}

        <div className="flex items-center justify-between mb-2 px-2">
          {getCategoryTitle() && (
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {getCategoryTitle()}
            </h2>
          )}
        </div>
        
        {/* Comprehensive Filter Bar */}
        <FilterBar 
          sortBy={sortBy}
          onSortChange={setSortBy}
          activePriceRange={activePriceRange}
          onPriceRangeChange={setActivePriceRange}
          activeMinOffer={activeMinOffer}
          onMinOfferChange={setActiveMinOffer}
          resultCount={filteredProducts.length}
        />

        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 mt-2">
              {productsBeforeBanner.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={() => setSelectedProductId(product.id)}
                  onInteraction={handleInteraction}
                  onBuy={() => handleBuy(product)}
                  lang={currentLang}
                  onShare={() => setSharingProduct(product)}
                  isInCart={cartProductIds.includes(product.id)}
                  onToggleCart={handleToggleCart}
                  isInWishlist={wishlistProductIds.includes(product.id)}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>

            {/* Interstitial Best Offer Banner */}
            {showBestOffersBanner && (
               <div className="mt-6">
                  <BestOfferBanner products={products} onProductClick={setSelectedProductId} />
               </div>
            )}

            {productsAfterBanner.length > 0 && (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 mt-2 sm:mt-4">
                  {productsAfterBanner.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onClick={() => setSelectedProductId(product.id)}
                      onInteraction={handleInteraction}
                      onBuy={() => handleBuy(product)}
                      lang={currentLang}
                      onShare={() => setSharingProduct(product)}
                      isInCart={cartProductIds.includes(product.id)}
                      onToggleCart={handleToggleCart}
                      isInWishlist={wishlistProductIds.includes(product.id)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
               </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">{t('noProducts')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('tryAdjusting')}</p>
          </div>
        )}
      </main>

      <Footer 
        settings={siteSettings} 
        onAdminClick={() => setIsAdminOpen(true)} 
        lang={currentLang} 
        onOpenInfoPage={handleOpenInfoPage}
      />

      {/* Fixed Bottom Navigation Area (Home, Categories, Wishlist, Account, Cart) */}
      {!selectedProductId && (
        <BottomNav 
          activeTab={activeBottomTab}
          onTabChange={handleBottomTabChange}
          cartCount={cartProductIds.length}
          wishlistCount={wishlistProductIds.length}
          lang={currentLang}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={handleCloseDrawers}
        cartProductIds={cartProductIds}
        products={products}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onProductClick={(id) => {
          setSelectedProductId(id);
          handleCloseDrawers();
        }}
        onBuyItem={handleBuy}
        lang={currentLang}
        wishlistProductIds={wishlistProductIds}
        wishlistEntries={wishlistEntries}
        onToggleWishlist={handleToggleWishlist}
        onClearWishlist={handleClearWishlist}
        onAddToCart={handleToggleCart}
        initialTab={cartDrawerInitialTab}
        onUpdateQuantity={(id, qty) => {
          if (currentUser) {
            cloudUpdateCartQuantity(currentUser.uid, id, qty);
          }
        }}
      />

      {/* Account Drawer */}
      <AccountDrawer 
        isOpen={isAccountOpen}
        onClose={handleCloseDrawers}
        cartCount={cartProductIds.length}
        wishlistCount={wishlistProductIds.length}
        onOpenCart={() => {
          setCartDrawerInitialTab('cart');
          handleCloseDrawers();
          setIsCartOpen(true);
          setActiveBottomTab('cart');
        }}
        onOpenWishlist={() => {
          setCartDrawerInitialTab('wishlist');
          handleCloseDrawers();
          setIsCartOpen(true);
          setActiveBottomTab('cart');
        }}
        onOpenAdmin={() => {
          handleCloseDrawers();
          setIsAdminOpen(true);
        }}
        onOpenLogin={() => {
          handleCloseDrawers();
          setIsLoginOpen(true);
        }}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        currentTheme={theme}
        onThemeChange={setTheme}
        onOpenInfoPage={(page) => handleOpenInfoPage(page, false)}
      />

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* Overlays */}
      
      {selectedProduct && (
        <ProductDetails 
          product={selectedProduct} 
          allProducts={products}
          onProductClick={setSelectedProductId}
          onBack={() => {
              setSelectedProductId(null);
              window.history.replaceState({}, '', window.location.pathname);
          }} 
          onInteraction={handleInteraction}
          onBuy={() => handleBuy(selectedProduct)}
          onBuyItem={handleBuy}
          lang={currentLang}
          onShare={(p) => setSharingProduct(p)}
          isInCart={cartProductIds.includes(selectedProduct.id)}
          cartProductIds={cartProductIds}
          onToggleCart={handleToggleCart}
          isInWishlist={wishlistProductIds.includes(selectedProduct.id)}
          wishlistProductIds={wishlistProductIds}
          onToggleWishlist={handleToggleWishlist}
          onOpenWishlist={handleOpenWishlist}
          onOpenCart={handleOpenCart}
        />
      )}

      {activeInfoPage && (
          <InfoPage 
            title={activeInfoPage.title}
            content={activeInfoPage.content}
            onBack={handleInfoPageBack}
          />
      )}

      {/* Sharing Modal */}
      {sharingProduct && (
        <ShareModal 
            product={sharingProduct} 
            onClose={() => setSharingProduct(null)} 
        />
      )}

      {isAdminOpen && (
        <AdminPanel 
          onClose={() => {
              setIsAdminOpen(false);
              loadData(); // Refresh on close in case settings changed
          }} 
          onAddProduct={handleSaveProduct}
          products={products}
          onDeleteProduct={handleDeleteProduct}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
