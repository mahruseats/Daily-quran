import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Check,
  Bookmark,
  Copy,
  BookOpen,
  SlidersHorizontal,
  X,
  Info,
  Search,
} from 'lucide-react';
import { SurahMeta, Ayah, AppSettings, Bookmark as BookmarkType, AppLanguage } from '../types';
import {
  fetchSurahAyahs,
  downloadSurahAudioForOffline,
  isSurahAudioCached,
  RECITERS,
} from '../utils/quranApi';
import { PRELOADED_SURAHS } from '../data/preloadedSurahs';
import { convertTransliterationToBangla } from '../utils/banglaPronunciation';

const SurahSearchModal = lazy(() =>
  import('./SurahSearchModal').then((m) => ({ default: m.SurahSearchModal }))
);

interface SurahDetailViewProps {
  surah: SurahMeta;
  initialAyah?: number;
  settings: AppSettings;
  bookmarks: BookmarkType[];
  onBack: () => void;
  onSelectSurah?: (surahNumber: number) => void;
  onPlayAyah: (surahNumber: number, ayahNumber: number) => void;
  currentlyPlayingSurah: number | null;
  currentlyPlayingAyah: number | null;
  isPlayingAudio: boolean;
  onAddBookmark: (bookmark: Omit<BookmarkType, 'id' | 'createdAt'>) => void;
  onRemoveBookmark: (surahNumber: number, ayahNumber: number) => void;
  onUpdateLastRead: (surahNumber: number, surahNameBangla: string, ayahNumber: number) => void;
  onAyahRead: (ayahCount: number) => void;
  onOpenSettings: () => void;
  onChangeQari?: (qariId: string) => void;
  onUpdateSettings?: (newSettings: Partial<AppSettings>) => void;
  language?: AppLanguage;
}

export const SurahDetailView: React.FC<SurahDetailViewProps> = ({
  surah,
  initialAyah,
  settings,
  bookmarks,
  onBack,
  onSelectSurah,
  onPlayAyah,
  currentlyPlayingSurah,
  currentlyPlayingAyah,
  isPlayingAudio,
  onAddBookmark,
  onRemoveBookmark,
  onUpdateLastRead,
  onAyahRead,
  onOpenSettings,
  onChangeQari,
  onUpdateSettings,
  language = 'bn',
}) => {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineCached, setIsOfflineCached] = useState(false);

  // Offline Audio Download State
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [audioCachedState, setAudioCachedState] = useState(false);

  // Tafsir Modal State
  const [activeTafsirAyah, setActiveTafsirAyah] = useState<Ayah | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [expandedTranslations, setExpandedTranslations] = useState<{ [ayahNum: number]: boolean }>({});
  const [showSurahSearchModal, setShowSurahSearchModal] = useState(false);

  const toggleExpandTranslation = (ayahNum: number) => {
    setExpandedTranslations((prev) => ({
      ...prev,
      [ayahNum]: !prev[ayahNum],
    }));
  };

  const ayahRefs = useRef<{ [ayahNum: number]: HTMLDivElement | null }>({});

  const isBangla = language === 'bn';

  const toBanglaDigits = (num: number | string): string => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map((c) => bnDigits[parseInt(c, 10)] ?? c).join('');
  };

  const formatDigits = (num: number | string): string => {
    return isBangla ? toBanglaDigits(num) : num.toString();
  };

  // Load Ayahs
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    setAudioCachedState(isSurahAudioCached(surah.number, settings.selectedQariId));

    fetchSurahAyahs(surah.number)
      .then((res) => {
        if (!isMounted) return;
        if (res.ayahs.length > 0) {
          setAyahs(res.ayahs);
          setIsOfflineCached(res.isOfflineCache);
          onAyahRead(Math.min(res.ayahs.length, 3)); // register reading progress
        } else if (res.error) {
          setError(res.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(
          isBangla
            ? 'আয়াতসমূহ লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
            : 'Error loading verses. Please check connection and try again.'
        );
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [surah.number, settings.selectedQariId]);

  // Jump to specific Ayah if passed
  useEffect(() => {
    if (!loading && initialAyah && ayahRefs.current[initialAyah]) {
      setTimeout(() => {
        ayahRefs.current[initialAyah]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [loading, initialAyah]);

  // Auto-scroll to currently playing Ayah with audio playback (always active)
  useEffect(() => {
    if (
      !isPlayingAudio ||
      currentlyPlayingSurah !== surah.number ||
      !currentlyPlayingAyah ||
      loading
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const targetEl =
        ayahRefs.current[currentlyPlayingAyah] ||
        document.getElementById(`ayah-card-${currentlyPlayingAyah}`);

      if (targetEl) {
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [
    currentlyPlayingAyah,
    currentlyPlayingSurah,
    isPlayingAudio,
    surah.number,
    loading,
  ]);

  // Download entire Surah audio for 100% offline usage
  const handleDownloadOfflineAudio = async () => {
    if (isDownloadingAudio || audioCachedState) return;
    setIsDownloadingAudio(true);
    setDownloadProgress(0);

    const res = await downloadSurahAudioForOffline(
      surah.number,
      surah.numberOfAyahs,
      settings.selectedQariId,
      (percent) => {
        setDownloadProgress(percent);
      }
    );

    setIsDownloadingAudio(false);
    if (res.success) {
      setAudioCachedState(true);
    } else if (res.error) {
      alert(res.error);
    }
  };

  const isAyahBookmarked = (ayahNum: number): boolean => {
    return bookmarks.some((b) => b.surahNumber === surah.number && b.ayahNumber === ayahNum);
  };

  const handleToggleBookmark = (ayah: Ayah) => {
    if (isAyahBookmarked(ayah.numberInSurah)) {
      onRemoveBookmark(surah.number, ayah.numberInSurah);
    } else {
      onAddBookmark({
        surahNumber: surah.number,
        surahNameBangla: isBangla ? surah.nameBangla : surah.nameEnglish,
        ayahNumber: ayah.numberInSurah,
        textArabic: ayah.textArabic,
        textBangla: isBangla ? ayah.textBanglaTranslation : (ayah.textEnglishTranslation || ayah.textBanglaTranslation),
        category: isBangla ? 'দৈনিক পাঠ' : 'Daily Reading',
      });
    }
  };

  const handleCopyAyah = (ayah: Ayah) => {
    const translit = isBangla
      ? (ayah.textBanglaPronunciation || convertTransliterationToBangla(ayah.textArabic))
      : (ayah.textEnglishPronunciation || ayah.textBanglaPronunciation || '');
    const translation = isBangla
      ? ayah.textBanglaTranslation
      : (ayah.textEnglishTranslation || ayah.textBanglaTranslation);

    const wbwFormatted = (ayah.words || [])
      .filter((w) => w.charType !== 'end')
      .map((w) => {
        const m = isBangla ? w.textBanglaMeaning : (w.textEnglishMeaning || w.textBanglaMeaning);
        const cleanM = (m || '').replace(/^[\("']+/g, '').replace(/[\)"']+$/g, '').trim();
        return cleanM ? `${w.textArabic} (${cleanM})` : w.textArabic;
      })
      .join(' ');

    const text = isBangla
      ? `${ayah.textArabic}\n\nশব্দার্থে অর্থ:\n${wbwFormatted || translation}\n\nউচ্চারণ: ${translit}\n\n— [সূরা ${surah.nameBangla}, আয়াত: ${ayah.numberInSurah}]`
      : `${ayah.textArabic}\n\nWord Meaning:\n${wbwFormatted || translation}\n\nTransliteration: ${translit}\n\n— [Surah ${surah.nameEnglish}, Verse: ${ayah.numberInSurah}]`;

    navigator.clipboard.writeText(text);
    setCopiedAyah(ayah.numberInSurah);
    setTimeout(() => setCopiedAyah(null), 2000);
  };

  const isSurahPlaying =
    currentlyPlayingSurah === surah.number && isPlayingAudio;

  const showBismillah = surah.number !== 1 && surah.number !== 9;

  const surahNameDisplay = isBangla ? surah.nameBangla : surah.nameEnglish;
  const revelationLabel = isBangla
    ? surah.revelationType
    : surah.revelationType === 'মাক্কী'
    ? 'Meccan'
    : 'Medinan';

  return (
    <div className="space-y-4 pb-32">
      {/* Top Header & Navigation */}
      <div className="sticky top-14 z-20 -mx-4 px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isBangla ? 'সূরা তালিকা' : 'Surah List'}</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {surahNameDisplay}
          </h2>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {formatDigits(surah.numberOfAyahs)} {isBangla ? 'আয়াত' : 'Verses'} • {revelationLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onSelectSurah && (
            <button
              id="btn-search-surah-top"
              onClick={() => setShowSurahSearchModal(true)}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 hover:bg-emerald-100 transition"
              title={isBangla ? 'অন্যান্য সূরা খুঁজুন' : 'Search Surahs Only'}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isBangla ? 'সূরা খুঁজুন' : 'Search Surah'}</span>
            </button>
          )}

          {onUpdateSettings && (
            <button
              id="btn-toggle-pronunciation-top"
              onClick={() => onUpdateSettings({ showPronunciation: !settings.showPronunciation })}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                settings.showPronunciation
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
              title={isBangla ? 'উচ্চারণ চালু/বন্ধ করুন' : 'Toggle Transliteration'}
            >
              <span>{isBangla ? 'উচ্চারণ' : 'Translit'}</span>
              <span className="text-[10px] px-1 rounded bg-white/70 dark:bg-slate-900/60 font-mono">
                {settings.showPronunciation ? (isBangla ? 'অন' : 'ON') : (isBangla ? 'অফ' : 'OFF')}
              </span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title={isBangla ? 'ফন্ট সাইজ ও তিলাওয়াতকারী পরিবর্তন' : 'Settings & Reciter'}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Surah Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-950 p-6 text-white text-center shadow-lg border border-emerald-700/40">
        <div className="relative z-10 max-w-md mx-auto">
          <span className="inline-block text-xs font-semibold text-amber-300 px-3 py-1 rounded-full bg-emerald-950/70 border border-amber-400/30 mb-2">
            {isBangla ? 'সূরা নং' : 'Surah No.'} {formatDigits(surah.number)} • {revelationLabel}
          </span>

          <h1 className="text-3xl font-bold tracking-wide mt-1">
            {surahNameDisplay}
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            &quot;{isBangla ? surah.meaningBangla : (surah.nameEnglish || surah.meaningBangla)}&quot; • ({isBangla ? surah.nameEnglish : surah.nameBangla})
          </p>

          <div className="mt-3 font-arabic text-3xl text-amber-300 font-bold tracking-wider">
            {surah.nameArabic}
          </div>

          {/* Action Bar inside Banner */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            {/* Play All Button */}
            <button
              id="btn-play-surah-audio"
              onClick={() => onPlayAyah(surah.number, 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold shadow-md transition active:scale-95"
            >
              {isSurahPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{isBangla ? 'তিলাওয়াত চলছে' : 'Playing Recitation'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isBangla ? 'সম্পূর্ণ তিলাওয়াত শুনুন' : 'Listen Full Recitation'}</span>
                </>
              )}
            </button>

            {/* Offline Audio Download */}
            <button
              id="btn-download-offline-audio"
              onClick={handleDownloadOfflineAudio}
              disabled={isDownloadingAudio || audioCachedState}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition ${
                audioCachedState
                  ? 'bg-emerald-700/60 border-emerald-500 text-emerald-100'
                  : 'bg-emerald-900/60 hover:bg-emerald-900 border-emerald-600/50 text-emerald-100'
              }`}
            >
              {audioCachedState ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>{isBangla ? 'অফলাইন অডিও সংরক্ষিত' : 'Audio Saved Offline'}</span>
                </>
              ) : isDownloadingAudio ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                  <span>{isBangla ? `ডাউনলোড হচ্ছে ${downloadProgress}%` : `Downloading ${downloadProgress}%`}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>{isBangla ? 'অফলাইন সেভ (MP3)' : 'Save Offline (MP3)'}</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Reciter Selector */}
          <div className="mt-4 pt-3 border-t border-emerald-700/40 flex items-center justify-center gap-2 text-xs">
            <span className="text-[11px] text-emerald-200/90 font-medium">
              {isBangla ? 'ক্বারী (Reciter):' : 'Reciter:'}
            </span>
            {onChangeQari ? (
              <select
                id="surah-banner-qari-select"
                value={settings.selectedQariId}
                onChange={(e) => onChangeQari(e.target.value)}
                className="bg-emerald-950/90 hover:bg-emerald-900 text-amber-300 font-semibold text-xs px-2.5 py-1 rounded-xl border border-emerald-600/50 hover:border-amber-400/50 transition cursor-pointer focus:outline-hidden"
              >
                {RECITERS.map((q) => (
                  <option key={q.id} value={q.id} className="bg-slate-900 text-white font-normal">
                    {isBangla ? q.nameBangla : q.nameEnglish}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-amber-300 font-semibold text-xs">
                {isBangla
                  ? RECITERS.find((q) => q.id === settings.selectedQariId)?.nameBangla || 'মিশারি রাশিদ'
                  : RECITERS.find((q) => q.id === settings.selectedQariId)?.nameEnglish || 'Mishary Rashid'}
              </span>
            )}
          </div>

          {/* Quick Word-by-Word, Pronunciation and Translation Toggles in Banner */}
          {onUpdateSettings && (
            <div className="mt-3 pt-2.5 border-t border-emerald-700/30 flex flex-wrap items-center justify-center gap-2 text-xs">
              <button
                id="banner-toggle-word-meaning"
                onClick={() => onUpdateSettings({ showWordMeaning: !(settings.showWordMeaning ?? true) })}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
                  (settings.showWordMeaning ?? true)
                    ? 'bg-amber-400/25 text-amber-300 border-amber-400/60 shadow-xs'
                    : 'bg-emerald-950/70 text-emerald-300/70 border-emerald-700/40 hover:text-emerald-200'
                }`}
                title={isBangla ? 'শব্দার্থে অর্থ প্রদর্শন পরিবর্তন করুন' : 'Toggle Word Meaning'}
              >
                <span>{isBangla ? 'শব্দার্থে অর্থ:' : 'Word Meaning:'}</span>
                <span className="font-bold text-amber-300">
                  {(settings.showWordMeaning ?? true) ? (isBangla ? 'চালু ✓' : 'ON ✓') : (isBangla ? 'বন্ধ ✕' : 'OFF ✕')}
                </span>
              </button>

              <button
                id="banner-toggle-pronunciation"
                onClick={() => onUpdateSettings({ showPronunciation: !settings.showPronunciation })}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
                  settings.showPronunciation
                    ? 'bg-amber-400/25 text-amber-300 border-amber-400/60 shadow-xs'
                    : 'bg-emerald-950/70 text-emerald-300/70 border-emerald-700/40 hover:text-emerald-200'
                }`}
                title={isBangla ? 'উচ্চারণ প্রদর্শন পরিবর্তন করুন' : 'Toggle Transliteration'}
              >
                <span>{isBangla ? 'উচ্চারণ:' : 'Transliteration:'}</span>
                <span className="font-bold text-amber-300">
                  {settings.showPronunciation ? (isBangla ? 'চালু ✓' : 'ON ✓') : (isBangla ? 'বন্ধ ✕' : 'OFF ✕')}
                </span>
              </button>

              <button
                id="banner-toggle-translation"
                onClick={() => onUpdateSettings({ showFullAyahTranslation: !settings.showFullAyahTranslation })}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
                  settings.showFullAyahTranslation
                    ? 'bg-amber-400/25 text-amber-300 border-amber-400/60 shadow-xs'
                    : 'bg-emerald-950/70 text-emerald-300/70 border-emerald-700/40 hover:text-emerald-200'
                }`}
                title={isBangla ? 'পূর্ণ আয়াতের ভাবার্থ প্রদর্শন পরিবর্তন করুন' : 'Toggle Full Verse Translation'}
              >
                <span>{isBangla ? 'পূর্ণ ভাবার্থ:' : 'Full Translation:'}</span>
                <span className="font-bold text-amber-300">
                  {settings.showFullAyahTranslation ? (isBangla ? 'চালু ✓' : 'ON ✓') : (isBangla ? 'ঐচ্ছিক' : 'Optional')}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Surah Tafsir Overview if available */}
      {PRELOADED_SURAHS[surah.number] && (
        <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 p-4 border border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">
              {isBangla ? 'সূরার ভূমিকা ও ফজিলত:' : 'Surah Introduction & Virtues:'}
            </span>
            {isBangla
              ? PRELOADED_SURAHS[surah.number].tafsirOverview
              : (PRELOADED_SURAHS[surah.number].tafsirOverviewEn || PRELOADED_SURAHS[surah.number].tafsirOverview)}
          </div>
        </div>
      )}

      {/* Bismillah Header */}
      {showBismillah && (
        <div className="py-4 text-center">
          <p className="font-arabic text-2xl md:text-3xl text-emerald-900 dark:text-emerald-300 font-bold tracking-widest">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isBangla
              ? 'পরম করুণাময় ও অসীম দয়ালু আল্লাহর নামে শুরু করছি'
              : 'In the name of Allah, the Entirely Merciful, the Especially Merciful'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isBangla
              ? `সূরা ${surah.nameBangla} এর আয়াত ও অর্থ লোড হচ্ছে...`
              : `Loading verses and translations for Surah ${surah.nameEnglish}...`}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/40">
          <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
          >
            {isBangla ? 'আবার চেষ্টা করুন' : 'Try Again'}
          </button>
        </div>
      )}

      {/* Ayahs Stream */}
      {!loading && (
        <div className="space-y-4">
          {ayahs.map((ayah) => {
            const isPlayingThisAyah =
              currentlyPlayingSurah === surah.number &&
              currentlyPlayingAyah === ayah.numberInSurah &&
              isPlayingAudio;

            const isBookmarked = isAyahBookmarked(ayah.numberInSurah);

            const transliterationText = isBangla
              ? (ayah.textBanglaPronunciation || convertTransliterationToBangla(ayah.textArabic))
              : (ayah.textEnglishPronunciation || ayah.textBanglaPronunciation || '');

            const translationText = isBangla
              ? ayah.textBanglaTranslation
              : (ayah.textEnglishTranslation || ayah.textBanglaTranslation);

            return (
              <div
                key={ayah.numberInSurah}
                ref={(el) => {
                  ayahRefs.current[ayah.numberInSurah] = el;
                }}
                id={`ayah-card-${ayah.numberInSurah}`}
                className={`rounded-2xl p-4 md:p-5 transition-all duration-300 border ${
                  isPlayingThisAyah
                    ? 'bg-emerald-50/95 dark:bg-emerald-950/60 border-emerald-500 shadow-lg ring-2 ring-emerald-500/60 scale-[1.008]'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Ayah Header Strip */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs flex items-center justify-center border border-emerald-300/40 dark:border-emerald-700/40">
                      {formatDigits(ayah.numberInSurah)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {surah.number}:{ayah.numberInSurah}
                    </span>
                    {ayah.sajdah && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-1.5 py-0.2 rounded font-semibold">
                        {isBangla ? 'সিজদাহ' : 'Sajdah'}
                      </span>
                    )}
                    {isPlayingThisAyah && (
                      <span className="text-[10px] bg-amber-400 text-emerald-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping" />
                        <span>{isBangla ? 'তিলাওয়াত চলছে...' : 'Now Playing...'}</span>
                      </span>
                    )}
                  </div>

                  {/* Actions for this Ayah */}
                  <div className="flex items-center gap-1">
                    {/* Play Ayah Audio */}
                    <button
                      onClick={() => onPlayAyah(surah.number, ayah.numberInSurah)}
                      className={`p-1.5 rounded-lg transition ${
                        isPlayingThisAyah
                          ? 'bg-amber-400 text-emerald-950'
                          : 'text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={
                        isPlayingThisAyah
                          ? (isBangla ? 'বিরতি' : 'Pause')
                          : (isBangla ? 'এই আয়াত শুনুন' : 'Play Ayah')
                      }
                    >
                      {isPlayingThisAyah ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>

                    {/* Tafsir Trigger */}
                    <button
                      onClick={() => setActiveTafsirAyah(ayah)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                      title={isBangla ? 'আয়াতের তাফসীর পড়ুন' : 'Read Ayah Tafsir'}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isBangla ? 'তাফসীর' : 'Tafsir'}</span>
                    </button>

                    {/* Bookmark Toggle */}
                    <button
                      onClick={() => handleToggleBookmark(ayah)}
                      className={`p-1.5 rounded-lg transition ${
                        isBookmarked
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                      title={
                        isBookmarked
                          ? (isBangla ? 'বুকমার্ক থেকে মুছুন' : 'Remove Bookmark')
                          : (isBangla ? 'বুকমার্ক করুন' : 'Bookmark Ayah')
                      }
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isBookmarked ? 'fill-current text-amber-500' : ''}`}
                      />
                    </button>

                    {/* Copy Text */}
                    <button
                      onClick={() => handleCopyAyah(ayah)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title={isBangla ? 'আয়াত কপি করুন' : 'Copy Ayah'}
                    >
                      {copiedAyah === ayah.numberInSurah ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Word-by-Word Quran Words with Meaning Under Each Word in Brackets */}
                {(() => {
                  const wordsList = (ayah.words && ayah.words.length > 0)
                    ? ayah.words
                    : [
                        ...ayah.textArabic.split(/\s+/).filter(Boolean).map((word, wIdx) => ({
                          position: wIdx + 1,
                          textArabic: word,
                          textBanglaMeaning: '',
                          textEnglishMeaning: '',
                          charType: 'word',
                        })),
                        {
                          position: 999,
                          textArabic: `${ayah.numberInSurah}`,
                          textBanglaMeaning: `(${ayah.numberInSurah})`,
                          textEnglishMeaning: `(${ayah.numberInSurah})`,
                          charType: 'end',
                        },
                      ];

                  const showWbwMeaning = settings.showWordMeaning ?? true;

                  return (
                    <div
                      className="flex flex-wrap items-end justify-start gap-x-2.5 sm:gap-x-4 gap-y-4 my-3.5 select-text"
                      dir="rtl"
                    >
                      {wordsList.map((w, idx) => {
                        const isEndMarker =
                          w.charType === 'end' ||
                          (idx === wordsList.length - 1 &&
                            (/^\d+$/.test(w.textArabic) ||
                              w.textArabic === '١' ||
                              w.textArabic === '٢' ||
                              w.textArabic === '٣' ||
                              w.textArabic === '٤' ||
                              w.textArabic === '٥' ||
                              w.textArabic === '٦' ||
                              w.textArabic === '٧'));

                        if (isEndMarker) {
                          return (
                            <div
                              key={idx}
                              className="inline-flex flex-col items-center justify-center self-center px-1.5 py-1 text-amber-600 dark:text-amber-400 select-none"
                              title={isBangla ? `আয়াত ${formatDigits(ayah.numberInSurah)} সমাপ্তি` : `Ayah ${ayah.numberInSurah} end`}
                            >
                              <span className="text-2xl sm:text-3xl font-serif leading-none">
                                ۝{formatDigits(ayah.numberInSurah)}
                              </span>
                              <span
                                dir="ltr"
                                className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono font-bold"
                              >
                                ({formatDigits(ayah.numberInSurah)})
                              </span>
                            </div>
                          );
                        }

                        const rawMeaning = isBangla
                          ? (w.textBanglaMeaning || '')
                          : (w.textEnglishMeaning || w.textBanglaMeaning || '');

                        const cleanMeaning = rawMeaning
                          .replace(/^[\("']+/g, '')
                          .replace(/[\)"']+$/g, '')
                          .trim();

                        return (
                          <div
                            key={idx}
                            className="inline-flex flex-col items-center text-center px-1.5 py-1.5 rounded-xl hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 transition group border border-transparent hover:border-emerald-200/50 dark:hover:border-emerald-800/40"
                          >
                            {/* Arabic Word */}
                            <span
                              className="font-arabic font-bold text-slate-900 dark:text-emerald-100 tracking-normal leading-relaxed group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors"
                              style={{ fontSize: `${settings.arabicFontSize}px` }}
                            >
                              {w.textArabic}
                            </span>

                            {/* Meaning Placed Directly Under The Word In Brackets */}
                            {showWbwMeaning && cleanMeaning ? (
                              <span
                                dir="ltr"
                                className="text-emerald-800 dark:text-emerald-300 font-semibold leading-tight mt-1 px-1.5 py-0.5 rounded-md bg-emerald-50/90 dark:bg-emerald-950/60 text-center tracking-tight border border-emerald-200/50 dark:border-emerald-800/40 shadow-2xs"
                                style={{
                                  fontSize: `${Math.max(12, Math.round(settings.banglaFontSize * 0.82))}px`,
                                }}
                              >
                                ({cleanMeaning})
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Transliteration (উচ্চারণ) */}
                {settings.showPronunciation && (
                  <div
                    className="text-slate-900 dark:text-emerald-100 my-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 select-text"
                    style={{ fontSize: `${Math.max(14, settings.banglaFontSize)}px`, lineHeight: 1.7 }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white dark:bg-emerald-500 shrink-0 mt-0.5 shadow-2xs">
                        {isBangla ? 'উচ্চারণ' : 'Transliteration'}
                      </span>
                      <p className="font-medium text-slate-900 dark:text-emerald-50 tracking-normal">
                        {transliterationText}
                      </p>
                    </div>
                  </div>
                )}

                {/* Complete Verse Meaning: Collapsible / Expandable instead of putting it separately */}
                {(settings.showFullAyahTranslation || expandedTranslations[ayah.numberInSurah]) ? (
                  <div
                    className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal select-text mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-800/30 p-3 rounded-xl"
                    style={{ fontSize: `${settings.banglaFontSize}px` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-emerald-800 dark:text-emerald-400">
                        {isBangla ? 'পূর্ণ আয়াতের ভাবার্থ:' : 'Full Verse Translation:'}
                      </span>
                      <button
                        onClick={() => toggleExpandTranslation(ayah.numberInSurah)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                      >
                        {isBangla ? 'লুকান ▲' : 'Hide ▲'}
                      </button>
                    </div>
                    <p>{translationText}</p>
                  </div>
                ) : (
                  <div className="mt-1 flex justify-start">
                    <button
                      onClick={() => toggleExpandTranslation(ayah.numberInSurah)}
                      className="text-[11px] font-medium text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition"
                    >
                      <span>{isBangla ? 'সম্পূর্ণ আয়াতের ভাবার্থ দেখুন ▾' : 'View full verse translation ▾'}</span>
                    </button>
                  </div>
                )}

                {/* Mark Last Read Trigger */}
                <div className="mt-3 pt-2 flex justify-end">
                  <button
                    onClick={() =>
                      onUpdateLastRead(surah.number, surah.nameBangla, ayah.numberInSurah)
                    }
                    className="text-[11px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1"
                  >
                    {isBangla ? 'এখানে পড়া শেষ করেছি (Mark Last Read)' : 'Mark as Last Read'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tafsir Modal / Drawer */}
      {activeTafsirAyah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 md:p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base">
                  {isBangla ? 'তাফসীর ও ব্যাখ্যা' : 'Tafsir & Commentary'} — {isBangla ? 'আয়াত' : 'Ayah'}{' '}
                  {formatDigits(activeTafsirAyah.numberInSurah)}
                </h3>
              </div>
              <button
                onClick={() => setActiveTafsirAyah(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                <p className="font-arabic text-xl text-emerald-900 dark:text-emerald-200 mb-2 leading-loose">
                  {activeTafsirAyah.textArabic}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  <strong>{isBangla ? 'অনুবাদ:' : 'Translation:'}</strong>{' '}
                  {isBangla
                    ? activeTafsirAyah.textBanglaTranslation
                    : (activeTafsirAyah.textEnglishTranslation || activeTafsirAyah.textBanglaTranslation)}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm mb-1.5">
                  {isBangla
                    ? 'তাফসীরুল কুরআন ও সারমর্ম (ইবনে কাসীর ও আহসানুল বায়ান অবলম্বনে):'
                    : 'Tafsir & Exposition (Based on Ibn Kathir & Authentic Scholars):'}
                </h4>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs md:text-sm space-y-2">
                  <p>
                    {isBangla
                      ? (activeTafsirAyah.tafsirBangla ||
                          'এই আয়াতে মহান আল্লাহ বান্দার ঈমান ও তাকওয়া বৃদ্ধির এক অনুপম দিকনির্দেশনা প্রদান করেছেন। আয়াতটিতে তাওহীদ ও আল্লাহর সার্বভৌম ক্ষমতার প্রতি একনিষ্ঠ থাকার আহ্বান জানানো হয়েছে।')
                      : (activeTafsirAyah.tafsirEnglish ||
                          activeTafsirAyah.tafsirBangla ||
                          'This verse highlights foundational guidance for strengthening faith, devotion, and piety toward Allah Almighty, calling the servant to sincerity in worship and reflection.')}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg">
                    💡 <strong>{isBangla ? 'শিক্ষা ও আমল:' : 'Core Lesson & Action:'}</strong>{' '}
                    {isBangla
                      ? 'কুরআন তিলাওয়াতকালে এই আয়াতের মর্মার্থ অনুধাবন করে নিজের চরিত্রে তাকওয়া, সত্যবাদিতা এবং আল্লাহর রহমতের ওপর অবিচল আস্থা স্থাপন করুন।'
                      : 'While reciting the Holy Quran, contemplate the profound meanings of this verse to instill piety, integrity, and complete reliance upon Allah\'s boundless mercy.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveTafsirAyah(null)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow"
              >
                {isBangla ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Surah Search Modal */}
      {onSelectSurah && showSurahSearchModal && (
        <Suspense fallback={null}>
          <SurahSearchModal
            isOpen={showSurahSearchModal}
            onClose={() => setShowSurahSearchModal(false)}
            onSelectSurah={(surahNum) => {
              onSelectSurah(surahNum);
              setShowSurahSearchModal(false);
            }}
            language={language}
          />
        </Suspense>
      )}
    </div>
  );
};
