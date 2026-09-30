/**
 * Google Mobile Ads & AdMob Configuration
 *
 * App ID: pub-6512636168497393~1383777507
 * Banner Unit ID: ca-app-pub-6512636168497393/7040564338
 */

export const ADMOB_CONFIG = {
  appId: import.meta.env.VITE_ADMOB_APP_ID || 'pub-6512636168497393~1383777507',
  bannerUnitId: import.meta.env.VITE_ADMOB_BANNER_UNIT_ID || 'ca-app-pub-6512636168497393/7040564338',
  interstitialUnitId: import.meta.env.VITE_ADMOB_INTERSTITIAL_UNIT_ID || 'ca-app-pub-6512636168497393/5209356341',
  publisherId: 'ca-pub-6512636168497393',
  slotId: '7040564338',
  interstitialSlotId: '5209356341',
} as const;
