
import React, { useState, useEffect, TouchEvent } from 'react';
import { Product } from '../types';
import { Flame } from 'lucide-react';

interface BestOfferBannerProps {
  products: Product[];
  onProductClick: (id: string) => void;
}

export const BestOfferBanner: React.FC<BestOfferBannerProps> = ({ products, onProductClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const getDiscount = (p: Product) => {
    if (!p.mrp || !p.price) return 0;
    const mrp = parseFloat(p.mrp.toString().replace(/[^0-9.]/g, ''));
    const price = parseFloat(p.price.toString().replace(/[^0-9.]/g, ''));
    if (!mrp || !price || mrp <= price) return 0;
    return ((mrp - price) / mrp) * 100;
  };

  // Get top 4 products with highest discount
  const topProducts = [...products]
    .map(p => ({ ...p, discount: getDiscount(p) }))
    .filter(p => p.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 4);

  // High contrast gradients for offers
  const bgGradients = [
    'from-red-600 to-rose-600',       // 1
    'from-green-600 to-emerald-600',  // 2
    'from-blue-700 to-indigo-700',    // 3
    'from-purple-600 to-pink-600',    // 4
  ];

  useEffect(() => {
    if (topProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topProducts.length);
    }, 4000); // 4 seconds per slide (slightly faster than trending)
    return () => clearInterval(interval);
  }, [topProducts.length]);

  const handleManualSlide = (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      setCurrentIndex(index);
  };

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

  return (
    <div className="mb-6 px-2">
      <div className="flex items-center gap-2 mb-3 px-1">
         <Flame className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
         <h3 className="font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider text-sm">Best Deals For You</h3>
      </div>
      
      <div 
        onClick={() => onProductClick(currentProduct.id)}
        className="glow-featured relative w-full h-[200px] sm:h-[260px] bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-[28px] overflow-hidden group transition-all duration-700 cursor-pointer select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Particles */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>

        <div className="flex h-full relative z-10">
          
          {/* Left: Text Content - Increased width on mobile */}
          <div className="w-[58%] sm:w-[55%] pl-4 sm:pl-8 flex flex-col justify-center h-full relative z-20">
            
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-white text-black text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs uppercase tracking-wider">
                    {Math.round(currentProduct.discount)}% OFF
                </span>
                <span className="text-white/80 text-[10px] font-medium line-through decoration-white/50">
                   {formatPrice(currentProduct.mrp || '')}
                </span>
            </div>
            
            <h2 className="text-base sm:text-2xl font-black text-white leading-tight drop-shadow-sm line-clamp-2 mb-2.5 pr-1">
              {currentProduct.name}
            </h2>

            <div className="bg-black/30 backdrop-blur-md self-start px-3.5 py-1.5 rounded-xl border border-[var(--glow-border-subtle)] flex items-center gap-2 shadow-xs">
                <span className="text-white text-[10px] sm:text-xs font-medium">Pay Only</span>
                <span className="text-white text-lg font-bold">{formatPrice(currentProduct.price || '')}</span>
            </div>

          </div>

          {/* Right: Floating Product Image - Adjusted size for mobile */}
          <div className="w-[42%] sm:w-[45%] h-full relative flex items-center justify-center pr-3 sm:pr-6">
             <div className="absolute w-28 h-28 sm:w-48 sm:h-48 bg-white/20 rounded-full blur-2xl"></div>
             
             {/* Image with crisp white container */}
             <div className="relative">
                 <div className="bg-white rounded-[22px] p-2.5 shadow-xl border border-white/60 transform transition-transform duration-500 group-hover:scale-105">
                   <img 
                     src={displayImage} 
                     alt={currentProduct.name}
                     className="h-32 sm:h-48 w-auto object-contain rounded-xl"
                   />
                 </div>
             </div>
          </div>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30" onClick={(e) => e.stopPropagation()}>
             {topProducts.map((_, idx) => (
               <button 
                 key={idx} 
                 onClick={(e) => handleManualSlide(e, idx)}
                 className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-5 sm:w-6 bg-white shadow-xs' : 'w-1.5 bg-white/40'}`}
               />
             ))}
        </div>

      </div>
    </div>
  );
};
