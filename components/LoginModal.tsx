import React, { useState, useEffect } from 'react';
import { X, Phone, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { 
  sendPhoneOtp, 
  verifyPhoneOtp, 
  UserAccount, 
  logoutUser,
  initAuthListener,
  clearRecaptchaVerifier
} from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: UserAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    const unsub = initAuthListener((u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // Resend cooldown timer effect
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your mobile number.');
      return;
    }

    setIsLoading(true);
    const res = await sendPhoneOtp(trimmed);
    setIsLoading(false);

    if (res.success && res.session) {
      setActiveSession(res.session);
      setStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setSuccessMessage(res.message || 'OTP sent successfully via SMS.');
    } else {
      setErrorMessage(res.message || 'Failed to send SMS OTP. Please check your number or ensure Phone Authentication is enabled in Firebase Console.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (!activeSession) {
      setErrorMessage('Verification session expired. Please request a new OTP.');
      setStep('input');
      return;
    }

    setIsLoading(true);
    const res = await verifyPhoneOtp(activeSession, otpCode);
    setIsLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setSuccessMessage('Login successful!');
      if (onLoginSuccess) onLoginSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMessage(res.message || 'Incorrect OTP code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setOtpCode('');
    setErrorMessage(null);
    setIsLoading(true);

    const res = await sendPhoneOtp(phoneNumber);
    setIsLoading(false);
    if (res.success && res.session) {
      setActiveSession(res.session);
      setResendTimer(30);
      setCanResend(false);
      setSuccessMessage('A new OTP has been sent to your mobile.');
    } else {
      setErrorMessage(res.message || 'Failed to resend SMS OTP.');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setPhoneNumber('');
    setOtpCode('');
    setStep('input');
    clearRecaptchaVerifier();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
        <div id="recaptcha-container" className="fixed bottom-4 left-4 z-[9999] pointer-events-auto"></div>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {currentUser ? 'My Account Profile' : 'Mobile Number OTP Login'}
              </h2>
              <p className="text-xs text-blue-100">Smart Deal Online • Firebase Phone Auth</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearRecaptchaVerifier();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {currentUser ? (
            /* Logged in state */
            <div className="text-center py-4 space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner border border-blue-200 dark:border-blue-800">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentUser.displayName || 'Smart Deal Member'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {currentUser.phoneNumber || currentUser.uid}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Secure Phone Authentication Active</span>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Continue Shopping
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Login / OTP Flow */
            <div className="space-y-4">
              
              {/* Status / Error feedback */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  {successMessage}
                </div>
              )}

              {/* Step 1: Input Mobile Number */}
              {step === 'input' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Enter Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-bold text-sm">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="98765 43210"
                        className="w-full py-3 pr-4 pl-14 rounded-xl border bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all border-gray-200 dark:border-slate-700"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      We will send a 6-digit verification code via SMS using Firebase Phone Authentication.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Secured by Firebase Phone Auth & reCAPTCHA</span>
                    </p>
                  </div>
                </form>
              ) : (
                /* Step 2: Enter 6-digit OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Enter 6-Digit OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('input');
                          setOtpCode('');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                          clearRecaptchaVerifier();
                        }}
                        className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Change Number
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Code sent to <span className="font-semibold text-gray-800 dark:text-gray-200">{phoneNumber}</span>
                    </p>

                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      className="w-full py-3.5 px-4 text-center tracking-[1em] text-2xl font-black rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Didn\'t receive OTP?'}
                    </span>
                    <button
                      type="button"
                      disabled={!canResend || isLoading}
                      onClick={handleResend}
                      className={`font-bold transition-colors ${
                        canResend ? 'text-blue-600 hover:underline cursor-pointer' : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Resend OTP
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Login</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 text-center text-[11px] text-gray-400">
          Smart Deal Online • Firebase Phone Authentication
        </div>
      </div>
    </div>
  );
};
