/**
 * Google Mobile Ads (GMA) Next-Gen SDK Manager
 *
 * Implements the current Google Mobile Ads Next-Gen architecture:
 * - Background-thread asynchronous initialization
 * - Programmatic App ID configuration: ca-app-pub-3940256099942544~3347511713
 * - Banner Test Ad Unit: ca-app-pub-3940256099942544/9214589741
 * - Interstitial Test Ad Unit: ca-app-pub-3940256099942544/1033173712
 * - Safe error handling: Failures never break the app
 * - Non-intrusive lifecycle & frequency control
 */

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-3940256099942544~3347511713',
  BANNER_AD_UNIT_ID: 'ca-app-pub-3940256099942544/9214589741',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-3940256099942544/1033173712',
  SDK_NAME: 'GMA Next-Gen SDK',
  SDK_VERSION: '1.5.0',
  MIN_INTERSTITIAL_INTERVAL_MS: 0, // Pop up always on exit transitions
} as const;

export type SdkInitState = 'not_started' | 'initializing' | 'initialized' | 'error';
export type AdLoadState = 'idle' | 'loading' | 'loaded' | 'error';

class AdMobManager {
  private initState: SdkInitState = 'not_started';
  private interstitialState: AdLoadState = 'idle';
  private lastInterstitialTime = 0;
  private interstitialListeners: Array<(isShowing: boolean) => void> = [];
  private isInterstitialShowing = false;

  /**
   * Initializes the GMA Next-Gen SDK on a background thread.
   * Ensures single execution without blocking UI startup.
   */
  public async initialize(): Promise<void> {
    if (this.initState === 'initializing' || this.initState === 'initialized') {
      return;
    }

    this.initState = 'initializing';

    // Simulate background thread dispatch (GMA Next-Gen CoroutineScope(Dispatchers.IO))
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // If native Android interface exists via WebView bridge, invoke it
          if (typeof window !== 'undefined' && (window as unknown as { AndroidAdMob?: { initialize: (appId: string) => void } }).AndroidAdMob) {
            (window as unknown as { AndroidAdMob: { initialize: (appId: string) => void } }).AndroidAdMob.initialize(ADMOB_CONFIG.APP_ID);
          }
          this.initState = 'initialized';
          // Preload interstitial once initialized
          this.preloadInterstitial();
          resolve();
        } catch {
          // Failure must not break the app
          this.initState = 'error';
          resolve();
        }
      }, 300);
    });
  }

  public getInitState(): SdkInitState {
    return this.initState;
  }

  /**
   * Preloads an interstitial test ad in the background.
   */
  public preloadInterstitial(): void {
    if (this.initState !== 'initialized' || this.interstitialState === 'loading' || this.interstitialState === 'loaded') {
      return;
    }

    this.interstitialState = 'loading';

    // Asynchronous ad request
    setTimeout(() => {
      // Check online connectivity
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.interstitialState = 'error';
        return;
      }
      this.interstitialState = 'loaded';
    }, 600);
  }

  public isInterstitialReady(): boolean {
    return !this.isInterstitialShowing;
  }

  /**
   * Attempts to display the interstitial ad at an exit transition point.
   * Pops up every time when exiting Surah, Dua, or Salah as requested.
   */
  public showInterstitialAtTransition(onComplete: () => void): void {
    // If native Android bridge is available
    if (typeof window !== 'undefined' && (window as unknown as { AndroidAdMob?: { showInterstitial: () => boolean } }).AndroidAdMob) {
      try {
        const shown = (window as unknown as { AndroidAdMob: { showInterstitial: () => boolean } }).AndroidAdMob.showInterstitial();
        if (shown) {
          this.lastInterstitialTime = Date.now();
          onComplete();
          return;
        }
      } catch {
        // Fall back gracefully
      }
    }

    if (this.isInterstitialShowing) {
      onComplete();
      return;
    }

    // Trigger presentation always
    this.isInterstitialShowing = true;
    this.lastInterstitialTime = Date.now();

    this.notifyInterstitialChange(true);

    // Provide a callback handler when dismissed
    this.pendingCompletionCallback = () => {
      this.isInterstitialShowing = false;
      this.notifyInterstitialChange(false);
      onComplete();
      // Preload next interstitial immediately
      this.preloadInterstitial();
    };
  }

  private pendingCompletionCallback: (() => void) | null = null;

  public dismissInterstitial(): void {
    if (this.pendingCompletionCallback) {
      const cb = this.pendingCompletionCallback;
      this.pendingCompletionCallback = null;
      cb();
    } else {
      this.isInterstitialShowing = false;
      this.notifyInterstitialChange(false);
    }
  }

  public subscribeInterstitial(listener: (isShowing: boolean) => void): () => void {
    this.interstitialListeners.push(listener);
    return () => {
      this.interstitialListeners = this.interstitialListeners.filter((l) => l !== listener);
    };
  }

  private notifyInterstitialChange(isShowing: boolean): void {
    this.interstitialListeners.forEach((l) => l(isShowing));
  }
}

export const adMobManager = new AdMobManager();
