
import React, { useState } from 'react';
import { Product } from '../types';
import { getTranslation, Language } from '../utils/translations';
import { ShoppingCart, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  onInteraction: (id: string, type: 'like' | 'dislike', currentState: 'none' | 'liked' | 'disliked') => void;
  onBuy: (product: Product) => void;
  lang?: Language;
  onShare: () => void;
  isInCart?: boolean;
  onToggleCart?: (id: string) => void;
  isInWishlist?: boolean;
  onToggleWishlist?: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onClick, 
  onInteraction, 
  onBuy, 
  lang = 'en', 
  onShare,
  isInCart = false,
  onToggleCart,
  isInWishlist = false,
  onToggleWishlist
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [likeState, setLikeState] = useState<'none' | 'liked' | 'disliked'>('none');

  const t = (key: string) => getTranslation(lang as Language, key);

  // Always use the first image
  const displayImage = product.images && product.images.length > 0 ? product.images[0] : 'https://picsum.photos/400/400';

  const formatCount = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count;
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    const cleanPrice = price.toString().trim();
    return cleanPrice.startsWith('₹') ? cleanPrice : `₹${cleanPrice}`;
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = likeState === 'liked' ? 'none' : 'liked';
    setLikeState(newState);
    onInteraction(product.id, 'like', likeState);
  };

  const handleDislike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = likeState === 'disliked' ? 'none' : 'disliked';
    setLikeState(newState);
    onInteraction(product.id, 'dislike', likeState);
  };

  const handleShareClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onShare();
  };

  return (
    <div 
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group glow-card bg-white/85 dark:bg-[#102448]/85 backdrop-blur-md rounded-[24px] flex flex-col overflow-hidden relative select-none cursor-pointer"
    >
      
      {/* Static Image - Forced white background for product visibility */}
      <div className="relative aspect-square block bg-white overflow-hidden p-2 rounded-t-[22px] border-b border-[var(--glow-border-subtle)]">
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          draggable="false"
        />

        {/* Wishlist Heart Button */}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 dark:bg-[#071329]/90 backdrop-blur-md shadow-md border border-[var(--glow-border-subtle)] flex items-center justify-center glow-interactive z-10 cursor-pointer"
            title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 transition-transform ${isInWishlist ? 'text-pink-500 fill-pink-500 scale-110' : 'text-gray-400 dark:text-gray-400 hover:text-pink-500'}`} />
          </button>
        )}
      </div>

      {/* Details & Interaction */}
      <div className="p-3 flex flex-col flex-grow">
        
        {/* Name */}
        <div className="mb-2">
            <h3 className="text-[#102A56] dark:text-[#F5F7FF] font-bold text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.5em]" title={product.name}>
            {product.name}
            </h3>
        </div>

        {/* Horizontal Interaction Row (Below Name) */}
        <div className="flex items-center gap-3 mb-2" onClick={(e) => e.stopPropagation()}>
            {/* Like */}
            <button 
                onClick={handleLike}
                className="flex items-center gap-1 group/btn p-1.5 -ml-1 hover:bg-red-500/10 dark:hover:bg-red-500/15 rounded-full transition-all glow-interactive cursor-pointer"
            >
                <svg className="w-4 h-4" fill={likeState === 'liked' ? '#ef4444' : 'none'} stroke={likeState === 'liked' ? '#ef4444' : '#9ca3af'} strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span className={`text-[10px] font-bold leading-none ${likeState === 'liked' ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {formatCount(product.likes)}
                </span>
            </button>

            {/* Dislike */}
            <button 
                onClick={handleDislike}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700/60 rounded-full transition-all glow-interactive cursor-pointer"
            >
                <svg className="w-4 h-4" fill={likeState === 'disliked' ? '#4b5563' : 'none'} stroke={likeState === 'disliked' ? '#4b5563' : '#9ca3af'} strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
            </button>

            {/* Share */}
            <button 
                onClick={handleShareClick}
                className="p-1.5 hover:bg-blue-500/10 dark:hover:bg-blue-500/15 rounded-full transition-all glow-interactive cursor-pointer"
                title="Share"
            >
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
            </button>

            {/* Cart / Save Button */}
            {onToggleCart && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleCart(product.id);
                }}
                className={`p-1.5 rounded-full transition-all glow-interactive ml-auto cursor-pointer ${
                  isInCart 
                    ? 'text-white bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] shadow-xs' 
                    : 'text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-blue-500/10'
                }`}
                title={isInCart ? "Remove from Cart" : "Add to Cart"}
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
        </div>
        
        <div className="mt-auto pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
                {product.price && (
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</span>
                )}
                 {product.mrp && (
                    <span className="text-[10px] text-gray-400 line-through decoration-gray-400">{formatPrice(product.mrp)}</span>
                )}
                {product.offer && (
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                        {product.offer}
                    </span>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
