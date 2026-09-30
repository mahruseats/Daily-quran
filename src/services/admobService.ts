import {
  AdMob,
  InterstitialAdPluginEvents,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Official Android Test Interstitial Ad Unit ID requested by user
export const ADMOB_INTERSTITIAL_TEST_ID = 'ca-app-pub-6512636168497393/5209356341';

// Official Android Test Banner Ad Unit ID (Google Mobile Ads standard 320x50 test banner)
export const ADMOB_BANNER_TEST_ID = 'ca-app-pub-6512636168497393/7040564338';

// Listeners for web preview fallback (Interstitial)
type AdEventListener = (visible: boolean) => void;
const webAdListeners: Set<AdEventListener> = new Set();

export const subscribeWebAdModal = (listener: AdEventListener) => {
  webAdListeners.add(listener);
  return () => {
    webAdListeners.delete(listener);
  };
};

// Listeners for web preview banner (Surah reading bottom banner)
type BannerEventListener = (visible: boolean) => void;
const bannerListeners: Set<BannerEventListener> = new Set();

export const subscribeBannerAd = (listener: BannerEventListener) => {
  bannerListeners.add(listener);
  return () => {
    bannerListeners.delete(listener);
  };
};

let isInitialized = false;
let isAdPrepared = false;
let isPreparing = false;
let isBannerVisible = false;

/**
 * Initializes Google Mobile Ads (AdMob) SDK.
 */
export async function initializeAdMob(): Promise<void> {
  if (isInitialized) return;

  if (Capacitor.isNativePlatform()) {
    try {
      await AdMob.initialize({
        initializeForTesting: true,
        testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
      });
      isInitialized = true;

      // Listen for dismiss event to automatically pre-load the next interstitial
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        isAdPrepared = false;
        prepareInterstitial();
      });

      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
        isAdPrepared = false;
        prepareInterstitial();
      });

      // Prepare first interstitial ad
      await prepareInterstitial();
    } catch (err) {
      console.warn('AdMob native initialization warning:', err);
    }
  } else {
    // Web / preview environment
    isInitialized = true;
  }
}

/**
 * Prepares / pre-loads the Interstitial Ad.
 */
export async function prepareInterstitial(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    isAdPrepared = true;
    return;
  }

  if (isPreparing || isAdPrepared) return;
  isPreparing = true;

  try {
    await AdMob.prepareInterstitial({
      adId: ADMOB_INTERSTITIAL_TEST_ID,
      isTesting: true,
    });
    isAdPrepared = true;
  } catch (err) {
    console.warn('Failed to prepare AdMob interstitial:', err);
    isAdPrepared = false;
  } finally {
    isPreparing = false;
  }
}

/**
 * Shows the interstitial ad if ready.
 * Only called when:
 * 1. User clicks back from a Surah
 * 2. User exits from Rabbana Duas
 */
export async function showInterstitialAd(onClose?: () => void): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      if (!isAdPrepared) {
        await prepareInterstitial();
      }
      await AdMob.showInterstitial();
      isAdPrepared = false;
      if (onClose) onClose();
    } catch (err) {
      console.warn('AdMob show interstitial native fallback:', err);
      // Even if ad fails to show, allow user workflow to continue smoothly
      if (onClose) onClose();
    }
  } else {
    // In web preview / PWA, trigger the visual Test AdMob dialog
    webAdListeners.forEach((fn) => fn(true));
  }
}

/**
 * Shows the standard bottom Banner Ad (320x50 density-independent pixels).
 * Displayed while reading a Surah.
 */
export async function showBannerAd(): Promise<void> {
  if (isBannerVisible) return;
  isBannerVisible = true;

  // Notify web UI listeners so web preview also renders the compliant 320x50 AdMob banner
  bannerListeners.forEach((fn) => fn(true));

  if (Capacitor.isNativePlatform()) {
    try {
      await AdMob.showBanner({
        adId: ADMOB_BANNER_TEST_ID,
        adSize: BannerAdSize.BANNER, // Small 320x50 standard banner compliant with AdMob policies
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true,
      });
    } catch (err) {
      console.warn('AdMob showBanner native warning:', err);
    }
  }
}

/**
 * Hides / removes the bottom Banner Ad when leaving the Surah reader.
 */
export async function hideBannerAd(): Promise<void> {
  if (!isBannerVisible) return;
  isBannerVisible = false;

  bannerListeners.forEach((fn) => fn(false));

  if (Capacitor.isNativePlatform()) {
    try {
      await AdMob.hideBanner();
      await AdMob.removeBanner();
    } catch (err) {
      console.warn('AdMob hideBanner native warning:', err);
    }
  }
}
