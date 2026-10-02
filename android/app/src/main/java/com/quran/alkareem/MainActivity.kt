package com.quran.alkareem

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import com.google.android.libraries.ads.mobile.sdk.banner.AdSize
import com.google.android.libraries.ads.mobile.sdk.banner.AdView
import com.google.android.libraries.ads.mobile.sdk.common.AdError
import com.google.android.libraries.ads.mobile.sdk.common.AdLoadCallback
import com.google.android.libraries.ads.mobile.sdk.common.AdRequest
import com.google.android.libraries.ads.mobile.sdk.common.FullScreenContentCallback
import com.google.android.libraries.ads.mobile.sdk.common.LoadAdError
import com.google.android.libraries.ads.mobile.sdk.interstitial.InterstitialAd

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivityAdMob"
        private const val BANNER_AD_UNIT_ID = QuranApplication.BANNER_TEST_AD_UNIT_ID
        private const val INTERSTITIAL_AD_UNIT_ID = QuranApplication.INTERSTITIAL_TEST_AD_UNIT_ID
        private const val MIN_INTERSTITIAL_COOLDOWN_MS = 0L
    }

    private var bannerAdView: AdView? = null
    private var interstitialAd: InterstitialAd? = null
    private var isInterstitialLoading = false
    private var lastInterstitialTimeMs = 0L
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        setupWebView()
        setupBannerAd()
        loadInterstitialAd()
    }

    /**
     * Set up WebView to render the Quran application.
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView = findViewById(R.id.app_web_view)
        webView?.let { wv ->
            wv.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
            }
            // Bridge enabling Web UI to coordinate with native AdMob
            wv.addJavascriptInterface(WebAppInterface(), "AndroidAdMob")
            wv.webViewClient = WebViewClient()
            wv.loadUrl("file:///android_asset/dist/index.html")
        }
    }

    /**
     * Loads the GMA Next-Gen Banner Ad positioned near the bottom of the screen.
     * Uses test ad unit ID: ca-app-pub-3940256099942544/9214589741
     */
    private fun setupBannerAd() {
        try {
            bannerAdView = findViewById(R.id.admob_banner_view)
            bannerAdView?.let { adView ->
                adView.adUnitId = BANNER_AD_UNIT_ID
                adView.setAdSize(AdSize.BANNER)

                val adRequest = AdRequest.Builder().build()
                adView.loadAd(adRequest, object : AdLoadCallback<AdView> {
                    override fun onAdLoaded(ad: AdView) {
                        Log.d(TAG, "GMA Next-Gen Banner Ad loaded successfully")
                        adView.visibility = View.VISIBLE
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        Log.w(TAG, "GMA Next-Gen Banner Ad failed to load: ${error.message}")
                        // Failure must never break the layout or cover content
                        adView.visibility = View.GONE
                    }
                })
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error configuring banner ad: ${e.message}", e)
        }
    }

    /**
     * Loads the GMA Next-Gen Interstitial Ad in the background.
     * Uses test ad unit ID: ca-app-pub-3940256099942544/1033173712
     */
    private fun loadInterstitialAd() {
        if (isInterstitialLoading || interstitialAd != null) return

        isInterstitialLoading = true
        val adRequest = AdRequest.Builder().build()

        try {
            InterstitialAd.load(
                this,
                INTERSTITIAL_AD_UNIT_ID,
                adRequest,
                object : AdLoadCallback<InterstitialAd> {
                    override fun onAdLoaded(ad: InterstitialAd) {
                        Log.d(TAG, "GMA Next-Gen Interstitial Ad loaded successfully")
                        interstitialAd = ad
                        isInterstitialLoading = false
                        setupInterstitialCallbacks(ad)
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        Log.w(TAG, "GMA Next-Gen Interstitial Ad failed to load: ${error.message}")
                        interstitialAd = null
                        isInterstitialLoading = false
                    }
                }
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error initiating interstitial ad load: ${e.message}", e)
            isInterstitialLoading = false
        }
    }

    private fun setupInterstitialCallbacks(ad: InterstitialAd) {
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                Log.d(TAG, "Interstitial ad dismissed")
                interstitialAd = null
                // Preload next interstitial for subsequent natural transitions
                loadInterstitialAd()
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                Log.w(TAG, "Interstitial ad failed to show: ${error.message}")
                interstitialAd = null
                loadInterstitialAd()
            }

            override fun onAdShowedFullScreenContent() {
                Log.d(TAG, "Interstitial ad showing")
                lastInterstitialTimeMs = System.currentTimeMillis()
            }
        }
    }

    /**
     * Displays the Interstitial Ad at an appropriate natural transition point
     * (e.g., returning from Surah reading back to list), respecting cooldown limits.
     * If not ready or in cooldown, the app continues normally without blocking.
     */
    fun showInterstitialAtTransition(): Boolean {
        val now = System.currentTimeMillis()
        if (now - lastInterstitialTimeMs < MIN_INTERSTITIAL_COOLDOWN_MS) {
            return false
        }

        interstitialAd?.let { ad ->
            ad.show(this)
            return true
        } ?: run {
            // Not ready yet; preload for next opportunity
            loadInterstitialAd()
            return false
        }
    }

    /**
     * Native JavaScript Interface exposed to the web application.
     */
    inner class WebAppInterface {
        @JavascriptInterface
        fun initialize(appId: String) {
            Log.d(TAG, "JS requested GMA Next-Gen init with App ID: $appId")
        }

        @JavascriptInterface
        fun showInterstitial(): Boolean {
            var shown = false
            runOnUiThread {
                shown = showInterstitialAtTransition()
            }
            return shown
        }
    }

    override fun onDestroy() {
        bannerAdView?.destroy()
        super.onDestroy()
    }
}
