
import React, { useState, TouchEvent, useEffect, useRef, useMemo } from 'react';
import { Product } from '../types';
import { getTranslation, Language } from '../utils/translations';
import { ChevronDown, ChevronUp, ShoppingCart, Heart, Send } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface ProductDetailsProps {
  product: Product;
  allProducts?: Product[];
  onProductClick?: (id: string) => void;
  onBack: () => void;
  onInteraction: (id: string, type: 'like' | 'dislike', currentState: 'none' | 'liked' | 'disliked') => void;
  onBuy: () => void;
  onBuyItem?: (product: Product) => void;
  lang?: Language;
  onShare: (product: Product) => void;
  isInCart?: boolean;
  cartProductIds?: string[];
  onToggleCart?: (id: string) => void;
  isInWishlist?: boolean;
  wishlistProductIds?: string[];
  onToggleWishlist?: (id: string) => void;
  onOpenWishlist?: () => void;
  onOpenCart?: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ 
  product, 
  allProducts = [], 
  onProductClick,
  onBack, 
  onInteraction, 
  onBuy, 
  onBuyItem,
  lang = 'en',
  onShare,
  isInCart = false,
  cartProductIds = [],
  onToggleCart,
  isInWishlist = false,
  wishlistProductIds = [],
  onToggleWishlist,
  onOpenWishlist,
  onOpenCart
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [likeState, setLikeState] = useState<'none' | 'liked' | 'disliked'>('none');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showWishlistToast, setShowWishlistToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => getTranslation(lang as Language, key);

  const handleWishlistToggle = () => {
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
    if (!isInWishlist) {
      setShowWishlistToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setShowWishlistToast(false);
      }, 4000);
    } else {
      setShowWishlistToast(false);
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);


  // Scroll to top when product changes
  useEffect(() => {
    if (containerRef.current) {
        containerRef.current.scrollTop = 0;
    }
    setCurrentImageIndex(0);
  }, [product.id]);

  const suggestedProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    
    // 1. Identify "Real" categories (exclude meta tags)
    const META_CATEGORIES = ['Trending', 'Offer Zone'];
    const currentRealCategories = product.categories.filter(c => !META_CATEGORIES.includes(c));
    const targetCategories = currentRealCategories.length > 0 ? currentRealCategories : product.categories;

    // Helper: Tokenize name into significant words
    // FIX: Allow 2-letter words (TV, LG) and keep structural words like 'set', 'combo'
    const getTokens = (str: string) => {
        return str.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // remove special chars
            .split(/\s+/)
            .filter(t => t.length >= 2) // Allow "tv", "lg", "hp"
            .filter(t => !['the', 'and', 'for', 'with', 'of', 'in', 'on', 'at', 'by', 'from', 'to'].includes(t)); 
    };
    
    const currentTokens = getTokens(product.name);
    const currentCode = product.code ? product.code.toLowerCase() : '';
    
    // Filter candidates: Must be same category OR have very high name similarity
    // We start with all other products to evaluate relevance
    const candidates = allProducts.filter(p => p.id !== product.id);

    // 2. Score Candidates
    const scoredCandidates = candidates.map(p => {
        let score = 0;
        
        // Category Match Score (Base relevance)
        // If it shares a "real" category, give it a baseline boost
        const hasCategoryMatch = p.categories.some(c => targetCategories.includes(c));
        if (hasCategoryMatch) {
            score += 50; 
        }

        // Name Match Score (High specificity)
        const pTokens = getTokens(p.name);
        const commonTokens = currentTokens.filter(t => pTokens.includes(t));
        
        // Boost for specific common keywords often used in grouping
        const strongKeywords = ['set', 'combo', 'pack', 'pair', 'lotion', 'oil', 'cream', 'tv', 'speaker', 'watch', 'shoe', 'shirt', 'jeans'];
        
        commonTokens.forEach(token => {
            score += 10; // Base score for any matching word
            if (strongKeywords.includes(token)) score += 15; // Extra boost for structural/type words
        });

        // First/Last word match bonus (often Brand or Product Type)
        if (currentTokens.length > 0 && pTokens.length > 0) {
             if (currentTokens[0] === pTokens[0]) score += 5; // Same Brand?
             if (currentTokens[currentTokens.length - 1] === pTokens[pTokens.length - 1]) score += 10; // Same Type? (e.g. "Lotion")
        }

        // Code Match (Series)
        if (currentCode && p.code) {
             const pCode = p.code.toLowerCase();
             if (pCode === currentCode) score += 30; 
             else if (pCode.substring(0, 4) === currentCode.substring(0, 4)) score += 10;
        }

        // Random Jitter (0-2) to shuffle items with identical scores
        score += Math.random() * 2; 

        return { product: p, score, hasCategoryMatch };
    });

    // 3. Filter and Sort
    // We strictly require either a category match OR a very strong name match (score > 40 implies multiple shared words)
    const filteredAndSorted = scoredCandidates
        .filter(item => item.hasCategoryMatch || item.score > 30) 
        .sort((a, b) => b.score - a.score);

    // 4. Return top items
    return filteredAndSorted.slice(0, 10).map(sc => sc.product);

  }, [product, allProducts]);

  const images = product.images && product.images.length > 0 ? product.images : ['https://picsum.photos/400/400'];
  const slideInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-slide effect
  useEffect(() => {
    if (images.length <= 1) return;

    const startSlideTimer = () => {
        stopSlideTimer(); // Clear existing
        slideInterval.current = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 3000); // 3 seconds
    };

    const stopSlideTimer = () => {
        if (slideInterval.current) {
            clearInterval(slideInterval.current);
            slideInterval.current = null;
        }
    };

    if (touchStart === null) {
        startSlideTimer();
    } else {
        stopSlideTimer();
    }

    return () => stopSlideTimer();
  }, [images.length, touchStart]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e: TouchEvent) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
  }

  const handleTouchMove = (e: TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
  }

  const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) {
        setTouchStart(null);
        return;
      }
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;
      
      if (isLeftSwipe) nextImage();
      if (isRightSwipe) prevImage();
      
      setTouchStart(null);
  }

  const handleLike = () => {
    const newState = likeState === 'liked' ? 'none' : 'liked';
    setLikeState(newState);
    onInteraction(product.id, 'like', likeState);
  };

  const handleDislike = () => {
    const newState = likeState === 'disliked' ? 'none' : 'disliked';
    setLikeState(newState);
    onInteraction(product.id, 'dislike', likeState);
  };

  const formatCount = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count;
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    const cleanPrice = price.toString().trim();
    return cleanPrice.startsWith('₹') ? cleanPrice : `₹${cleanPrice}`;
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[60] bg-white dark:bg-slate-900 overflow-y-auto animate-in slide-in-from-bottom-10 duration-200 no-scrollbar transition-colors duration-300">
      
      {/* Navbar */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-colors flex-shrink-0"
            title="Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{product.name}</h1>
        </div>

        {/* Quick Wishlist & Cart Shortcuts */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenWishlist}
            className="p-2 text-gray-700 dark:text-gray-200 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all relative flex items-center justify-center"
            title="My Wishlist"
            aria-label="My Wishlist"
          >
            <Heart className={`w-5 h-5 ${isInWishlist || wishlistProductIds.length > 0 ? 'text-red-500 fill-red-500' : ''}`} />
            {wishlistProductIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {wishlistProductIds.length > 99 ? '99+' : wishlistProductIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="p-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all relative flex items-center justify-center"
            title="My Cart"
            aria-label="My Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartProductIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {cartProductIds.length > 99 ? '99+' : cartProductIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto pb-32">
        
        {/* Image Carousel - Forced white background */}
        <div 
          className="relative aspect-square bg-white border-b border-gray-100 dark:border-slate-800 overflow-hidden group"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[currentImageIndex]}
            alt={product.name}
            className="w-full h-full object-contain"
          />

          {/* Floating Top-Right Buttons: Heart (My Wishlist) and Share (Paper Plane) */}
          <div className="absolute top-3.5 right-3.5 z-20 flex flex-col gap-2.5">
            {/* Heart Button (My Wishlist) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleWishlistToggle();
              }}
              title={isInWishlist ? "Remove from My Wishlist" : "Add to My Wishlist"}
              aria-label="My Wishlist"
              className="w-10 h-10 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-md hover:shadow-lg border border-gray-100 dark:border-slate-700/60 flex items-center justify-center transition-all duration-200 active:scale-90"
            >
              <Heart 
                className={`w-5 h-5 transition-transform duration-200 ${
                  isInWishlist 
                    ? 'text-red-500 fill-red-500 scale-110' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-red-500'
                }`} 
              />
            </button>

            {/* Share Button (Send / Paper plane icon) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare(product);
              }}
              title="Share"
              aria-label="Share"
              className="w-10 h-10 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-md hover:shadow-lg border border-gray-100 dark:border-slate-700/60 flex items-center justify-center transition-all duration-200 active:scale-90"
            >
              <Send className="w-5 h-5 text-gray-700 dark:text-gray-200 -rotate-12 translate-x-[-1px] translate-y-[-1px]" />
            </button>
          </div>

          {/* Floating Bottom-Left Rating Badge (like screenshot: 4.4 ★ | 7.6K+) */}
          <div className="absolute bottom-3.5 left-3.5 z-10 pointer-events-none">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-slate-700/80 flex items-center gap-1.5">
              <span className="text-gray-900 dark:text-white font-black">4.4</span>
              <span className="text-emerald-600 text-xs">★</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">7.6K+</span>
            </div>
          </div>
          
          {/* Dots only */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 pointer-events-none">
              {images.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-brand-600 scale-125' : 'bg-gray-300 dark:bg-gray-600'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Header Section */}
          <div>
            <div className="flex flex-col gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {product.name}
              </h1>

              {/* Interaction Buttons */}
              <div className="flex items-center gap-4 mt-2">
                <button 
                  onClick={handleLike} 
                  className="flex items-center gap-1.5 py-1.5 px-3 -ml-3 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors group"
                >
                  <svg className="w-6 h-6" fill={likeState === 'liked' ? '#ef4444' : 'none'} stroke={likeState === 'liked' ? '#ef4444' : '#9ca3af'} strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  <span className={`text-sm font-bold ${likeState === 'liked' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {formatCount(product.likes)}
                  </span>
                </button>

                <button 
                  onClick={handleDislike} 
                  className="flex items-center gap-1.5 py-1.5 px-3 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors group"
                >
                  <svg className="w-6 h-6" fill={likeState === 'disliked' ? '#4b5563' : 'none'} stroke={likeState === 'disliked' ? '#4b5563' : '#9ca3af'} strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                  </svg>
                  <span className={`text-sm font-bold ${likeState === 'disliked' ? 'text-gray-700' : 'text-gray-500 dark:text-gray-400'}`}>
                    {product.dislikes > 0 ? formatCount(product.dislikes) : 0}
                  </span>
                </button>

                <button 
                  onClick={() => onShare(product)} 
                  className="flex items-center gap-1.5 py-1.5 px-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors group"
                >
                  <svg className="w-6 h-6 text-gray-400 dark:text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600">{t('share')}</span>
                </button>
              </div>
              
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(product.price || '')}</span>
                {product.mrp && (
                  <span className="text-lg text-gray-500 dark:text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                )}
                {product.offer && (
                    <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full border border-green-200 dark:border-green-800">
                    {product.offer}
                    </span>
                )}
              </div>
              
              {product.code && (
                <div className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">
                   CODE: <span className="font-mono text-gray-600 dark:text-gray-300 select-all">{product.code}</span>
                </div>
              )}
            </div>
          </div>

          {/* Highlights & Description */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-lg">
              <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {t('details')}
            </h3>
            
            <div className="space-y-6">
              
              {product.highlights && product.highlights.length > 0 && (
                <div className="bg-gradient-to-br from-brand-50/50 to-white dark:from-brand-900/20 dark:to-slate-800 rounded-xl p-5 sm:p-6 border border-brand-100 dark:border-brand-900 shadow-sm overflow-hidden relative">
                   <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-100/50 dark:bg-brand-900/30 rounded-full blur-2xl pointer-events-none"></div>

                   <h4 className="text-sm font-bold text-brand-800 dark:text-brand-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                      <span className="bg-brand-100 dark:bg-brand-900/50 p-1 rounded text-brand-600 dark:text-brand-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </span>
                      {t('highlights')}
                   </h4>
                   <ul className="space-y-3">
                     {product.highlights.map((point, index) => (
                       <li 
                         key={index} 
                         className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 animate-fade-in-up opacity-0"
                         style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
                       >
                         <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shadow-sm flex-shrink-0 ring-4 ring-brand-50/50 dark:ring-brand-900/50"></div>
                         <span className="leading-relaxed font-medium">{point}</span>
                       </li>
                     ))}
                   </ul>
                </div>
              )}

              {/* Description with Show More/Less */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 sm:p-6 border border-gray-100 dark:border-slate-700 shadow-sm relative group hover:border-gray-200 dark:hover:border-slate-600 transition-colors">
                 <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                    {t('description')}
                 </h4>
                 <div className={`prose prose-sm prose-blue dark:prose-invert text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
                   {product.description}
                 </div>
                 
                 {product.description && product.description.length > 100 && (
                     <button 
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="mt-3 text-brand-600 dark:text-brand-400 text-sm font-bold flex items-center gap-1 hover:underline focus:outline-none"
                     >
                        {isDescriptionExpanded ? (
                            <>Show Less <ChevronUp className="w-4 h-4" /></>
                        ) : (
                            <>Show More <ChevronDown className="w-4 h-4" /></>
                        )}
                     </button>
                 )}
              </div>
            </div>
          </div>
            
          {/* SUGGESTED SECTION */}
          {suggestedProducts.length > 0 && (
            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 mt-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('suggestedForYou')}</h3>
                <div className="flex overflow-x-auto gap-3 pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 no-scrollbar snap-x snap-mandatory">
                    {suggestedProducts.map(p => (
                        <div key={p.id} className="min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px] snap-center">
                            <ProductCard 
                                product={p}
                                onClick={() => onProductClick && onProductClick(p.id)}
                                onInteraction={onInteraction}
                                onBuy={(prod) => onBuyItem ? onBuyItem(prod) : {}}
                                lang={lang}
                                onShare={() => onShare(p)}
                                isInCart={cartProductIds.includes(p.id)}
                                onToggleCart={onToggleCart}
                                isInWishlist={wishlistProductIds.includes(p.id)}
                                onToggleWishlist={onToggleWishlist}
                            />
                        </div>
                    ))}
                </div>
            </div>
          )}

        </div>
      </div>

      {/* Toast Notification like Image 1: "Product is added to My Wishlist" with "CHANGE" button */}
      {showWishlistToast && (
        <div className="fixed bottom-24 left-3 right-3 sm:left-6 sm:right-6 max-w-md mx-auto z-[70] animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[#202124] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between border border-gray-800">
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-red-500 fill-red-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-100">
                Product is added to My Wishlist
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowWishlistToast(false);
                if (onOpenWishlist) {
                  onOpenWishlist();
                }
              }}
              className="text-[#f59e0b] hover:text-[#fbbf24] font-bold text-xs sm:text-sm tracking-wider uppercase pl-3 pr-1 py-1 transition-colors active:scale-95 cursor-pointer"
            >
              CHANGE
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-40 safe-pb">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
           {onToggleCart && (
             <button
               type="button"
               onClick={() => onToggleCart(product.id)}
               className={`flex items-center justify-center gap-2 py-3.5 px-4 sm:px-6 rounded-xl border font-bold text-sm transition-all active:scale-95 ${
                 isInCart
                   ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                   : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
               }`}
             >
               <ShoppingCart className="w-5 h-5" />
               <span className="whitespace-nowrap">{isInCart ? 'In Cart' : 'Add to Cart'}</span>
             </button>
           )}

           <button 
             onClick={onBuy}
             className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-base sm:text-lg py-3.5 px-6 rounded-xl shadow-md text-center transition-all active:scale-95 animate-pulse hover:animate-none flex items-center justify-center gap-2"
           >
             <span>{t('buyNow')}</span>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
           </button>
        </div>
      </div>

    </div>
  );
};
