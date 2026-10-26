import React, { useState, useEffect } from 'react';
import { Theme } from '../types';
import { LANGUAGES, Language, getTranslation } from '../utils/translations';
import { UserAccount, getLocalUser, initAuthListener, logoutUser, saveLocalUser } from '../services/authService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  X, Moon, Sun, Monitor, Languages, ShoppingCart, 
  HelpCircle, Info, Scale, ShieldCheck, ChevronRight,
  ExternalLink, Mail, Check, Heart, Phone, LogIn, LogOut,
  User, Edit3
} from 'lucide-react';

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailId, setEmailId] = useState('');
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
        updatedAt: Date.now()
      });
      const updatedUser = {
        ...currentUser,
        firstName,
        lastName,
        displayName: updatedName,
        email: emailId,
        phoneNumber: mobileNumber
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
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-colors duration-300">
          
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 text-white shadow-inner font-bold text-lg">
                {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (
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
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Google Login / Account Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  {currentUser ? 'Google Session Active' : 'Sign in with Google'}
                </h4>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
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
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-transform active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-transform active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                className="p-3.5 bg-blue-50 dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700 text-left hover:border-blue-300 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">My Cart</span>
                  <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {cartCount} <span className="text-xs font-normal text-gray-500">items</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenWishlist) onOpenWishlist();
                }}
                className="p-3.5 bg-red-50 dark:bg-slate-800 rounded-xl border border-red-100 dark:border-slate-700 text-left hover:border-red-300 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">My Wishlist</span>
                  <Heart className="w-4 h-4 text-red-500 fill-red-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-red-500">
                  {wishlistCount} <span className="text-xs font-normal text-gray-500">items</span>
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
              className="w-full p-3.5 bg-blue-50 dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-slate-700 flex items-center justify-between hover:border-blue-400 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200">My Profile</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    {currentUser ? 'View & edit name, phone & email' : 'Sign in to view your profile'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Language & Theme Settings */}
            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                Preferences
              </div>

              {/* Language Selector */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowLanguagePicker(!showLanguagePicker)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t('chooseLanguage')}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {LANGUAGES.find(l => l.code === currentLang)?.name} ({LANGUAGES.find(l => l.code === currentLang)?.localName})
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showLanguagePicker ? 'rotate-90' : ''}`} />
                </button>

                {showLanguagePicker && (
                  <div className="bg-white dark:bg-slate-850 p-2 border-t border-gray-100 dark:border-slate-700 grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-150">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setShowLanguagePicker(false);
                        }}
                        className={`p-2 rounded-lg text-left text-xs flex items-center justify-between border ${
                          currentLang === lang.code
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-300 font-bold'
                            : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="truncate">{lang.name}</span>
                        {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Selector */}
              <div className="border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowThemePicker(!showThemePicker)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t('appearance')}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 capitalize">
                        {currentTheme === 'system' ? 'System Default' : currentTheme}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showThemePicker ? 'rotate-90' : ''}`} />
                </button>

                {showThemePicker && (
                  <div className="bg-white dark:bg-slate-850 p-2 border-t border-gray-100 dark:border-slate-700 flex gap-2 animate-in slide-in-from-top-2 duration-150">
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
                          className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-300 font-bold'
                              : 'border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'
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
            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                Support & Info
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInfoPage('help');
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t('helpCentre')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInfoPage('about');
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left border-t border-gray-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t('aboutUs')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInfoPage('legal');
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left border-t border-gray-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t('legal')}</span>
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
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 flex flex-col">
            
            {/* Top Blue Banner */}
            <div className="bg-blue-600 text-white p-6 relative flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative w-24 h-24 rounded-full bg-white dark:bg-slate-800 shadow-lg border-4 border-white/20 flex items-center justify-center text-gray-800 dark:text-white text-3xl font-bold overflow-hidden">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}</span>
                )}
                <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-md text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-slate-600">
                  <Edit3 className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-base font-bold mt-2">My Profile</h3>
            </div>

            {/* Form Body or Sign-In Prompt */}
            {!currentUser ? (
              <div className="p-8 text-center space-y-5">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Please sign in to view your profile
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    onClose();
                    onOpenLogin();
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  Sign in with Google
                </button>
              </div>
            ) : isLoadingProfile ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Loading your profile from Firestore...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="p-6 space-y-5 flex-1 overflow-y-auto">
                {profileSavedMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl text-center">
                    {profileSavedMsg}
                  </div>
                )}

                {profileError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                    {profileError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">First Name</label>
                    <input 
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Last Name</label>
                    <input 
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 mx-auto"
                    >
                      {isSavingProfile && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Mobile Number</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{mobileNumber}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const num = prompt('Enter new mobile number:', mobileNumber);
                          if (num) setMobileNumber(num);
                        }}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Update
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Email ID</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{emailId}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const em = prompt('Enter new email ID:', emailId);
                          if (em) setEmailId(em);
                        }}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
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
    </div>
  );
};
