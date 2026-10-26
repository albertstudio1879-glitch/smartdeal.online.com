
import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface InfoPageProps {
  title: string;
  content: string;
  onBack: () => void;
}

export const InfoPage: React.FC<InfoPageProps> = ({ title, content, onBack }) => {
  // Split content by double newlines to create paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-[#F7F9FF] dark:bg-[#071329] overflow-y-auto animate-in slide-in-from-right duration-300 transition-colors">
      {/* Navbar */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#102448]/80 backdrop-blur-xl border-b border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)] px-4 py-4 flex items-center gap-4 shadow-sm">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70 dark:bg-[#071329]/60 hover:bg-white dark:hover:bg-[#071329] text-[#102A56] dark:text-[#F5F7FF] border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] transition-all group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <span className="font-bold text-[#526B98] dark:text-[#B8C7E8] text-xs uppercase tracking-wider">Support Area</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 sm:py-16">
        <div className="space-y-10">
            {/* Animated Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#6C3BFF] via-[#4F46E5] to-[#2589FF] mb-8 animate-in slide-in-from-bottom-4 fade-in duration-700 leading-tight">
                {title}
            </h1>
            
            {/* Animated Paragraphs */}
            <div className="space-y-6">
                {paragraphs.map((para, idx) => (
                    <div 
                        key={idx} 
                        className="opacity-0 animate-fade-in-up p-5 sm:p-6 bg-white/80 dark:bg-[#102448]/80 backdrop-blur-xl rounded-3xl border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] shadow-[0_8px_24px_rgba(37,137,255,0.06)]"
                        style={{ animationDelay: `${idx * 150 + 200}ms`, animationFillMode: 'forwards' }}
                    >
                        <p className="text-base sm:text-lg text-[#102A56] dark:text-[#F5F7FF] leading-relaxed font-normal">
                            {para}
                        </p>
                    </div>
                ))}
            </div>

            {/* Footer decoration */}
            <div className="mt-16 pt-10 border-t border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)] opacity-0 animate-fade-in-up" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#6C3BFF]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2589FF]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00D9B8]"></div>
                </div>
                <p className="text-xs text-[#7889A8] dark:text-[#8294B8] italic text-center font-medium">
                    Smart Deal Online — Making shopping smarter.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
