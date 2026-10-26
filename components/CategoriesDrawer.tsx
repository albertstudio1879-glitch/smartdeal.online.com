import React, { useState, useMemo } from 'react';
import { Category, CATEGORY_DETAILS, Product } from '../types';
import { Language, getTranslation } from '../utils/translations';
import { 
  X, Search, LayoutGrid, Flame, Sparkles, Clock, 
  Smartphone, ShoppingBag, Shirt, Home, ChefHat, 
  Sparkle, Armchair, Trophy, HeartPulse, Car, Baby, Layers,
  ExternalLink, ShoppingCart, ArrowRight, Grid3X3, ListFilter
} from 'lucide-react';

interface CategoriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: Category;
  onSelectCategory: (cat: Category) => void;
  products: Product[];
  onProductClick?: (id: string) => void;
  onBuyItem?: (product: Product) => void;
  onToggleCart?: (id: string) => void;
  cartProductIds?: string[];
  lang?: Language;
}

export const CategoriesDrawer: React.FC<CategoriesDrawerProps> = ({
  isOpen,
  onClose,
  activeCategory,
  onSelectCategory,
  products = [],
  onProductClick,
  onBuyItem,
  onToggleCart,
  cartProductIds = [],
  lang = 'en',
}) => {
  const [selectedCat, setSelectedCat] = useState<Category>(activeCategory || 'Trending');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'all-aisles'>('split');

  if (!isOpen) return null;

  const t = (key: string) => getTranslation(lang, key);

  const getTranslatedCategory = (cat: string) => {
    const catKey = cat.toLowerCase().replace(/ /g, '').replace('&', '').replace('acc', 'acc') as any;
    return t(catKey);
  };

  const getCategoryIcon = (id: Category) => {
    switch (id) {
      case 'All':
        return <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'Trending':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'Offer Zone':
        return <Sparkles className="w-5 h-5 text-red-500" />;
      case 'Mobile':
        return <Smartphone className="w-5 h-5 text-indigo-500" />;
      case 'Grocery':
        return <ShoppingBag className="w-5 h-5 text-green-500" />;
      case 'Fashion':
      case 'For Gen Z':
        return <Shirt className="w-5 h-5 text-pink-500" />;
      case 'Home':
      case 'Home & Appliances':
        return <Home className="w-5 h-5 text-amber-500" />;
      case 'Kitchen':
        return <ChefHat className="w-5 h-5 text-orange-600" />;
      case 'Beauty':
        return <Sparkle className="w-5 h-5 text-rose-500" />;
      case 'Furniture':
        return <Armchair className="w-5 h-5 text-stone-500" />;
      case 'Sports':
        return <Trophy className="w-5 h-5 text-emerald-500" />;
      case 'Food & Health':
        return <HeartPulse className="w-5 h-5 text-red-600" />;
      case 'Auto Acc':
        return <Car className="w-5 h-5 text-cyan-600" />;
      case 'Toys & Baby':
        return <Baby className="w-5 h-5 text-teal-500" />;
      default:
        return <LayoutGrid className="w-5 h-5 text-gray-500" />;
    }
  };

  const cleanPrice = (val: string | undefined): number => {
    if (!val) return 0;
    return parseFloat(val.toString().replace(/[^0-9.]/g, '')) || 0;
  };

  const getDiscount = (p: Product): number => {
    const mrp = cleanPrice(p.mrp);
    const price = cleanPrice(p.price);
    if (!mrp || !price || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  const formatPrice = (price: string | undefined) => {
    if (!price) return '';
    const clean = price.toString().trim();
    return clean.startsWith('₹') ? clean : `₹${clean}`;
  };

  // Helper to get products matching a specific category
  const getProductsForCategory = (cat: Category): Product[] => {
    if (cat === 'All') return products;
    if (cat === 'Offer Zone') {
      return products
        .filter(p => getDiscount(p) > 50)
        .sort((a, b) => getDiscount(b) - getDiscount(a));
    }
    if (cat === 'Trending') {
      const tagged = products.filter(p => p.categories && p.categories.includes('Trending'));
      return tagged.length > 0 ? tagged : products.slice(0, 10);
    }
    return products.filter(p => {
      const cats = p.categories || [];
      if (cat === 'Mobile') {
        return cats.includes('Mobile') || (cats as string[]).includes('Mobiles');
      }
      if (cat === 'Home & Appliances') {
        return cats.includes('Home & Appliances') || cats.includes('Home') || cats.includes('Appliances');
      }
      return cats.includes(cat);
    });
  };

  // Filter categories by search
  const filteredCategories = CATEGORY_DETAILS.filter(cat => {
    const translated = getTranslatedCategory(cat.id).toLowerCase();
    const original = cat.label.toLowerCase();
    const q = search.toLowerCase().trim();
    return translated.includes(q) || original.includes(q);
  });

  // Products for the currently selected category in split mode
  const currentCategoryProducts = useMemo(() => {
    let list = getProductsForCategory(selectedCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.code?.toLowerCase().includes(q) ||
        p.categories?.some(c => c.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedCat, products, search]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-4xl bg-[#F7F9FF] dark:bg-[#071329] shadow-2xl flex flex-col transition-colors duration-300 overflow-hidden">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-white/80 dark:bg-[#102448]/80 backdrop-blur-xl border-b border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)] flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#6C3BFF]/20 to-[#2589FF]/20 text-[#6C3BFF] dark:text-cyan-400 flex items-center justify-center border border-blue-400/30">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#102A56] dark:text-[#F5F7FF] flex items-center gap-2">
                  <span>{t('allCategories') || 'All Categories'}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 text-[#6C3BFF] dark:text-cyan-300 border border-blue-400/25 font-bold">
                    {products.length} Items
                  </span>
                </h2>
                <p className="text-[11px] text-[#526B98] dark:text-[#8294B8]">
                  Browse products and offers by department
                </p>
              </div>
            </div>

            {/* View Mode Toggle & Close */}
            <div className="flex items-center gap-2">
              <div className="bg-white/60 dark:bg-[#102448]/60 p-0.5 rounded-xl border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.25)] flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                    viewMode === 'split' 
                      ? 'bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] text-white shadow-xs font-bold' 
                      : 'text-[#526B98] hover:text-[#102A56] dark:text-[#8294B8] dark:hover:text-[#F5F7FF]'
                  }`}
                  title="Department View"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Departments</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('all-aisles')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                    viewMode === 'all-aisles' 
                      ? 'bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] text-white shadow-xs font-bold' 
                      : 'text-[#526B98] hover:text-[#102A56] dark:text-[#8294B8] dark:hover:text-[#F5F7FF]'
                  }`}
                  title="All Aisles View"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">All Aisles</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white/70 dark:bg-[#102448]/70 text-[#102A56] dark:text-[#F5F7FF] hover:scale-105 active:scale-95 border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.25)] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-4 py-2.5 bg-white/70 dark:bg-[#102448]/70 backdrop-blur-md border-b border-[var(--glow-border-subtle)]">
            <div className="relative">
              <Search className="w-4 h-4 text-blue-500 dark:text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories or items..."
                className="w-full pl-10 pr-8 py-2 bg-white/70 dark:bg-[#071329]/60 border border-[var(--glow-border-subtle)] focus:border-[var(--glow-border)] rounded-full text-xs sm:text-sm text-[#102A56] dark:text-[#F5F7FF] placeholder-[#7889A8] dark:placeholder-[#8294B8] focus:outline-none focus:ring-2 focus:ring-cyan-400/30 glow-subtle"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'split' ? (
              /* Two-Column Flipkart/Amazon Style Category Explorer */
              <div className="flex h-full">
                
                {/* Left Column: Categories List */}
                <div className="w-28 sm:w-44 md:w-52 border-r border-[var(--glow-border-subtle)] bg-white/70 dark:bg-[#0B1935]/80 backdrop-blur-lg overflow-y-auto flex-shrink-0 select-none">
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCat === cat.id;
                    const count = getProductsForCategory(cat.id).length;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCat(cat.id)}
                        className={`w-full text-left p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 border-l-4 transition-all relative cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#6C3BFF]/20 to-[#2589FF]/20 border-cyan-400 text-blue-600 dark:text-cyan-300 font-bold'
                            : 'border-transparent text-[#526B98] dark:text-[#B8C7E8] hover:bg-white/50 dark:hover:bg-[#102448]/50'
                        }`}
                      >
                        <div className={`p-1.5 rounded-xl flex-shrink-0 border ${
                          isSelected 
                            ? 'bg-white dark:bg-[#102448] border-cyan-400 shadow-[0_0_8px_rgba(0,217,255,0.3)]' 
                            : 'bg-white/60 dark:bg-[#102448]/60 border-[var(--glow-border-subtle)]'
                        }`}>
                          {getCategoryIcon(cat.id)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm leading-tight truncate">
                            {getTranslatedCategory(cat.id)}
                          </p>
                          <span className="text-[10px] text-[#7889A8] dark:text-[#8294B8] font-normal">
                            {count} {count === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right Column: Items belonging to the selected category */}
                <div className="flex-1 bg-transparent overflow-y-auto p-3 sm:p-4">
                  {/* Category Banner & Action */}
                  <div className="glow-card rounded-2xl p-3 sm:p-4 mb-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 rounded-xl border border-blue-400/25">
                        {getCategoryIcon(selectedCat)}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#102A56] dark:text-[#F5F7FF]">
                          {getTranslatedCategory(selectedCat)}
                        </h3>
                        <p className="text-[11px] text-[#526B98] dark:text-[#8294B8]">
                          {currentCategoryProducts.length} items available
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory(selectedCat);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white glow-btn-primary px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      <span>View on feed</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Grid of Items in this Category */}
                  {currentCategoryProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 pb-16">
                      {currentCategoryProducts.map((product) => {
                        const discount = getDiscount(product);
                        const isInCart = cartProductIds.includes(product.id);

                        return (
                          <div
                            key={product.id}
                            className="glow-card rounded-2xl overflow-hidden flex flex-col group"
                          >
                            {/* Product Image */}
                            <div 
                              onClick={() => {
                                onProductClick && onProductClick(product.id);
                                onClose();
                              }}
                              className="aspect-square bg-white p-2.5 relative cursor-pointer overflow-hidden flex items-center justify-center border-b border-[rgba(92,137,220,0.15)] dark:border-[rgba(100,160,255,0.2)]"
                            >
                              <img 
                                src={product.images?.[0] || 'https://picsum.photos/300'} 
                                alt={product.name} 
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                              />

                              {/* Discount badge */}
                              {discount > 0 && (
                                <span className="absolute top-2 left-2 bg-gradient-to-r from-[#FF4D91] to-[#FF8A48] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                                  {discount}% OFF
                                </span>
                              )}

                              {/* Cart Toggle button */}
                              {onToggleCart && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleCart(product.id);
                                  }}
                                  className={`absolute top-2 right-2 p-1.5 rounded-full shadow-sm transition-all active:scale-90 ${
                                    isInCart 
                                      ? 'bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] text-white' 
                                      : 'bg-white/90 text-gray-700 hover:text-blue-600 shadow-xs'
                                  }`}
                                  title={isInCart ? 'In Cart' : 'Add to Cart'}
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Details */}
                            <div className="p-2.5 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 
                                  onClick={() => {
                                    onProductClick && onProductClick(product.id);
                                    onClose();
                                  }}
                                  className="text-xs sm:text-sm font-medium text-[#102A56] dark:text-[#F5F7FF] line-clamp-2 hover:text-[#2589FF] cursor-pointer leading-snug"
                                  title={product.name}
                                >
                                  {product.name}
                                </h4>

                                <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold text-[#102A56] dark:text-[#F5F7FF]">
                                    {formatPrice(product.price)}
                                  </span>
                                  {product.mrp && (
                                    <span className="text-[10px] text-[#7889A8] dark:text-[#8294B8] line-through">
                                      {formatPrice(product.mrp)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Buy button */}
                              <div className="mt-2.5 pt-2 border-t border-[rgba(92,137,220,0.15)] dark:border-[rgba(100,160,255,0.2)] flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onBuyItem && onBuyItem(product)}
                                  className="flex-1 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] hover:brightness-110 text-white text-xs font-bold py-2 px-2.5 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-1 shadow-md cursor-pointer border border-white/20"
                                >
                                  <span>{t('buyNow')}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white/80 dark:bg-[#102448]/80 backdrop-blur-xl rounded-2xl border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)]">
                      <div className="text-3xl mb-2">📦</div>
                      <h4 className="text-sm font-bold text-[#102A56] dark:text-[#F5F7FF]">No items found</h4>
                      <p className="text-xs text-[#526B98] dark:text-[#8294B8] mt-1">Try selecting another category or clear your search</p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* All Aisles View: Section for every category with its items */
              <div className="h-full overflow-y-auto p-4 space-y-6 pb-20">
                {CATEGORY_DETAILS.map((cat) => {
                  const items = getProductsForCategory(cat.id);
                  if (items.length === 0) return null;

                  return (
                    <div key={cat.id} className="space-y-3">
                      {/* Section Header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.2)]">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 rounded-xl border border-blue-400/25">
                            {getCategoryIcon(cat.id)}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-[#102A56] dark:text-[#F5F7FF]">
                            {getTranslatedCategory(cat.id)}
                          </h3>
                          <span className="text-xs text-[#7889A8] dark:text-[#8294B8]">
                            ({items.length})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectCategory(cat.id);
                            onClose();
                          }}
                          className="text-xs font-bold text-[#2589FF] dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>See All</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Horizontal Snap Scroll of items in this category */}
                      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 snap-x">
                        {items.slice(0, 10).map((product) => {
                          const discount = getDiscount(product);
                          const isInCart = cartProductIds.includes(product.id);

                          return (
                            <div 
                              key={product.id}
                              className="w-36 sm:w-44 flex-shrink-0 glow-card rounded-2xl overflow-hidden snap-start flex flex-col justify-between"
                            >
                              <div 
                                onClick={() => {
                                  onProductClick && onProductClick(product.id);
                                  onClose();
                                }}
                                className="aspect-square bg-white p-2 relative cursor-pointer overflow-hidden flex items-center justify-center border-b border-[rgba(92,137,220,0.15)] dark:border-[rgba(100,160,255,0.2)]"
                              >
                                <img 
                                  src={product.images?.[0] || 'https://picsum.photos/200'} 
                                  alt={product.name} 
                                  className="w-full h-full object-contain"
                                />
                                {discount > 0 && (
                                  <span className="absolute top-1.5 left-1.5 bg-gradient-to-r from-[#FF4D91] to-[#FF8A48] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                    {discount}%
                                  </span>
                                )}
                              </div>

                              <div className="p-2 flex flex-col justify-between flex-1">
                                <h4 
                                  onClick={() => {
                                    onProductClick && onProductClick(product.id);
                                    onClose();
                                  }}
                                  className="text-xs font-medium text-[#102A56] dark:text-[#F5F7FF] line-clamp-2 cursor-pointer hover:text-[#2589FF]"
                                >
                                  {product.name}
                                </h4>

                                <div className="mt-1 flex items-baseline gap-1">
                                  <span className="text-xs font-bold text-[#102A56] dark:text-[#F5F7FF]">
                                    {formatPrice(product.price)}
                                  </span>
                                  {product.mrp && (
                                    <span className="text-[10px] text-[#7889A8] dark:text-[#8294B8] line-through">
                                      {formatPrice(product.mrp)}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 flex items-center gap-1.5">
                                  {onToggleCart && (
                                    <button
                                      type="button"
                                      onClick={() => onToggleCart(product.id)}
                                      className={`p-1.5 rounded-xl border text-xs cursor-pointer ${
                                        isInCart 
                                          ? 'bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] text-white border-transparent' 
                                          : 'border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] text-[#526B98] dark:text-[#B8C7E8] bg-white/60 dark:bg-[#102448]/60'
                                      }`}
                                      title="Cart"
                                    >
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onBuyItem && onBuyItem(product)}
                                    className="flex-1 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] hover:brightness-110 text-white text-[11px] font-bold py-1.5 rounded-xl text-center shadow-xs cursor-pointer"
                                  >
                                    Buy
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)] bg-white/80 dark:bg-[#102448]/80 backdrop-blur-xl flex items-center justify-between text-xs safe-pb">
            <span className="text-[#526B98] dark:text-[#8294B8]">
              Showing items from <b>{CATEGORY_DETAILS.length}</b> categories
            </span>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('All');
                onClose();
              }}
              className="text-[#2589FF] dark:text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              Reset to All Products
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
