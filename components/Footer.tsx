
import React, { useState } from 'react';
import { SiteSettings } from '../services/storageService';
import { getTranslation, Language } from '../utils/translations';

interface FooterProps {
  settings: SiteSettings;
  onAdminClick: () => void;
  lang: Language;
  onOpenInfoPage: (page: 'help' | 'about' | 'legal', fromSidebar: boolean) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onAdminClick, lang, onOpenInfoPage }) => {
  const t = (key: string) => getTranslation(lang, key);

  return (
    <footer className="bg-white/70 dark:bg-[#071329]/80 backdrop-blur-xl border-t border-[var(--glow-border-subtle)] shadow-[0_-6px_25px_rgba(0,190,255,0.08)] mt-12 pb-28 sm:pb-24 pt-10 safe-pb transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-12">
            
            {/* Brand & Custom Text */}
            <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-black bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] bg-clip-text text-transparent mb-2">Smart Deal Online</h3>
                {settings.footerText && (
                    <p className="text-[#526B98] dark:text-[#B8C7E8] text-sm leading-relaxed max-w-md mx-auto md:mx-0 whitespace-pre-line">
                        {settings.footerText}
                    </p>
                )}
            </div>

            {/* Links & Socials */}
            <div className="flex flex-col items-center md:items-end gap-6">
                
                <div className="flex flex-col items-center md:items-end gap-2">
                    <span className="text-xs font-bold text-[#7889A8] dark:text-[#8294B8] uppercase tracking-wider">{t('connectWithUs')}</span>
                    {/* Social Icons */}
                    <div className="flex items-center gap-3">
                        {/* YouTube */}
                        <a 
                        href="https://youtube.com/@smartdeal-online.products?si=DEQhBYCRqwK2apM6" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform bg-white/80 dark:bg-[#102448]/80 backdrop-blur-md border border-[rgba(92,137,220,0.25)] dark:border-[rgba(100,160,255,0.3)] overflow-hidden"
                        >
                            <img 
                                src="https://cdn-icons-png.flaticon.com/512/2504/2504965.png" 
                                alt="YouTube" 
                                className="w-full h-full object-cover rounded-full" 
                            />
                        </a>

                        {/* Facebook */}
                        <a 
                        href="https://www.facebook.com/share/1L7etvDEGm/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform bg-white/80 dark:bg-[#102448]/80 backdrop-blur-md border border-[rgba(92,137,220,0.25)] dark:border-[rgba(100,160,255,0.3)] overflow-hidden"
                        >
                            <img 
                                src="https://cdn-icons-png.flaticon.com/512/2504/2504903.png" 
                                alt="Facebook" 
                                className="w-full h-full object-cover rounded-full" 
                            />
                        </a>

                        {/* Instagram */}
                        <a 
                        href="https://www.instagram.com/smart_deal_online?igsh=MWxzOTk5bGdobWMycA==" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform bg-white/80 dark:bg-[#102448]/80 backdrop-blur-md border border-[rgba(92,137,220,0.25)] dark:border-[rgba(100,160,255,0.3)] overflow-hidden"
                        >
                            <img 
                                src="https://cdn-icons-png.flaticon.com/512/2504/2504918.png" 
                                alt="Instagram" 
                                className="w-full h-full object-cover rounded-full" 
                            />
                        </a>

                        {/* Gmail */}
                        <a 
                        href="mailto:albert.studio.1879@gmail.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform bg-white/80 dark:bg-[#102448]/80 backdrop-blur-md border border-[rgba(92,137,220,0.25)] dark:border-[rgba(100,160,255,0.3)] overflow-hidden"
                        >
                            <img 
                                src="https://cdn-icons-png.flaticon.com/512/5968/5968534.png" 
                                alt="Gmail" 
                                className="w-full h-full object-contain p-2" 
                            />
                        </a>

                        {/* X (Twitter) */}
                        <a 
                        href="https://x.com/smart_deal_on" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform bg-black/80 dark:bg-black/90 backdrop-blur-md border border-[rgba(92,137,220,0.25)] dark:border-[rgba(100,160,255,0.3)] overflow-hidden"
                        >
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Footer Page Links */}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wider text-[#526B98] dark:text-[#B8C7E8]">
                    {settings.advertisingUrl && (
                        <a href={settings.advertisingUrl} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">{t('advertising')}</a>
                    )}
                    {settings.blogUrl && (
                        <a href={settings.blogUrl} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">{t('blog')}</a>
                    )}
                    
                    {/* Internal Info Pages */}
                    <button onClick={() => onOpenInfoPage('about', false)} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">{t('about')}</button>
                    <button onClick={() => onOpenInfoPage('help', false)} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">{t('support')}</button>
                </div>

            </div>
        </div>

        {/* Copyright Line */}
        <div className="border-t border-[rgba(92,137,220,0.12)] dark:border-[rgba(100,160,255,0.15)] mt-6 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#7889A8] dark:text-[#8294B8]">
            <p>© {new Date().getFullYear()} Smart Deal Online. All rights reserved.</p>
            
            <span className="opacity-80">{t('disclaimer')}</span>
        </div>

      </div>
    </footer>
  );
};
