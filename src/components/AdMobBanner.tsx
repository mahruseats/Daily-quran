import React, { useEffect, useRef, useState } from 'react';
import { ADMOB_CONFIG } from '../config/admob';
import { showNativeBanner, hideNativeBanner } from '../services/admobService';
import { Capacitor } from '@capacitor/core';
import { Sparkles, Info } from 'lucide-react';
import { AppLanguage } from '../types';

interface AdMobBannerProps {
  language?: AppLanguage;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export const AdMobBanner: React.FC<AdMobBannerProps> = ({
  language = 'bn',
  className = '',
}) => {
  const isBangla = language === 'bn';
  const isNative = Capacitor.isNativePlatform();
  const adRef = useRef<HTMLModElement | null>(null);
  const [adLoaded, setAdLoaded] = useState<boolean>(false);
  const [hasAdError, setHasAdError] = useState<boolean>(false);

  useEffect(() => {
    if (isNative) {
      // Trigger native Capacitor AdMob banner
      showNativeBanner().catch(() => {
        // Native fallback
      });
      return () => {
        hideNativeBanner().catch(() => {});
      };
    }

    // Web / PWA Google Ads fallback
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
        setAdLoaded(true);
      }
    } catch (err) {
      setHasAdError(true);
    }
  }, [isNative]);

  return (
    <aside
      id="admob-banner-container"
      aria-label="Google Mobile Ads Advertisement"
      className={`fixed bottom-0 left-0 right-0 z-35 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1 flex flex-col items-center justify-center transition-all duration-200 safe-area-bottom ${className}`}
      style={{ minHeight: '56px' }}
    >
      {/* Discreet Ad badge conforming to AdMob / Google publisher placement policies */}
      <div className="w-full max-w-2xl flex items-center justify-between px-1 mb-0.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <span className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {isBangla ? 'বিজ্ঞাপন' : 'Ad'}
          </span>
          <span className="text-[10px]">Google Mobile Ads</span>
        </span>
        <span className="text-[9px] font-mono opacity-60 truncate max-w-[200px]" title={ADMOB_CONFIG.bannerUnitId}>
          {ADMOB_CONFIG.bannerUnitId}
        </span>
      </div>

      {/* Main Banner Unit Block: 320x50 / 468x60 / 728x50 responsive */}
      <div className="w-full max-w-2xl flex items-center justify-center overflow-hidden min-h-[50px]">
        {/* Google AdSense / AdMob Web Tag */}
        <ins
          ref={adRef}
          className="adsbygoogle block w-full text-center"
          style={{ display: 'inline-block', width: '100%', maxWidth: '728px', height: '50px' }}
          data-ad-client={ADMOB_CONFIG.publisherId}
          data-ad-slot={ADMOB_CONFIG.slotId}
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />

        {/* Fallback Display if Google Ads scripts are waiting or blocked by browser preview */}
        {(!adLoaded || hasAdError) && (
          <div className="flex items-center justify-between gap-3 w-full px-3 py-1.5 bg-gradient-to-r from-emerald-50 via-slate-50 to-amber-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-amber-950/30 rounded-lg border border-dashed border-emerald-300/60 dark:border-emerald-700/50 text-slate-700 dark:text-slate-200">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-emerald-900 dark:text-emerald-200">
                  {isBangla ? 'দৈনিক কুরআন অ্যাপ স্পন্সর' : 'Daily Quran Sponsor Banner'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  Unit: {ADMOB_CONFIG.bannerUnitId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-medium">
                {isBangla ? 'সক্রিয়' : 'Active'}
              </span>
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
