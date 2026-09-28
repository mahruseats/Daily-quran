import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quran.offline',
  appName: 'Al-Quran Bangla',
  webDir: 'dist',
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-3940256099942544~3347511713', // Official Google AdMob Android Test App ID
      testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
      initializeForTesting: true,
    },
  },
};

export default config;
