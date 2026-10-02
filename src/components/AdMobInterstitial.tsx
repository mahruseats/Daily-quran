import React, { useState, useEffect } from 'react';
import { ADMOB_CONFIG, adMobManager } from '../services/admob';
import { X, Sparkles, ShieldCheck } from 'lucide-react';

export const AdMobInterstitial: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [canCloseImmediately, setCanCloseImmediately] = useState(false);

  useEffect(() => {
    const unsubscribe = adMobManager.subscribeInterstitial((showing) => {
      setIsVisible(showing);
      if (showing) {
        setCountdown(3);
        setCanCloseImmediately(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // 3 second timer for standard interstitial close delay, then enable quick close
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanCloseImmediately(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  const handleClose = () => {
    adMobManager.dismissInterstitial();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Google AdMob Interstitial Test Advertisement"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* AdMob Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-400 text-slate-900 rounded-xs uppercase tracking-wider shadow-2xs">
              Test Ad
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              GMA Next-Gen Interstitial
            </span>
          </div>

          {/* Close button with countdown */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Test Ad"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
          >
            {canCloseImmediately || countdown === 0 ? (
              <>
                <span>Close</span>
                <X className="w-3.5 h-3.5 ml-0.5" />
              </>
            ) : (
              <span>Close in {countdown}s</span>
            )}
          </button>
        </div>

        {/* Ad Content Area */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg text-white">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Google Mobile Ads Next-Gen
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              This is a test interstitial ad served using Google Mobile Ads Next-Gen SDK specifications.
            </p>
          </div>

          {/* Ad Unit Details box */}
          <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-400 font-mono text-left space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-sans font-medium mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GMA Next-Gen Architecture</span>
            </div>
            <p className="truncate">Unit: {ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID}</p>
            <p className="truncate">App: {ADMOB_CONFIG.APP_ID}</p>
          </div>

          {/* Action buttons */}
          <div className="w-full pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
            >
              Skip Test Ad
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 rounded-xl font-medium text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
            >
              Continue to App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
