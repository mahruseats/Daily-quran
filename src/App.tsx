import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { SurahListView } from './components/SurahListView';
import { SurahDetailView } from './components/SurahDetailView';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { ThinSalahTopBar } from './components/ThinSalahTopBar';
import { AdMobBanner } from './components/AdMobBanner';
import { AdMobInterstitialModal } from './components/AdMobInterstitialModal';
import { preloadInterstitial, showExitInterstitial } from './services/admobService';
import { SURAH_LIST } from './data/surahList';
import { AppSettings, Bookmark, DailyGoalProgress, LastRead, SurahMeta, AppLanguage } from './types';
import { getAyahAudioUrl } from './utils/quranApi';

// Lazy-load secondary views to reduce initial bundle size without visual changes
const RabbanaDuasView = lazy(() =>
  import('./components/RabbanaDuasView').then((m) => ({ default: m.RabbanaDuasView }))
);
const PrayerTimesView = lazy(() =>
  import('./components/PrayerTimesView').then((m) => ({ default: m.PrayerTimesView }))
);
const BookmarksAndTrackerView = lazy(() =>
  import('./components/BookmarksAndTrackerView').then((m) => ({ default: m.BookmarksAndTrackerView }))
);
const SettingsView = lazy(() =>
  import('./components/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const DailyTaskModal = lazy(() =>
  import('./components/DailyTaskModal').then((m) => ({ default: m.DailyTaskModal }))
);
const SurahSearchModal = lazy(() =>
  import('./components/SurahSearchModal').then((m) => ({ default: m.SurahSearchModal }))
);

export const App: React.FC = () => {
  // Theme state: dark / light mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('quran_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('quran_theme', 'dark');
      const metaThemeList = document.querySelectorAll('meta[name="theme-color"]');
      metaThemeList.forEach((meta) => {
        meta.setAttribute('content', '#020617');
      });
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('quran_theme', 'light');
      const metaThemeList = document.querySelectorAll('meta[name="theme-color"]');
      metaThemeList.forEach((meta) => {
        meta.setAttribute('content', '#064e3b');
      });
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Language state (Bangla or English)
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('quran_app_language');
    if (saved === 'en' || saved === 'bn') return saved;
    return 'bn';
  });

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('surahs');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(null);
  const [jumpToAyahNumber, setJumpToAyahNumber] = useState<number | undefined>(undefined);

  // Modal for Daily Reading Tasks & Goals
  const [showDailyTaskModal, setShowDailyTaskModal] = useState<boolean>(false);
  const [showSurahSearchModal, setShowSurahSearchModal] = useState<boolean>(false);

  // Online / Offline tracking
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Google Mobile Ads: Preload Interstitial Ad in background on app start
  useEffect(() => {
    preloadInterstitial().catch(() => {});
  }, []);

  // App settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('quran_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      arabicFontSize: 28,
      banglaFontSize: 15,
      showPronunciation: true,
      showTranslation: true,
      selectedQariId: 'alafasy',
      district: 'Dhaka',
      hanafiAsr: true,
      autoPlayNext: true,
      dailyAyahTarget: 10,
    };
  });

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('quran_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateLanguage = (newLang: AppLanguage) => {
    setLanguage(newLang);
    localStorage.setItem('quran_app_language', newLang);
    handleUpdateSettings({ language: newLang });
  };

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('quran_bookmarks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default helpful starter bookmarks
    return [
      {
        id: 'bm_1',
        surahNumber: 1,
        surahNameBangla: 'আল-ফাতিহা',
        ayahNumber: 1,
        textArabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        textBangla: 'পরম করুণাময় ও অসীম দয়ালু আল্লাহর নামে শুরু করছি',
        category: 'দৈনিক পাঠ',
        createdAt: Date.now(),
      },
      {
        id: 'bm_2',
        surahNumber: 2,
        surahNameBangla: 'আল-বাক্বারাহ',
        ayahNumber: 255,
        textArabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
        textBangla: 'আল্লাহ, তিনি ছাড়া কোনো সত্য উপাস্য নেই; তিনি চিরঞ্জীব ও সর্বসত্তার ধারক। (আয়াতুল কুরসী)',
        category: 'মুখস্থ',
        createdAt: Date.now(),
      },
    ];
  });

  const handleAddBookmark = (newBm: Omit<Bookmark, 'id' | 'createdAt'>) => {
    const item: Bookmark = {
      ...newBm,
      id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
    };
    const updated = [item, ...bookmarks];
    setBookmarks(updated);
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
  };

  const handleRemoveBookmark = (surahNumber: number, ayahNumber: number) => {
    const updated = bookmarks.filter(
      (b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
    );
    setBookmarks(updated);
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
  };

  // Last Read Position state
  const [lastRead, setLastRead] = useState<LastRead | null>(() => {
    const saved = localStorage.getItem('quran_last_read');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      surahNumber: 1,
      surahNameBangla: 'আল-ফাতিহা',
      ayahNumber: 1,
      timestamp: Date.now(),
    };
  });

  const handleUpdateLastRead = (surahNumber: number, surahNameBangla: string, ayahNumber: number) => {
    const record: LastRead = {
      surahNumber,
      surahNameBangla,
      ayahNumber,
      timestamp: Date.now(),
    };
    setLastRead(record);
    localStorage.setItem('quran_last_read', JSON.stringify(record));
  };

  // Daily Reading Goal & Streak state
  const [dailyGoal, setDailyGoal] = useState<DailyGoalProgress>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('quran_daily_goal');
    if (saved) {
      try {
        const parsed: DailyGoalProgress = JSON.parse(saved);
        // Check if day changed
        if (parsed.lastActiveDate !== todayStr) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          // If last active was yesterday, streak continues; otherwise resets to 1
          const isConsecutive = parsed.lastActiveDate === yesterdayStr;
          const newStreak = isConsecutive ? parsed.currentStreak + 1 : 1;

          return {
            ...parsed,
            currentStreak: newStreak,
            readAyahsToday: 0,
            lastReadDate: todayStr,
            lastActiveDate: todayStr,
          };
        }
        return parsed;
      } catch (e) {}
    }
    return {
      targetAyahs: 10,
      readAyahsToday: 0,
      currentStreak: 1,
      totalAyahsRead: 0,
      lastReadDate: todayStr,
      lastActiveDate: todayStr,
      readingHistory: {},
      completedSurahs: [],
    };
  });

  const handleAyahRead = (count = 1) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setDailyGoal((prev) => {
      const todayCount = (prev.readAyahsToday || 0) + count;
      const totalCount = (prev.totalAyahsRead || 0) + count;
      const history = {
        ...prev.readingHistory,
        [todayStr]: todayCount,
      };

      const updated: DailyGoalProgress = {
        ...prev,
        readAyahsToday: todayCount,
        totalAyahsRead: totalCount,
        lastReadDate: todayStr,
        lastActiveDate: todayStr,
        readingHistory: history,
      };
      localStorage.setItem('quran_daily_goal', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateTargetAyahs = (target: number) => {
    setDailyGoal((prev) => {
      const updated = { ...prev, targetAyahs: target };
      localStorage.setItem('quran_daily_goal', JSON.stringify(updated));
      return updated;
    });
  };

  // Global Audio Player state
  const [activeAudio, setActiveAudio] = useState<{
    surahNumber: number;
    surahNameBangla: string;
    ayahNumber: number;
    totalAyahs: number;
    audioUrl: string;
    isPlaying: boolean;
  } | null>(null);

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const handlePlaySurahAyah = (surahNumber: number, ayahNumber: number) => {
    const surah = SURAH_LIST.find((s) => s.number === surahNumber);
    if (!surah) return;

    // If already playing this exact ayah, toggle play/pause
    if (
      activeAudio &&
      activeAudio.surahNumber === surahNumber &&
      activeAudio.ayahNumber === ayahNumber
    ) {
      setActiveAudio((prev) => (prev ? { ...prev, isPlaying: !prev.isPlaying } : null));
      return;
    }

    const audioUrl = getAyahAudioUrl(surahNumber, ayahNumber, settings.selectedQariId);

    setActiveAudio({
      surahNumber,
      surahNameBangla: surah.nameBangla,
      ayahNumber,
      totalAyahs: surah.numberOfAyahs,
      audioUrl,
      isPlaying: true,
    });

    handleUpdateLastRead(surahNumber, surah.nameBangla, ayahNumber);
    handleAyahRead(1);
  };

  const handleChangeQari = (qariId: string) => {
    handleUpdateSettings({ selectedQariId: qariId });
    if (activeAudio && activeAudio.surahNumber > 0) {
      const newUrl = getAyahAudioUrl(activeAudio.surahNumber, activeAudio.ayahNumber, qariId);
      setActiveAudio((prev) => (prev ? { ...prev, audioUrl: newUrl } : null));
    }
  };

  const handlePlayDirectUrl = (url: string, title: string, subtitle: string) => {
    setActiveAudio({
      surahNumber: 0,
      surahNameBangla: title,
      ayahNumber: 1,
      totalAyahs: 1,
      audioUrl: url,
      isPlaying: true,
    });
  };

  const handleNextAyah = () => {
    if (!activeAudio || activeAudio.surahNumber === 0) return;
    if (activeAudio.ayahNumber < activeAudio.totalAyahs) {
      handlePlaySurahAyah(activeAudio.surahNumber, activeAudio.ayahNumber + 1);
    }
  };

  const handlePrevAyah = () => {
    if (!activeAudio || activeAudio.surahNumber === 0) return;
    if (activeAudio.ayahNumber > 1) {
      handlePlaySurahAyah(activeAudio.surahNumber, activeAudio.ayahNumber - 1);
    }
  };

  // Android Back Gesture & Hardware Back Button Support (History API)
  useEffect(() => {
    const handlePopState = () => {
      // 1. Close open modal if any
      if (showDailyTaskModal) {
        setShowDailyTaskModal(false);
        return;
      }
      // 2. Return from Surah Detail to Surah List (Exiting Quran)
      if (selectedSurahNumber !== null) {
        showExitInterstitial('quran', () => {
          setSelectedSurahNumber(null);
          setJumpToAyahNumber(undefined);
        });
        return;
      }
      // 3. Return from other tabs to primary Surahs tab (Exiting Duas or Salah)
      if (currentTab !== 'surahs') {
        const source = currentTab === 'duas' ? 'duas' : currentTab === 'prayer' ? 'salah' : 'quran';
        showExitInterstitial(source, () => {
          setCurrentTab('surahs');
        });
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showDailyTaskModal, selectedSurahNumber, currentTab]);

  const handleSelectSurah = (surahNumber: number, jumpToAyah?: number) => {
    try {
      window.history.pushState({ view: 'surah', surahNumber }, '');
    } catch (e) {}
    setSelectedSurahNumber(surahNumber);
    setJumpToAyahNumber(jumpToAyah);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const scroller = document.getElementById('main-content-scroll');
    if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromSurah = () => {
    showExitInterstitial('quran', () => {
      if (window.history.state?.view === 'surah') {
        window.history.back();
      } else {
        setSelectedSurahNumber(null);
        setJumpToAyahNumber(undefined);
      }
    });
  };

  const doSelectTab = (tab: NavTab) => {
    if (currentTab !== tab || selectedSurahNumber !== null) {
      try {
        window.history.pushState({ view: 'tab', tab }, '');
      } catch (e) {}
    }
    setSelectedSurahNumber(null);
    setJumpToAyahNumber(undefined);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTab = (tab: NavTab) => {
    // Exiting Quran reading to tab
    if (selectedSurahNumber !== null) {
      showExitInterstitial('quran', () => doSelectTab(tab));
      return;
    }
    // Exiting Duas
    if (currentTab === 'duas' && tab !== 'duas') {
      showExitInterstitial('duas', () => doSelectTab(tab));
      return;
    }
    // Exiting Salah / Prayer Times
    if (currentTab === 'prayer' && tab !== 'prayer') {
      showExitInterstitial('salah', () => doSelectTab(tab));
      return;
    }
    doSelectTab(tab);
  };

  const handleOpenTasks = () => {
    try {
      window.history.pushState({ view: 'modal_tasks' }, '');
    } catch (e) {}
    setShowDailyTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowDailyTaskModal(false);
  };

  const selectedSurahMeta: SurahMeta | undefined = selectedSurahNumber
    ? SURAH_LIST.find((s) => s.number === selectedSurahNumber)
    : undefined;

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top App Header (The green box) with the thin Salah times line directly underneath */}
      <header className="sticky top-0 z-30 shadow-xs">
        <Navbar
          onOpenSettings={() => handleSelectTab('settings')}
          onOpenSurahSearch={() => setShowSurahSearchModal(true)}
          onOpenPrayerTimes={() => handleSelectTab('prayer')}
          onOpenDailyTasks={handleOpenTasks}
          streakCount={dailyGoal.currentStreak}
          isOnline={isOnline}
          language={language}
          onToggleLanguage={handleUpdateLanguage}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
        {/* Thin single line prayer times strip right under the green navbar with wide dark mode toggle beside location changer and Bangla/English toggle */}
        <ThinSalahTopBar
          selectedDistrict={settings.district || 'Dhaka'}
          onSelectDistrict={(name) => handleUpdateSettings({ district: name })}
          language={language}
          onToggleLanguage={handleUpdateLanguage}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
        {/* Navigation Bar placed directly under Salah times */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          bookmarkCount={bookmarks.length}
          language={language}
        />
      </header>

      {/* Main View Area */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-4 pb-28 sm:pb-32">
          {/* If user clicked a specific Surah, show SurahDetailView */}
          {selectedSurahMeta ? (
            <SurahDetailView
              surah={selectedSurahMeta}
              initialAyah={jumpToAyahNumber}
              settings={settings}
              bookmarks={bookmarks}
              onBack={handleBackFromSurah}
              onSelectSurah={handleSelectSurah}
              onPlayAyah={handlePlaySurahAyah}
              currentlyPlayingSurah={activeAudio?.surahNumber ?? null}
              currentlyPlayingAyah={activeAudio?.ayahNumber ?? null}
              isPlayingAudio={activeAudio?.isPlaying ?? false}
              onAddBookmark={handleAddBookmark}
              onRemoveBookmark={handleRemoveBookmark}
              onUpdateLastRead={handleUpdateLastRead}
              onAyahRead={handleAyahRead}
              onOpenSettings={() => handleSelectTab('settings')}
              onChangeQari={handleChangeQari}
              onUpdateSettings={handleUpdateSettings}
              language={language}
            />
          ) : (
            /* Bottom Nav Driven Views */
            <>
              {currentTab === 'surahs' && (
                <SurahListView
                  onSelectSurah={handleSelectSurah}
                  lastRead={lastRead}
                  dailyGoal={dailyGoal}
                  onOpenPrayerTimes={() => handleSelectTab('prayer')}
                  onOpenTaskModal={handleOpenTasks}
                  selectedDistrict={settings.district}
                  onSelectDistrict={(district) => handleUpdateSettings({ district })}
                  language={language}
                  onChangeLanguage={handleUpdateLanguage}
                  onUpdateTargetAyahs={handleUpdateTargetAyahs}
                />
              )}

              {currentTab === 'duas' && (
                <Suspense fallback={null}>
                  <RabbanaDuasView
                    bookmarks={bookmarks}
                    onAddBookmark={handleAddBookmark}
                    onRemoveBookmark={handleRemoveBookmark}
                    onPlayAudioUrl={handlePlayDirectUrl}
                    playingAudioUrl={activeAudio?.audioUrl ?? null}
                    isPlayingAudio={activeAudio?.isPlaying ?? false}
                    language={language}
                  />
                </Suspense>
              )}

              {currentTab === 'prayer' && (
                <Suspense fallback={null}>
                  <PrayerTimesView
                    selectedDistrict={settings.district || 'Dhaka'}
                    onSelectDistrict={(name) => handleUpdateSettings({ district: name })}
                    language={language}
                    darkMode={darkMode}
                    onToggleDarkMode={handleToggleDarkMode}
                  />
                </Suspense>
              )}

              {currentTab === 'tracker' && (
                <Suspense fallback={null}>
                  <BookmarksAndTrackerView
                    bookmarks={bookmarks}
                    onRemoveBookmark={handleRemoveBookmark}
                    onSelectSurah={handleSelectSurah}
                    dailyGoal={dailyGoal}
                    onUpdateTargetAyahs={handleUpdateTargetAyahs}
                    lastRead={lastRead}
                    language={language}
                  />
                </Suspense>
              )}

              {currentTab === 'settings' && (
                <Suspense fallback={null}>
                  <SettingsView
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    language={language}
                    onChangeLanguage={handleUpdateLanguage}
                  />
                </Suspense>
              )}
            </>
          )}
      </main>

      {/* Global Persistent Audio Player */}
      {activeAudio && (
        <AudioPlayerBar
          surahNumber={activeAudio.surahNumber}
          surahNameBangla={activeAudio.surahNameBangla}
          surahNameEnglish={SURAH_LIST.find((s) => s.number === activeAudio.surahNumber)?.nameEnglish}
          currentAyahNumber={activeAudio.ayahNumber}
          totalAyahs={activeAudio.totalAyahs}
          audioUrl={activeAudio.audioUrl}
          isPlaying={activeAudio.isPlaying}
          onTogglePlay={() =>
            setActiveAudio((prev) => (prev ? { ...prev, isPlaying: !prev.isPlaying } : null))
          }
          onNextAyah={handleNextAyah}
          onPrevAyah={handlePrevAyah}
          onClose={() => setActiveAudio(null)}
          selectedQariId={settings.selectedQariId}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={setPlaybackSpeed}
          onChangeQari={handleChangeQari}
          language={language}
        />
      )}

      {/* Global Modal for Daily Tasks */}
      {showDailyTaskModal && (
        <Suspense fallback={null}>
          <DailyTaskModal
            isOpen={showDailyTaskModal}
            onClose={handleCloseTaskModal}
            lastRead={lastRead}
            dailyGoal={dailyGoal}
            onSelectSurah={handleSelectSurah}
            onUpdateTargetAyahs={handleUpdateTargetAyahs}
            language={language}
          />
        </Suspense>
      )}

      {/* Global Surah Search Modal */}
      {showSurahSearchModal && (
        <Suspense fallback={null}>
          <SurahSearchModal
            isOpen={showSurahSearchModal}
            onClose={() => setShowSurahSearchModal(false)}
            onSelectSurah={handleSelectSurah}
            language={language}
          />
        </Suspense>
      )}

      {/* Google Mobile Ads: Fixed AdMob Banner (Main Dashboard & While Reading) */}
      <AdMobBanner language={language} />

      {/* Google Mobile Ads: Interstitial Ad Overlay (On Exiting Quran, Duas, or Salah) */}
      <AdMobInterstitialModal language={language} />
    </div>
  );
};

export default App;
