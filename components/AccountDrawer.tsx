import React, { useState, useEffect } from 'react';
import { Theme } from '../types';
import { LANGUAGES, Language, getTranslation } from '../utils/translations';
import { UserAccount, getLocalUser, initAuthListener, logoutUser, saveLocalUser } from '../services/authService';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  X, Moon, Sun, Monitor, Languages, ShoppingCart, 
  HelpCircle, Info, Scale, ShieldCheck, ChevronRight,
  ExternalLink, Mail, Check, Heart, Phone, LogIn, LogOut,
  User, Edit3, Smartphone, MapPin
} from 'lucide-react';
import { ManageDevicesModal } from './ManageDevicesModal';
import { SavedAddressModal } from './SavedAddressModal';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartCount: number;
  wishlistCount?: number;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  onOpenInfoPage: (page: 'help' | 'about' | 'legal') => void;
}

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  isOpen,
  onClose,
  cartCount,
  wishlistCount = 0,
  onOpenCart,
  onOpenWishlist,
  onOpenAdmin,
  onOpenLogin,
  currentLang,
  onLanguageChange,
  currentTheme,
  onThemeChange,
  onOpenInfoPage,
}) => {
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getLocalUser());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showManageDevicesModal, setShowManageDevicesModal] = useState(false);
  const [showSavedAddressModal, setShowSavedAddressModal] = useState(false);
  const [showGoogleSessionModal, setShowGoogleSessionModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailId, setEmailId] = useState('');
  const [avatar, setAvatar] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  useEffect(() => {
    let unsubscribeSnap: (() => void) | undefined;
    if (currentUser?.uid && showProfileModal) {
      setIsLoadingProfile(true);
      setProfileError(null);
      const userDocRef = doc(db, 'users', currentUser.uid);

      unsubscribeSnap = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const fullName = data.displayName || currentUser.displayName || '';
          const parts = fullName.split(' ');
          setFirstName(data.firstName !== undefined ? data.firstName : (parts[0] || ''));
          setLastName(data.lastName !== undefined ? data.lastName : (parts.slice(1).join(' ') || ''));
          setEmailId(data.email || currentUser.email || '');
          setMobileNumber(data.phoneNumber || '');
          setAvatar(data.avatar || currentUser.avatar || '');
        }
        setIsLoadingProfile(false);
      }, (err) => {
        console.error('Failed to sync profile from Firestore:', err);
        setProfileError('Failed to load profile data. Please check your connection.');
        setIsLoadingProfile(false);
      });
    } else if (!currentUser) {
      setFirstName('');
      setLastName('');
      setEmailId('');
      setMobileNumber('');
      setAvatar('');
      setIsLoadingProfile(false);
    }
    return () => {
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, [currentUser?.uid, showProfileModal]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSavedMsg('');
    try {
      const updatedName = `${firstName} ${lastName}`.trim();
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        firstName,
        lastName,
        displayName: updatedName,
        email: emailId,
        phoneNumber: mobileNumber,
        avatar,
        updatedAt: Date.now()
      });
      const updatedUser = {
        ...currentUser,
        firstName,
        lastName,
        displayName: updatedName,
        email: emailId,
        phoneNumber: mobileNumber,
        avatar
      };
      saveLocalUser(updatedUser);
      setCurrentUser(updatedUser);
      setProfileSavedMsg('Profile updated and synchronized successfully!');
      setTimeout(() => setProfileSavedMsg(''), 3500);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setProfileError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    const unsub = initAuthListener((u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const t = (key: string) => getTranslation(currentLang, key);

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F7F9FF] dark:bg-[#071329] text-[#102A56] dark:text-[#F5F7FF] shadow-2xl flex flex-col transition-colors duration-300 border-l border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)]">
          
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#6C3BFF] via-[#4F46E5] to-[#2589FF] text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 text-white shadow-inner font-bold text-lg overflow-hidden">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : currentUser?.displayName ? (
                  currentUser.displayName.charAt(0).toUpperCase()
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight truncate">
                  {currentUser?.displayName || 'Guest'}
                </h2>
                <p className="text-xs text-blue-100 truncate">
                  {currentUser?.email || currentUser?.uid || 'Please sign in'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 backdrop-blur-md transition-all text-white flex-shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Google Login / Account Card */}
            <div 
              onClick={() => {
                if (currentUser) {
                  setShowGoogleSessionModal(true);
                } else {
                  onClose();
                  onOpenLogin();
                }
              }}
              className="glow-card rounded-[20px] p-4 flex items-center justify-between cursor-pointer"
            >
              <div>
                <h4 className="text-xs font-bold text-[#102A56] dark:text-[#F5F7FF]">
                  {currentUser ? 'Google Session Active' : 'Sign in with Google'}
                </h4>
                <p className="text-[11px] text-[#526B98] dark:text-[#8294B8]">
                  {currentUser ? (currentUser.email || 'Verified User') : 'Fast & Secure Google Authentication'}
                </p>
              </div>
              {currentUser ? (
                <button
                  type="button"
                  onClick={async () => {
                    await logoutUser();
                    setCurrentUser(null);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-transform active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="glow-btn-primary text-white text-xs font-bold px-4 py-2 rounded-xl transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Quick Stats Card */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                className="p-4 glow-card rounded-[20px] text-left cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#526B98] dark:text-[#B8C7E8]">My Cart</span>
                  <ShoppingCart className="w-4 h-4 text-[#2589FF] dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-[#102A56] dark:text-[#F5F7FF]">
                  {cartCount} <span className="text-xs font-normal text-[#7889A8] dark:text-[#8294B8]">items</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenWishlist) onOpenWishlist();
                }}
                className="p-4 glow-card rounded-[20px] text-left cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#526B98] dark:text-[#B8C7E8]">My Wishlist</span>
                  <Heart className="w-4 h-4 text-red-500 fill-red-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-red-500">
                  {wishlistCount} <span className="text-xs font-normal text-[#7889A8] dark:text-[#8294B8]">items</span>
                </div>
              </button>
            </div>

            {/* My Profile Button */}
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  onClose();
                  onOpenLogin();
                } else {
                  setShowProfileModal(true);
                }
              }}
              className="w-full p-3.5 glow-interactive bg-white/80 dark:bg-[#102448]/80 rounded-[20px] flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 text-[#6C3BFF] dark:text-cyan-400 flex items-center justify-center font-bold overflow-hidden border border-blue-400/30">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : currentUser?.displayName ? (
                    currentUser.displayName.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#102A56] dark:text-[#F5F7FF]">My Profile</div>
                  <div className="text-[11px] text-[#526B98] dark:text-[#8294B8]">
                    {currentUser ? 'View & edit name, phone & email' : 'Sign in to view your profile'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Manage Devices Button */}
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  onClose();
                  onOpenLogin();
                } else {
                  setShowManageDevicesModal(true);
                }
              }}
              className="w-full p-3.5 glow-interactive bg-white/80 dark:bg-[#102448]/80 rounded-[20px] flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 text-[#6C3BFF] dark:text-cyan-400 flex items-center justify-center font-bold border border-blue-400/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#102A56] dark:text-[#F5F7FF]">Manage Devices</div>
                  <div className="text-[11px] text-[#526B98] dark:text-[#8294B8]">
                    {currentUser ? 'View & manage active sessions' : 'Sign in to view devices'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Saved Address Button */}
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  onClose();
                  onOpenLogin();
                } else {
                  setShowSavedAddressModal(true);
                }
              }}
              className="w-full p-3.5 glow-interactive bg-white/80 dark:bg-[#102448]/80 rounded-[20px] flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 text-[#6C3BFF] dark:text-cyan-400 flex items-center justify-center font-bold border border-blue-400/30">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#102A56] dark:text-[#F5F7FF]">Saved Address</div>
                  <div className="text-[11px] text-[#526B98] dark:text-[#8294B8]">
                    {currentUser ? 'Manage delivery addresses' : 'Sign in to view addresses'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Language & Theme Settings */}
            <div className="glow-card rounded-[20px] overflow-hidden">
              <div className="px-4 py-2.5 text-[11px] font-bold text-[#7889A8] dark:text-[#8294B8] uppercase tracking-wider border-b border-[var(--glow-border-subtle)]">
                Preferences
              </div>

              {/* Language Selector */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowLanguagePicker(!showLanguagePicker)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-blue-500 dark:text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-[#102A56] dark:text-[#F5F7FF]">{t('chooseLanguage')}</div>
                      <div className="text-[11px] text-[#526B98] dark:text-[#8294B8]">
                        {LANGUAGES.find(l => l.code === currentLang)?.name} ({LANGUAGES.find(l => l.code === currentLang)?.localName})
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showLanguagePicker ? 'rotate-90' : ''}`} />
                </button>

                {showLanguagePicker && (
                  <div className="bg-white/95 dark:bg-[#071329]/95 p-2.5 border-t border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)] grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-150">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setShowLanguagePicker(false);
                        }}
                        className={`p-2 rounded-xl text-left text-xs flex items-center justify-between border ${
                          currentLang === lang.code
                            ? 'bg-blue-500/15 border-blue-400 text-blue-700 dark:text-cyan-300 font-bold'
                            : 'border-transparent hover:bg-gray-100/60 dark:hover:bg-slate-800/60 text-[#526B98] dark:text-[#B8C7E8]'
                        }`}
                      >
                        <span className="truncate">{lang.name}</span>
                        {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Selector */}
              <div className="border-t border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)]">
                <button
                  type="button"
                  onClick={() => setShowThemePicker(!showThemePicker)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-amber-500 dark:text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-[#102A56] dark:text-[#F5F7FF]">{t('appearance')}</div>
                      <div className="text-[11px] text-[#526B98] dark:text-[#8294B8] capitalize">
                        {currentTheme === 'system' ? 'System Default' : currentTheme}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showThemePicker ? 'rotate-90' : ''}`} />
                </button>

                {showThemePicker && (
                  <div className="bg-white/95 dark:bg-[#071329]/95 p-2.5 border-t border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)] flex gap-2 animate-in slide-in-from-top-2 duration-150">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Monitor },
                    ].map(option => {
                      const Icon = option.icon;
                      const isSelected = currentTheme === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            onThemeChange(option.id as Theme);
                            setShowThemePicker(false);
                          }}
                          className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                            isSelected
                              ? 'bg-blue-500/15 border-blue-400 text-blue-700 dark:text-cyan-300 font-bold shadow-xs'
                              : 'border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.2)] hover:bg-gray-100/60 dark:hover:bg-slate-800/60 text-[#526B98] dark:text-[#B8C7E8]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-white/80 dark:bg-[#102448]/80 backdrop-blur-xl rounded-[20px] border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 text-[11px] font-bold text-[#7889A8] dark:text-[#8294B8] uppercase tracking-wider border-b border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)]">
                Support & Info
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInfoPage('help');
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-500 dark:text-cyan-400" />
                  <span className="text-xs font-semibold text-[#102A56] dark:text-[#F5F7FF]">{t('helpCentre')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInfoPage('about');
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors text-left border-t border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)]"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-500 dark:text-cyan-400" />
                  <span className="text-xs font-semibold text-[#102A56] dark:text-[#F5F7FF]">{t('aboutUs')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInfoPage('legal');
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors text-left border-t border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)]"
              >
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-blue-500 dark:text-cyan-400" />
                  <span className="text-xs font-semibold text-[#102A56] dark:text-[#F5F7FF]">{t('legal')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>



            {/* Connect with us links */}
            <div className="pt-2 text-center">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                {t('connectWithUs')}
              </span>
              <div className="flex justify-center gap-3">
                <a 
                  href="https://youtube.com/@smartdeal-online.products?si=DEQhBYCRqwK2apM6" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-full overflow-hidden hover:scale-110 transition-transform shadow-sm"
                  title="YouTube"
                >
                  <img src="https://cdn-icons-png.flaticon.com/512/2504/2504965.png" alt="YouTube" className="w-full h-full object-cover" />
                </a>
                <a 
                  href="https://www.facebook.com/share/1L7etvDEGm/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-full overflow-hidden hover:scale-110 transition-transform shadow-sm"
                  title="Facebook"
                >
                  <img src="https://cdn-icons-png.flaticon.com/512/2504/2504903.png" alt="Facebook" className="w-full h-full object-cover" />
                </a>
                <a 
                  href="https://www.instagram.com/smart_deal_online?igsh=MWxzOTk5bGdobWMycA==" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-full overflow-hidden hover:scale-110 transition-transform shadow-sm"
                  title="Instagram"
                >
                  <img src="https://cdn-icons-png.flaticon.com/512/2504/2504918.png" alt="Instagram" className="w-full h-full object-cover" />
                </a>
                <a 
                  href="mailto:albert.studio.1879@gmail.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-full overflow-hidden hover:scale-110 transition-transform shadow-sm bg-white p-1"
                  title="Email"
                >
                  <img src="https://cdn-icons-png.flaticon.com/512/5968/5968534.png" alt="Gmail" className="w-full h-full object-contain" />
                </a>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 dark:border-slate-800 text-center text-[10px] text-gray-400 safe-pb">
            Smart Deal Online v2.0.{new Date().getFullYear().toString().slice(-2)} • All rights reserved
          </div>

        </div>
      </div>

      {/* My Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 dark:bg-[#102448]/95 backdrop-blur-2xl w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden border border-[rgba(92,137,220,0.25)] dark:border-[rgba(100,160,255,0.3)] flex flex-col">
            
            {/* Top Blue Banner */}
            <div className="bg-gradient-to-r from-[#6C3BFF] via-[#4F46E5] to-[#2589FF] text-white p-6 relative flex flex-col items-center justify-center shadow-sm">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div 
                onClick={() => setShowAvatarPicker(true)}
                className="relative w-24 h-24 rounded-full bg-white dark:bg-[#071329] shadow-lg border-4 border-white/25 flex items-center justify-center text-[#102A56] dark:text-white text-3xl font-bold cursor-pointer group"
                title="Click to change profile photo"
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{(firstName || currentUser?.displayName || 'U').charAt(0).toUpperCase()}</span>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-full">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-[#102448] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-base font-bold mt-2">My Profile</h3>
              <p className="text-[11px] text-blue-100 mt-0.5">Click photo to change avatar</p>
            </div>

            {/* Avatar Picker Modal */}
            {showAvatarPicker && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-white/95 dark:bg-[#102448]/95 backdrop-blur-2xl w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden border border-[rgba(92,137,220,0.25)] dark:border-[rgba(100,160,255,0.3)] flex flex-col p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)] pb-3">
                    <h4 className="text-sm font-bold text-[#102A56] dark:text-[#F5F7FF] flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#2589FF]" /> Choose Profile Photo
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100/70 dark:bg-slate-800/70 text-[#526B98] dark:text-[#B8C7E8] hover:opacity-80 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Option 1: First Name Initial Avatar with Color Badges */}
                    <div>
                      <div className="p-3.5 bg-white/60 dark:bg-[#071329]/60 rounded-2xl border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] space-y-3">
                        <div className="grid grid-cols-7 gap-2.5">
                          {[
                            { name: 'Blue', hex: '2563eb', bg: 'bg-blue-600' },
                            { name: 'Indigo', hex: '4f46e5', bg: 'bg-indigo-600' },
                            { name: 'Violet', hex: '7c3aed', bg: 'bg-violet-600' },
                            { name: 'Purple', hex: '9333ea', bg: 'bg-purple-600' },
                            { name: 'Pink', hex: 'db2777', bg: 'bg-pink-600' },
                            { name: 'Rose', hex: 'e11d48', bg: 'bg-rose-600' },
                            { name: 'Red', hex: 'dc2626', bg: 'bg-red-600' },
                            { name: 'Orange', hex: 'ea580c', bg: 'bg-orange-600' },
                            { name: 'Amber', hex: 'd97706', bg: 'bg-amber-600' },
                            { name: 'Emerald', hex: '059669', bg: 'bg-emerald-600' },
                            { name: 'Teal', hex: '0d9488', bg: 'bg-teal-600' },
                            { name: 'Cyan', hex: '0284c7', bg: 'bg-cyan-600' },
                            { name: 'Slate', hex: '475569', bg: 'bg-slate-600' },
                            { name: 'Dark', hex: '111827', bg: 'bg-gray-900' },
                          ].map((c) => {
                            const firstLetter = (firstName || currentUser?.displayName || 'User').trim().charAt(0).toUpperCase();
                            const letterAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstLetter)}&backgroundColor=${c.hex}&textColor=ffffff`;
                            const isSelected = avatar === letterAvatar;
                            return (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => {
                                  setAvatar(letterAvatar);
                                  setShowAvatarPicker(false);
                                }}
                                className={`relative w-11 h-11 rounded-full ${c.bg} text-white flex items-center justify-center font-bold text-base shadow-md hover:scale-110 transition-transform cursor-pointer border-2 ${
                                  isSelected ? 'border-white ring-4 ring-blue-500' : 'border-transparent hover:border-white/50'
                                }`}
                                title={`${c.name} background`}
                              >
                                {firstLetter}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Illustrated Cartoon Avatars */}
                    <div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Buster&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
                          'https://api.dicebear.com/7.x/lorelei/svg?seed=Charlie&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
                          'https://api.dicebear.com/7.x/lorelei/svg?seed=Chloe&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Penny&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
                          'https://api.dicebear.com/7.x/lorelei/svg?seed=Oscar&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
                          'https://api.dicebear.com/7.x/lorelei/svg?seed=Ruby&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Ziggy&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf'
                        ].map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAvatar(url);
                              setShowAvatarPicker(false);
                            }}
                            className={`w-20 h-20 mx-auto rounded-full overflow-hidden border-2 transition-all hover:scale-105 shadow-sm bg-gray-100 dark:bg-slate-800 cursor-pointer ${
                              avatar === url ? 'border-blue-600 ring-2 ring-blue-400' : 'border-gray-200 dark:border-slate-700'
                            }`}
                          >
                            <img src={url} alt={`Cartoon Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Body or Sign-In Prompt */}
            {!currentUser ? (
              <div className="p-8 text-center space-y-5">
                <p className="text-sm font-semibold text-[#102A56] dark:text-[#F5F7FF]">
                  Please sign in to view your profile
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    onClose();
                    onOpenLogin();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] hover:opacity-95 text-white font-bold text-xs rounded-full shadow-lg shadow-blue-500/25 transition-transform active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  Sign in with Google
                </button>
              </div>
            ) : isLoadingProfile ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-[#2589FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-semibold text-[#526B98] dark:text-[#8294B8]">Loading your profile from Firestore...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="p-6 space-y-5 flex-1 overflow-y-auto">
                {profileSavedMsg && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl text-center">
                    {profileSavedMsg}
                  </div>
                )}

                {profileError && (
                  <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl text-center">
                    {profileError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#526B98] dark:text-[#8294B8] mb-1">First Name</label>
                    <input 
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/70 dark:bg-[#071329]/60 border-b border-[rgba(92,137,220,0.3)] dark:border-[rgba(100,160,255,0.35)] text-[#102A56] dark:text-[#F5F7FF] text-sm focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#526B98] dark:text-[#8294B8] mb-1">Last Name</label>
                    <input 
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/70 dark:bg-[#071329]/60 border-b border-[rgba(92,137,220,0.3)] dark:border-[rgba(100,160,255,0.35)] text-[#102A56] dark:text-[#F5F7FF] text-sm focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-8 py-2.5 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs rounded-full shadow-lg shadow-blue-500/25 transition-transform active:scale-95 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 mx-auto"
                    >
                      {isSavingProfile && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-[#526B98] dark:text-[#8294B8]">Mobile Number</div>
                        <div className="text-sm font-bold text-[#102A56] dark:text-[#F5F7FF] mt-0.5">{mobileNumber}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const num = prompt('Enter new mobile number:', mobileNumber);
                          if (num) setMobileNumber(num);
                        }}
                        className="text-xs font-bold text-[#2589FF] dark:text-cyan-400 hover:underline cursor-pointer"
                      >
                        Update
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-[#526B98] dark:text-[#8294B8]">Email ID</div>
                        <div className="text-sm font-bold text-[#102A56] dark:text-[#F5F7FF] mt-0.5">{emailId}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const em = prompt('Enter new email ID:', emailId);
                          if (em) setEmailId(em);
                        }}
                        className="text-xs font-bold text-[#2589FF] dark:text-cyan-400 hover:underline cursor-pointer"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
      {/* Google Session Profile Modal */}
      {showGoogleSessionModal && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 dark:bg-[#102448]/95 backdrop-blur-2xl w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden border border-[rgba(92,137,220,0.25)] dark:border-[rgba(100,160,255,0.3)] flex flex-col text-[#102A56] dark:text-white">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#6C3BFF] via-[#4F46E5] to-[#2589FF] text-white p-5 relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">My Account Profile</h3>
                <p className="text-[11px] text-blue-100">Smart Deal Online • Google Sign-In</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleSessionModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              
              {/* Avatar with badge */}
              <div className="relative w-24 h-24 rounded-full bg-white dark:bg-[#071329] shadow-xl border-4 border-blue-600/40 flex items-center justify-center text-[#102A56] dark:text-white text-3xl font-bold overflow-hidden mt-2">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : currentUser?.displayName ? (
                  currentUser.displayName.charAt(0).toUpperCase()
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>

              {/* Name & Email */}
              <div>
                <h4 className="text-lg font-black text-[#102A56] dark:text-white tracking-tight">
                  {currentUser?.displayName || 'Verified User'}
                </h4>
                <p className="text-xs text-[#526B98] dark:text-[#8294B8] mt-0.5">
                  {currentUser?.email || 'muhammedmanas2a@gmail.com'}
                </p>
              </div>

              {/* Google Authentication Active Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Google Authentication Active</span>
              </div>

              {/* Action Buttons */}
              <div className="w-full pt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleSessionModal(false);
                    onClose();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] hover:opacity-95 text-white font-bold text-xs rounded-full shadow-lg shadow-blue-500/25 transition-transform active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  Continue Shopping
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await logoutUser();
                    setCurrentUser(null);
                    setShowGoogleSessionModal(false);
                  }}
                  className="w-full py-3 bg-white/70 dark:bg-[#071329]/70 hover:bg-red-500/10 text-red-500 font-bold text-xs rounded-full border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>

            </div>

            {/* Footer */}
            <div className="p-3 bg-white/40 dark:bg-[#071329]/40 border-t border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)] text-center text-[10px] text-[#7889A8] dark:text-[#8294B8]">
              Smart Deal Online • Secure Google Authentication
            </div>

          </div>
        </div>
      )}

      {/* Manage Devices Modal / Page */}
      <ManageDevicesModal 
        isOpen={showManageDevicesModal} 
        onClose={() => setShowManageDevicesModal(false)} 
        currentUser={currentUser} 
        onOpenLogin={onOpenLogin} 
      />

      {/* Saved Address Modal / Page */}
      <SavedAddressModal 
        isOpen={showSavedAddressModal} 
        onClose={() => setShowSavedAddressModal(false)} 
        currentUser={currentUser} 
        onOpenLogin={onOpenLogin} 
      />
    </div>
  );
};
