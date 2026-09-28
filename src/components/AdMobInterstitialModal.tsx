import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { subscribeWebAdModal, ADMOB_INTERSTITIAL_TEST_ID } from '../services/admobService';

interface AdMobInterstitialModalProps {
  onAdClosed?: () => void;
}

export const AdMobInterstitialModal: React.FC<AdMobInterstitialModalProps> = ({ onAdClosed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeWebAdModal((visible) => {
      if (visible) {
        setIsOpen(true);
        setCountdown(3);
        setCanClose(false);
      } else {
        setIsOpen(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    if (onAdClosed) onAdClosed();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Top AdMob Test Header Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded tracking-wider">
              TEST AD
            </span>
            <span className="text-xs font-semibold text-slate-300">Google AdMob Interstitial</span>
          </div>

          <div className="flex items-center gap-2">
            {!canClose ? (
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                Reward in {countdown}s
              </span>
            ) : null}

            <button
              onClick={handleClose}
              disabled={!canClose}
              className={`p-1 rounded-full transition ${
                canClose
                  ? 'bg-slate-700 hover:bg-slate-600 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title={canClose ? 'Close Ad' : `Wait ${countdown}s`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ad Body Content */}
        <div className="p-6 text-center space-y-4 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
          {/* Ad Unit Details Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Unit: {ADMOB_INTERSTITIAL_TEST_ID}</span>
          </div>

          {/* Ad Creative Mock Banner */}
          <div className="py-6 px-4 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white shadow-lg space-y-2 relative overflow-hidden">
            <div className="absolute top-2 right-2 opacity-20">
              <Sparkles className="w-16 h-16" />
            </div>
            <h3 className="text-lg font-bold">Google Mobile Ads SDK</h3>
            <p className="text-xs text-emerald-100 max-w-xs mx-auto leading-relaxed">
              Official AdMob Interstitial Test Unit is loaded and functioning. In an installed Android APK, this displays fullscreen via Google Play Services.
            </p>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            This ad only triggers when clicking back from a Surah or exiting 40 Rabbana Duas.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-slate-800/60 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>AdMob Test Mode</span>
          <button
            onClick={handleClose}
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Skip & Continue</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
