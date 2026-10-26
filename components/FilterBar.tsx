
import React, { useState } from 'react';
import { ChevronDown, Heart, Percent, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  sortBy: 'default' | 'discount' | 'likes';
  onSortChange: (sort: 'default' | 'discount' | 'likes') => void;
  activePriceRange: string | null;
  onPriceRangeChange: (range: string | null) => void;
  activeMinOffer: number | null;
  onMinOfferChange: (offer: number | null) => void;
  resultCount: number;
}

const PRICE_RANGES = [
  { label: '₹0 - ₹499', value: '0-499' },
  { label: '₹500 - ₹1000', value: '500-1000' },
  { label: '₹1000 - ₹2000', value: '1000-2000' },
  { label: '₹2000 - ₹5000', value: '2000-5000' },
  { label: '₹5000 - ₹10000', value: '5000-10000' },
  { label: '₹10000 - ₹20000', value: '10000-20000' },
  { label: '₹20000 - ₹40000', value: '20000-40000' },
  { label: '₹40000 - ₹80000', value: '40000-80000' },
  { label: '₹80000 - ₹100000', value: '80000-100000' },
  { label: 'Above ₹100000', value: '100000+' },
];

const OFFER_RANGES = [
  { label: '10% Off+', value: 10 },
  { label: '30% Off+', value: 30 },
  { label: '50% Off+', value: 50 },
  { label: '70% Off+', value: 70 },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  sortBy,
  onSortChange,
  activePriceRange,
  onPriceRangeChange,
  activeMinOffer,
  onMinOfferChange,
  resultCount
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="mb-4">
      {/* Header Row: Filter Toggle + Result Count */}
      <div className="flex items-center justify-between px-2 mb-2">
         <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isFiltersOpen
                ? 'glow-btn-primary text-white border-white/20'
                : 'glow-subtle bg-white/80 dark:bg-[#102448]/80 backdrop-blur-md text-[#102A56] dark:text-[#F5F7FF] hover:border-[var(--glow-border)] glow-interactive'
            }`}
         >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
         </button>

         <span className="text-xs text-[#526B98] dark:text-[#8294B8] font-medium">
            {resultCount} Items Found
         </span>
      </div>

      {/* Expandable Filter Options Area */}
      {isFiltersOpen && (
          <div className="animate-in slide-in-from-top-2 duration-200 fade-in">
              <div className="flex items-center gap-2 overflow-x-auto px-2 pb-2 no-scrollbar">
                  
                  {/* Sort: Most Liked */}
                  <button
                    onClick={() => onSortChange(sortBy === 'likes' ? 'default' : 'likes')}
                    className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        sortBy === 'likes'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border border-pink-400/40 shadow-xs'
                        : 'glow-subtle bg-white/80 dark:bg-[#102448]/80 backdrop-blur-md text-[#526B98] dark:text-[#B8C7E8] hover:border-[var(--glow-border)]'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${sortBy === 'likes' ? 'fill-current' : ''}`} />
                    Most Liked
                  </button>

                  {/* Sort: Best Offer */}
                  <button
                    onClick={() => onSortChange(sortBy === 'discount' ? 'default' : 'discount')}
                    className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        sortBy === 'discount'
                        ? 'bg-gradient-to-r from-[#00D9B8] to-[#00B887] text-white border border-teal-400/40 shadow-xs'
                        : 'glow-subtle bg-white/80 dark:bg-[#102448]/80 backdrop-blur-md text-[#526B98] dark:text-[#B8C7E8] hover:border-[var(--glow-border)]'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    Best Offer
                  </button>

                  <div className="w-[1px] h-4 bg-[var(--glow-border-subtle)] mx-1 flex-shrink-0"></div>

                  {/* Price Filter */}
                  <div className="relative flex-shrink-0">
                    <select
                        value={activePriceRange || ''}
                        onChange={(e) => onPriceRangeChange(e.target.value || null)}
                        className={`appearance-none pl-3.5 pr-7 py-1.5 rounded-full text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                            activePriceRange 
                            ? 'glow-card bg-blue-500/15 text-blue-600 dark:text-cyan-300 border-[var(--glow-border)] shadow-xs' 
                            : 'glow-subtle bg-white/80 dark:bg-[#102448]/80 backdrop-blur-md text-[#526B98] dark:text-[#B8C7E8] hover:border-[var(--glow-border)]'
                        }`}
                    >
                        <option value="">Price</option>
                        {PRICE_RANGES.map((range) => (
                            <option key={range.value} value={range.value} className="bg-white dark:bg-[#102448] text-[#102A56] dark:text-[#F5F7FF]">{range.label}</option>
                        ))}
                    </select>
                    <ChevronDown className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${activePriceRange ? 'text-blue-500 dark:text-cyan-400' : 'text-gray-400'}`} />
                  </div>

                  {/* Offer Filter */}
                  <div className="relative flex-shrink-0">
                    <select
                        value={activeMinOffer || ''}
                        onChange={(e) => onMinOfferChange(e.target.value ? Number(e.target.value) : null)}
                        className={`appearance-none pl-3.5 pr-7 py-1.5 rounded-full text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                            activeMinOffer 
                            ? 'glow-card bg-orange-500/15 text-orange-600 dark:text-orange-400 border-[var(--glow-border)] shadow-xs' 
                            : 'glow-subtle bg-white/80 dark:bg-[#102448]/80 backdrop-blur-md text-[#526B98] dark:text-[#B8C7E8] hover:border-[var(--glow-border)]'
                        }`}
                    >
                        <option value="">Min Offer</option>
                        {OFFER_RANGES.map((range) => (
                            <option key={range.value} value={range.value} className="bg-white dark:bg-[#102448] text-[#102A56] dark:text-[#F5F7FF]">{range.label}</option>
                        ))}
                    </select>
                    <ChevronDown className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${activeMinOffer ? 'text-orange-500' : 'text-gray-400'}`} />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
