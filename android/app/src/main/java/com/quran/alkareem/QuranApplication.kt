package com.quran.alkareem

import android.app.Application
import android.util.Log
import com.google.android.libraries.ads.mobile.sdk.common.InitializationConfig
import com.google.android.libraries.ads.mobile.sdk.common.MobileAds
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class QuranApplication : Application() {

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    companion object {
        private const val TAG = "AdMobNextGen"
        const val ADMOB_APP_ID = "ca-app-pub-3940256099942544~3347511713"
        const val BANNER_TEST_AD_UNIT_ID = "ca-app-pub-3940256099942544/9214589741"
        const val INTERSTITIAL_TEST_AD_UNIT_ID = "ca-app-pub-3940256099942544/1033173712"
    }

    override fun onCreate() {
        super.onCreate()
        initializeGmaNextGenSdk()
    }

    /**
     * Initializes the Google Mobile Ads (GMA) Next-Gen SDK on a background thread
     * as required by Google's Next-Gen SDK documentation to avoid ANR or UI stalls.
     */
    private fun initializeGmaNextGenSdk() {
        applicationScope.launch {
            try {
                Log.d(TAG, "Initializing GMA Next-Gen SDK on background thread...")
                
                // Initialize MobileAds with programmatic configuration
                MobileAds.initialize(this@QuranApplication) { initializationStatus ->
                    Log.d(TAG, "GMA Next-Gen SDK initialized successfully: ${initializationStatus.adapterStatusMap}")
                }
            } catch (e: Exception) {
                // Ad failures or SDK init issues must never crash the application
                Log.e(TAG, "GMA Next-Gen SDK initialization failed gracefully: ${e.message}", e)
            }
        }
    }
}
