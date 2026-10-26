
import React, { useState, useEffect, TouchEvent } from 'react';
import { Product } from '../types';
import { ChevronRight } from 'lucide-react';

interface TrendingBannerProps {
  products: Product[];
  onProductClick: (id: string) => void;
}

export const TrendingBanner: React.FC<TrendingBannerProps> = ({ products, onProductClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Get top 5 most liked products
  // Memoization isn't strictly necessary here as standard render cycles handle updates fast enough
  const topProducts = [...products]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5);

  // 5 Attractive Gradients
  const bgGradients = [
    'from-orange-500 to-amber-500',   // 1
    'from-violet-600 to-fuchsia-600', // 2
    'from-cyan-500 to-blue-600',      // 3
    'from-emerald-500 to-teal-500',   // 4
    'from-rose-500 to-red-600'        // 5
  ];

  useEffect(() => {
    if (topProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topProducts.length);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(interval);
  }, [topProducts.length]);

  const handleManualSlide = (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      setCurrentIndex(index);
  };

  // Swipe Logic
  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
        setCurrentIndex((prev) => (prev + 1) % topProducts.length);
    }
    if (isRightSwipe) {
        setCurrentIndex((prev) => (prev - 1 + topProducts.length) % topProducts.length);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    const cleanPrice = price.toString().trim();
    return cleanPrice.startsWith('₹') ? cleanPrice : `₹${cleanPrice}`;
  };

  if (topProducts.length === 0) return null;

  const currentProduct = topProducts[currentIndex];
  const displayImage = currentProduct.images[0] || 'https://picsum.photos/400/400';
  const currentGradient = bgGradients[currentIndex % bgGradients.length];

  // Specific Display Logic 1-5
  const renderOfferLabel = (product: Product, index: number) => {
     const cyclePosition = (index % 5) + 1; // 1 to 5
     
     // Common styles - adjusted padding and font size for compactness
     const badgeBase = "shadow-md backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-1 flex items-center justify-center gap-1 transform transition-all duration-500";
     
     // 1st: Offer %
     if (cyclePosition === 1) {
         return product.offer ? (
            <div className={`${badgeBase} bg-white/20 text-white`}>
                <span className="text-base sm:text-2xl font-black">{product.offer}</span>
            </div>
         ) : null;
     }

     // 2nd: Offer Price
     if (cyclePosition === 2) {
         return product.price ? (
            <div className={`${badgeBase} bg-yellow-400 text-black rotate-[-2deg]`}>
                 <span className="text-[10px] sm:text-xs font-bold uppercase mr-1">Deal</span>
                 <span className="text-base sm:text-2xl font-black">{formatPrice(product.price)}</span>
            </div>
         ) : null;
     }

     // 3rd: Image showing Offer % AND Price
     if (cyclePosition === 3) {
         return (
            <div className="flex flex-col gap-1 items-start">
                {product.offer && (
                    <div className="bg-red-600 text-white px-2 py-0.5 rounded font-bold text-xs sm:text-lg shadow-sm">
                        {product.offer}
                    </div>
                )}
                {product.price && (
                    <div className="bg-white text-gray-900 px-2 py-0.5 rounded font-black text-base sm:text-2xl shadow-sm border border-red-600">
                        {formatPrice(product.price)}
                    </div>
                )}
            </div>
         );
     }

     // 4th: Offer %
     if (cyclePosition === 4) {
        return product.offer ? (
            <div className={`${badgeBase} bg-black/30 text-white`}>
                <span className="text-[10px] sm:text-xs font-medium uppercase mr-1">Flat</span>
                <span className="text-base sm:text-2xl font-black">{product.offer}</span>
            </div>
         ) : null;
     }

     // 5th: Offer Price
     if (cyclePosition === 5) {
        return product.price ? (
            <div className={`${badgeBase} bg-white text-brand-600 border-white`}>
                 <span className="text-[10px] sm:text-xs font-bold uppercase mr-1">Only</span>
                 <span className="text-base sm:text-2xl font-black">{formatPrice(product.price)}</span>
            </div>
         ) : null;
     }

     return null;
  };

  return (
    <div className="mb-4 px-2">
      <div 
        onClick={() => onProductClick(currentProduct.id)}
        className="glow-featured relative w-full h-[210px] sm:h-[265px] bg-gradient-to-br from-[#EAF3FF] via-[#E2EEFF] to-[#F1F6FF] dark:bg-gradient-to-br dark:from-[#091D42] dark:via-[#071635] dark:to-[#040D20] rounded-[28px] overflow-hidden group cursor-pointer select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Pattern - subtle luminous grid dots matching reference */}
        <div className="absolute inset-0 opacity-20 dark:opacity-25" style={{ backgroundImage: 'radial-gradient(circle, #00D9FF 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }}></div>
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-cyan-400/20 dark:bg-cyan-400/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-blue-500/15 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Bottom Gradient for Controls Visibility */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 dark:from-black/70 to-transparent z-20 pointer-events-none rounded-b-[28px]"></div>

        {/* Main Content Area */}
        <div className="flex h-full relative z-10 pb-12 sm:pb-9">
          
          {/* Left: Text Content */}
          <div className="w-[58%] sm:w-[55%] pl-4 sm:pl-7 flex flex-col justify-center h-full relative z-20">
            <div className="bg-gradient-to-r from-[#00D9FF] to-[#2589FF] text-white font-black text-[10px] sm:text-xs px-3.5 py-1 rounded-full shadow-sm uppercase tracking-wider mb-2.5 self-start border border-white/30">
              #{currentIndex + 1} TRENDING
            </div>
            
            <h2 className="text-base sm:text-2xl font-black text-[#102A56] dark:text-white leading-tight drop-shadow-xs line-clamp-2 mb-3 pr-1">
              {currentProduct.name}
            </h2>

            {/* Dynamic Label Area: Discount and Price Pill */}
            <div className="mb-2 scale-[0.9] origin-left sm:scale-100 flex items-center gap-2">
                {currentProduct.offer && (
                  <div className="bg-gradient-to-r from-[#FF2B6D] to-[#FF4D80] text-white font-black text-xs sm:text-sm px-3 py-1.5 rounded-xl shadow-xs border border-white/20">
                    {currentProduct.offer}
                  </div>
                )}
                {currentProduct.price && (
                  <div className="bg-white/95 dark:bg-[#0C1F42]/95 backdrop-blur-md text-[#102A56] dark:text-white font-black text-sm sm:text-lg px-3.5 py-1.5 rounded-xl border border-[var(--glow-border-subtle)] shadow-xs">
                    {formatPrice(currentProduct.price)}
                  </div>
                )}
            </div>
          </div>

          {/* Right: Floating Product Image in Rounded White Frame */}
          <div className="w-[42%] sm:w-[45%] h-full relative flex items-center justify-center pr-3 sm:pr-6">
             <div className="absolute w-28 h-28 sm:w-44 sm:h-44 bg-cyan-400/25 dark:bg-cyan-400/15 rounded-full blur-2xl animate-pulse"></div>
             
             {/* Image Container with crisp white box */}
             <div className="relative transform transition-transform duration-500 ease-out hover:scale-105">
                 <div className="bg-white rounded-[22px] p-2.5 sm:p-3 shadow-xl border border-white/60">
                   <img 
                     src={displayImage} 
                     alt={currentProduct.name}
                     className="h-32 sm:h-48 w-auto object-contain rounded-xl"
                   />
                 </div>
             </div>
          </div>
        </div>

        {/* Bottom Area: Controls (Dots + Check Deal Button) */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 py-3 flex items-center justify-between z-30">
           
           {/* Check Deal Button */}
           <button 
             className="glow-btn-primary text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
           >
              <span>Check Deal</span>
              <ChevronRight className="w-3.5 h-3.5 text-white" />
           </button>

           {/* Indicators with subtle cyan outline */}
           <div className="flex gap-1.5 bg-black/35 dark:bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[var(--glow-border-subtle)]" onClick={(e) => e.stopPropagation()}>
             {topProducts.map((_, idx) => (
               <button 
                 key={idx} 
                 onClick={(e) => handleManualSlide(e, idx)}
                 className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-5 bg-white shadow-xs' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                 aria-label={`Go to slide ${idx + 1}`}
               />
             ))}
           </div>
        </div>

      </div>
    </div>
  );
};
