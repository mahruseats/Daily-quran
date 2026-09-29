import React, { useState, useEffect } from 'react';
import { Info, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { subscribeBannerAd, ADMOB_BANNER_TEST_ID } from '../services/admobService';

interface AdMobBannerProps {
  className?: string;
}

/**
 * Renders an official-style 320x50 Google AdMob Test Banner at the bottom.
 * In native Android (Capacitor), AdMob SDK draws the native Android View at BOTTOM_CENTER.
 * In Web / PWA preview, this component renders the accurate 320x50 standard banner.
 */
export const AdMobBanner: React.FC<AdMobBannerProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const unsubscribe = subscribeBannerAd((visible) => {
      setIsVisible(visible);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // If not visible, or if on native platform where Capacitor native AdView renders, don't show the HTML mock
  if (!isVisible || isNative) {
    return null;
  }

  return (
    <div
      aria-label="Google AdMob Banner Ad"
      className={`fixed bottom-0 left-0 right-0 z-35 flex justify-center pointer-events-auto select-none safe-area-bottom ${className}`}
    >
      <div className="w-full max-w-[320px] h-[50px] bg-slate-900 text-white rounded-t-xl border-t border-x border-slate-800 shadow-2xl px-2.5 py-1 flex items-center justify-between overflow-hidden">
        {/* Ad badge & details */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col items-center justify-center shrink-0">
            <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1 py-0.2 rounded font-sans leading-tight">
              Ad
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-100 truncate">
                Google Mobile Ads
              </span>
              <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/80 px-1 rounded border border-emerald-800/60 shrink-0">
                320×50
              </span>
            </div>
            <p className="text-[9px] text-slate-400 truncate font-mono">
              Test Unit: {ADMOB_BANNER_TEST_ID.slice(-10)}
            </p>
          </div>
        </div>

        {/* Ad choices / info icon */}
        <div className="flex items-center gap-1 shrink-0 pl-1.5 border-l border-slate-800 text-slate-400">
          <Info className="w-3.5 h-3.5 hover:text-slate-200 transition" />
        </div>
      </div>
    </div>
  );
};
