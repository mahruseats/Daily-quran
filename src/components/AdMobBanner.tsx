import React, { useState, useEffect } from 'react';
import { ADMOB_CONFIG, adMobManager, AdLoadState } from '../services/admob';
import { Info, Sparkles } from 'lucide-react';

interface AdMobBannerProps {
  className?: string;
  fixedBottom?: boolean;
  hasAudioBar?: boolean;
}

export const AdMobBanner: React.FC<AdMobBannerProps> = ({
  className = '',
  fixedBottom = false,
  hasAudioBar = false,
}) => {
  const [loadState, setLoadState] = useState<AdLoadState>('loading');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Wait for SDK initialization
    const checkInit = async () => {
      try {
        await adMobManager.initialize();
        if (!isMounted) return;

        // Check if offline
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setLoadState('error');
          return;
        }

        // Simulate realistic GMA Next-Gen banner ad loading
        setTimeout(() => {
          if (isMounted) {
            setLoadState('loaded');
          }
        }, 400);
      } catch {
        if (isMounted) {
          setLoadState('error');
        }
      }
    };

    checkInit();

    const handleOnline = () => {
      if (loadState === 'error') {
        setLoadState('loading');
        setTimeout(() => setLoadState('loaded'), 500);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // If ad failed to load, do not break the app and do not leave an awkward empty block
  if (loadState === 'error') {
    return null;
  }

  const containerClasses = fixedBottom
    ? `fixed left-0 right-0 z-30 flex flex-col items-center justify-center px-2 py-1.5 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-md transition-all duration-200 ${
        hasAudioBar ? 'bottom-[70px] sm:bottom-[76px]' : 'bottom-0'
      } ${className}`
    : `w-full flex flex-col items-center justify-center my-3 select-none ${className}`;

  return (
    <div
      id="admob-banner-container"
      role="complementary"
      aria-label="Google AdMob Test Advertisement"
      className={containerClasses}
    >
      <div className="relative w-full max-w-[340px] sm:max-w-[468px] min-h-[52px] bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden flex items-center justify-between px-3 py-1.5 transition-colors">
        {/* Test Ad Badge (Google AdMob Specification) */}
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-xs uppercase tracking-wider shadow-2xs">
            Test Ad
          </span>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                AdMob GMA Next-Gen Banner
              </span>
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
              {ADMOB_CONFIG.BANNER_AD_UNIT_ID}
            </span>
          </div>
        </div>

        {/* AdMob Info Toggle */}
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          title="Ad details"
          aria-label="Toggle AdMob Test Ad Details"
          className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expandable test metadata (optional, non-intrusive) */}
      {showDetails && (
        <div className="w-full max-w-[340px] sm:max-w-[468px] mt-1 p-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-md text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Google AdMob Test Mode:</p>
          <p className="mt-0.5 font-mono">App ID: {ADMOB_CONFIG.APP_ID}</p>
          <p className="mt-0.5 font-mono">Unit: {ADMOB_CONFIG.BANNER_AD_UNIT_ID}</p>
          <p className="mt-0.5 text-emerald-600 dark:text-emerald-400">SDK: GMA Next-Gen (Background Init)</p>
        </div>
      )}
    </div>
  );
};
