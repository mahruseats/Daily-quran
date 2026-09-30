import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
  InterstitialAdPluginEvents,
} from '@capacitor-community/admob';
import { ADMOB_CONFIG } from '../config/admob';

let isNativeInitialized = false;
let isInterstitialPreloaded = false;
let isPreloadingInterstitial = false;
let lastInterstitialShowTime = 0;

// Minimum cooldown period between automatic interstitial popups (20 seconds)
const INTERSTITIAL_COOLDOWN_MS = 20000;

type InterstitialWebListener = (onClose: () => void) => void;
const webInterstitialListeners: Set<InterstitialWebListener> = new Set();

export const subscribeWebInterstitial = (listener: InterstitialWebListener): (() => void) => {
  webInterstitialListeners.add(listener);
  return () => {
    webInterstitialListeners.delete(listener);
  };
};

export const initializeAdMob = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  if (isNativeInitialized) return true;

  try {
    await AdMob.initialize({
      initializeForTesting: false,
    });
    isNativeInitialized = true;
    return true;
  } catch (err) {
    console.warn('[AdMob] Failed to initialize native Google Mobile Ads SDK:', err);
    return false;
  }
};

/**
 * Loads the interstitial ad in the background when the app starts or after an ad is closed.
 */
export const preloadInterstitial = async (): Promise<boolean> => {
  if (isPreloadingInterstitial) return false;
  isPreloadingInterstitial = true;

  if (Capacitor.isNativePlatform()) {
    try {
      await initializeAdMob();
      await AdMob.prepareInterstitial({
        adId: ADMOB_CONFIG.interstitialUnitId,
        isTesting: false,
      });
      isInterstitialPreloaded = true;
      console.log('[AdMob] Native Interstitial Ad loaded in background:', ADMOB_CONFIG.interstitialUnitId);
      return true;
    } catch (err) {
      console.warn('[AdMob] Native Interstitial failed to load in background:', err);
      return false;
    } finally {
      isPreloadingInterstitial = false;
    }
  }

  // Web / PWA environment preload
  isInterstitialPreloaded = true;
  isPreloadingInterstitial = false;
  console.log('[AdMob] Web Interstitial Ad preloaded in background for unit:', ADMOB_CONFIG.interstitialUnitId);
  return true;
};

/**
 * Displays the loaded interstitial ad when the user triggers an action (e.g. exiting Quran reading, Duas, or Salah).
 */
export const showInterstitialAd = async (onDismissed?: () => void): Promise<boolean> => {
  const proceed = () => {
    lastInterstitialShowTime = Date.now();
    if (onDismissed) onDismissed();
    // Preload next interstitial in background
    setTimeout(() => {
      preloadInterstitial().catch(() => {});
    }, 1500);
  };

  if (Capacitor.isNativePlatform()) {
    try {
      if (!isInterstitialPreloaded) {
        await preloadInterstitial();
      }

      let dismissed = false;
      const safeProceed = () => {
        if (!dismissed) {
          dismissed = true;
          proceed();
        }
      };

      const dismissSub = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        dismissSub.remove();
        safeProceed();
      });

      const failedSub = await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
        failedSub.remove();
        safeProceed();
      });

      await AdMob.showInterstitial();
      isInterstitialPreloaded = false;
      return true;
    } catch (err) {
      console.warn('[AdMob] Failed to show native interstitial:', err);
      proceed();
      return false;
    }
  }

  // Web fallback modal
  if (webInterstitialListeners.size > 0) {
    webInterstitialListeners.forEach((listener) => {
      listener(proceed);
    });
    return true;
  }

  // If no UI listener registered, continue seamlessly
  proceed();
  return false;
};

/**
 * Convenience helper to show interstitial upon exiting a view (Quran reading, Duas, or Salah)
 * with a friendly cooldown throttle so users aren't overwhelmed.
 */
export const showExitInterstitial = (
  source: 'quran' | 'duas' | 'salah',
  onExit: () => void,
  force = false
): void => {
  const now = Date.now();
  const timeSinceLast = now - lastInterstitialShowTime;

  if (!force && timeSinceLast < INTERSTITIAL_COOLDOWN_MS) {
    // Cooldown active, navigate immediately without ad interruption
    onExit();
    return;
  }

  console.log(`[AdMob] Triggering exit interstitial from ${source}`);
  showInterstitialAd(onExit);
};

export const showNativeBanner = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await initializeAdMob();
    const options: BannerAdOptions = {
      adId: ADMOB_CONFIG.bannerUnitId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false,
    };
    await AdMob.showBanner(options);
    return true;
  } catch (err) {
    console.warn('[AdMob] Failed to show native banner:', err);
    return false;
  }
};

export const hideNativeBanner = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.hideBanner();
  } catch (err) {
    console.warn('[AdMob] Failed to hide native banner:', err);
  }
};

export const removeNativeBanner = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.removeBanner();
  } catch (err) {
    console.warn('[AdMob] Failed to remove native banner:', err);
  }
};
