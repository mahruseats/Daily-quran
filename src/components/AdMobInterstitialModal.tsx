import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { ADMOB_CONFIG } from '../config/admob';
import { subscribeWebInterstitial } from '../services/admobService';
import { AppLanguage } from '../types';

interface AdMobInterstitialModalProps {
  language?: AppLanguage;
}

export const AdMobInterstitialModal: React.FC<AdMobInterstitialModalProps> = ({
  language = 'bn',
}) => {
  const isBangla = language === 'bn';
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [canClose, setCanClose] = useState<boolean>(false);
  const onCloseCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeWebInterstitial((onClose) => {
      onCloseCallbackRef.current = onClose;
      setCountdown(3);
      setCanClose(false);
      setIsOpen(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (onCloseCallbackRef.current) {
      const cb = onCloseCallbackRef.current;
      onCloseCallbackRef.current = null;
      cb();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Google Mobile Ads Interstitial"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* AdMob Interstitial Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
              {isBangla ? 'বিজ্ঞাপন' : 'Ad'}
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Google Mobile Ads
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]" title={ADMOB_CONFIG.interstitialUnitId}>
              {ADMOB_CONFIG.interstitialUnitId.split('/')[1]}
            </span>

            {/* Close Button with countdown */}
            <button
              onClick={handleClose}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                canClose
                  ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95 shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-300'
              }`}
              title={isBangla ? 'বিজ্ঞাপন বন্ধ করুন' : 'Close Ad'}
            >
              {!canClose && countdown > 0 ? (
                <span>{countdown}s</span>
              ) : (
                <>
                  <span>{isBangla ? 'বন্ধ' : 'Skip'}</span>
                  <X className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* AdMob Interstitial Creative Visual Area */}
        <div className="p-5 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-4">
            <Sparkles className="w-10 h-10" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>{isBangla ? 'ভেরিফায়েড ইসলামিক প্ল্যাটফর্ম' : 'Verified Partner Platform'}</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
            {isBangla ? 'দৈনিক কুরআন ও সুন্নাহ শিক্ষণ' : 'Daily Quran & Islamic Community'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-xs leading-relaxed">
            {isBangla
              ? 'সহজ বিশুদ্ধ বাংলা উচ্চারণ, বিশ্বখ্যাত ক্বারীদের সুললিত তিলাওয়াত এবং সহীহ তাফসির নিয়ে সম্পূর্ণ ইসলামিক অ্যাপ।'
              : 'Complete Islamic companion with authentic Quranic recitations, word-by-word meaning, and accurate prayer times.'}
          </p>

          {/* Action Button */}
          <div className="w-full flex flex-col gap-2">
            <button
              onClick={() => {
                // Open sponsor/partner action
                handleClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <span>{isBangla ? 'বিস্তারিত জানুন' : 'Learn More'}</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={handleClose}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
            >
              {isBangla ? 'পড়া চালিয়ে যান' : 'Continue to App'}
            </button>
          </div>
        </div>

        {/* Footer info showing AdMob mapping */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 text-center font-mono">
          AdMob Interstitial Unit: {ADMOB_CONFIG.interstitialUnitId}
        </div>
      </div>
    </div>
  );
};
