import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Official Android Test Interstitial Ad Unit ID requested by user
export const ADMOB_INTERSTITIAL_TEST_ID = 'ca-app-pub-3940256099942544/1033173712';

// Listeners for web preview fallback
type AdEventListener = (visible: boolean) => void;
const webAdListeners: Set<AdEventListener> = new Set();

export const subscribeWebAdModal = (listener: AdEventListener) => {
  webAdListeners.add(listener);
  return () => {
    webAdListeners.delete(listener);
  };
};

let isInitialized = false;
let isAdPrepared = false;
let isPreparing = false;

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

      // Prepare first ad
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
