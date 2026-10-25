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
        <div className="w-screen max-w-4xl bg-gray-50 dark:bg-slate-900 shadow-2xl flex flex-col transition-colors duration-300 overflow-hidden">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{t('allCategories') || 'All Categories'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                    {products.length} Items
                  </span>
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Browse products and offers by department
                </p>
              </div>
            </div>

            {/* View Mode Toggle & Close */}
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 dark:bg-slate-700 p-0.5 rounded-lg flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                    viewMode === 'split' 
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold' 
                      : 'text-gray-500 hover:text-gray-800 dark:text-gray-300'
                  }`}
                  title="Department View"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Departments</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('all-aisles')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                    viewMode === 'all-aisles' 
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold' 
                      : 'text-gray-500 hover:text-gray-800 dark:text-gray-300'
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
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-4 py-2.5 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700/80">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories or items..."
                className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="w-28 sm:w-44 md:w-52 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-850 overflow-y-auto flex-shrink-0 select-none">
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCat === cat.id;
                    const count = getProductsForCategory(cat.id).length;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCat(cat.id)}
                        className={`w-full text-left p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 border-l-4 transition-all relative ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-600 text-blue-700 dark:text-blue-300 font-bold'
                            : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                          isSelected ? 'bg-white dark:bg-slate-800 shadow-2xs' : 'bg-gray-50 dark:bg-slate-800'
                        }`}>
                          {getCategoryIcon(cat.id)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm leading-tight truncate">
                            {getTranslatedCategory(cat.id)}
                          </p>
                          <span className="text-[10px] text-gray-400 font-normal">
                            {count} {count === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right Column: Items belonging to the selected category */}
                <div className="flex-1 bg-gray-50 dark:bg-slate-900 overflow-y-auto p-3 sm:p-4">
                  {/* Category Banner & Action */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-slate-700 mb-3 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
                        {getCategoryIcon(selectedCat)}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                          {getTranslatedCategory(selectedCat)}
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
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
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors"
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
                            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
                          >
                            {/* Product Image */}
                            <div 
                              onClick={() => {
                                onProductClick && onProductClick(product.id);
                                onClose();
                              }}
                              className="aspect-square bg-white p-2.5 relative cursor-pointer overflow-hidden flex items-center justify-center border-b border-gray-100 dark:border-slate-700/60"
                            >
                              <img 
                                src={product.images?.[0] || 'https://picsum.photos/300'} 
                                alt={product.name} 
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                              />

                              {/* Discount badge */}
                              {discount > 0 && (
                                <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
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
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-white/90 text-gray-600 hover:text-blue-600'
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
                                  className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-blue-600 cursor-pointer leading-snug"
                                  title={product.name}
                                >
                                  {product.name}
                                </h4>

                                <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                    {formatPrice(product.price)}
                                  </span>
                                  {product.mrp && (
                                    <span className="text-[10px] text-gray-400 line-through">
                                      {formatPrice(product.mrp)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Buy button */}
                              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onBuyItem && onBuyItem(product)}
                                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold py-1.5 px-2 rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-1 shadow-2xs"
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
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="text-3xl mb-2">📦</div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">No items found</h4>
                      <p className="text-xs text-gray-500 mt-1">Try selecting another category or clear your search</p>
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
                      <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
                            {getCategoryIcon(cat.id)}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                            {getTranslatedCategory(cat.id)}
                          </h3>
                          <span className="text-xs text-gray-400">
                            ({items.length})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectCategory(cat.id);
                            onClose();
                          }}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
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
                              className="w-36 sm:w-44 flex-shrink-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow snap-start flex flex-col justify-between"
                            >
                              <div 
                                onClick={() => {
                                  onProductClick && onProductClick(product.id);
                                  onClose();
                                }}
                                className="aspect-square bg-white p-2 relative cursor-pointer overflow-hidden flex items-center justify-center border-b border-gray-100"
                              >
                                <img 
                                  src={product.images?.[0] || 'https://picsum.photos/200'} 
                                  alt={product.name} 
                                  className="w-full h-full object-contain"
                                />
                                {discount > 0 && (
                                  <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1 py-0.5 rounded">
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
                                  className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2 cursor-pointer hover:text-blue-600"
                                >
                                  {product.name}
                                </h4>

                                <div className="mt-1 flex items-baseline gap-1">
                                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                                    {formatPrice(product.price)}
                                  </span>
                                  {product.mrp && (
                                    <span className="text-[10px] text-gray-400 line-through">
                                      {formatPrice(product.mrp)}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 flex items-center gap-1">
                                  {onToggleCart && (
                                    <button
                                      type="button"
                                      onClick={() => onToggleCart(product.id)}
                                      className={`p-1.5 rounded-lg border text-xs ${
                                        isInCart 
                                          ? 'bg-blue-50 border-blue-500 text-blue-600' 
                                          : 'border-gray-200 text-gray-500 hover:text-blue-600'
                                      }`}
                                      title="Cart"
                                    >
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onBuyItem && onBuyItem(product)}
                                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black text-[11px] font-bold py-1.5 rounded-lg text-center"
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
          <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs safe-pb">
            <span className="text-gray-500 dark:text-gray-400">
              Showing items from <b>{CATEGORY_DETAILS.length}</b> categories
            </span>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('All');
                onClose();
              }}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Reset to All Products
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
