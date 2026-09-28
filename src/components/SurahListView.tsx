import React, { useState, useMemo, lazy, Suspense } from 'react';
import {
  Search,
  BookOpen,
  Clock,
  ChevronRight,
  CheckCircle2,
  Flame,
  Sparkles,
} from 'lucide-react';
import { SurahMeta, LastRead, DailyGoalProgress, AppLanguage } from '../types';
import { SURAH_LIST } from '../data/surahList';
import { searchSurahsWithClosest } from '../utils/surahSearch';

const DailyTaskModal = lazy(() =>
  import('./DailyTaskModal').then((m) => ({ default: m.DailyTaskModal }))
);

interface SurahListViewProps {
  onSelectSurah: (surahNumber: number, jumpToAyah?: number) => void;
  lastRead: LastRead | null;
  dailyGoal: DailyGoalProgress;
  onOpenPrayerTimes?: () => void;
  onOpenTaskModal?: () => void;
  selectedDistrict?: string;
  onSelectDistrict?: (district: string) => void;
  language?: AppLanguage;
  onChangeLanguage?: (lang: AppLanguage) => void;
  onUpdateTargetAyahs?: (target: number) => void;
}

export const SurahListView: React.FC<SurahListViewProps> = ({
  onSelectSurah,
  lastRead,
  dailyGoal,
  onOpenPrayerTimes,
  onOpenTaskModal,
  selectedDistrict,
  onSelectDistrict,
  language = 'bn',
  onChangeLanguage,
  onUpdateTargetAyahs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'makki' | 'madani' | 'popular'>('all');
  const [showLocalTaskModal, setShowLocalTaskModal] = useState(false);

  const isBangla = language === 'bn';

  const handleOpenTask = () => {
    if (onOpenTaskModal) {
      onOpenTaskModal();
    } else {
      setShowLocalTaskModal(true);
    }
  };

  const popularSurahNumbers = [1, 2, 18, 36, 55, 56, 67, 78, 112, 113, 114];

  const filteredSurahs = useMemo(() => {
    return searchSurahsWithClosest(searchQuery, SURAH_LIST, filterType);
  }, [searchQuery, filterType]);

  const toDigits = (num: number | string): string => {
    if (!isBangla) return num.toString();
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map((c) => bnDigits[parseInt(c, 10)] ?? c).join('');
  };

  const progressPercent = Math.min(
    100,
    Math.round((dailyGoal.readAyahsToday / (dailyGoal.targetAyahs || 10)) * 100)
  );

  return (
    <div className="space-y-4 pb-28">
      {/* Dedicated Surah Search Bar (Top Priority) */}
      <div id="surah-search-header-container" className="space-y-2">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-emerald-600 dark:text-emerald-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="surah-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isBangla
                ? 'সূরা খুঁজুন (নাম বা নম্বর: ইয়াসিন, ফাতেহা, বাকারা, 36)...'
                : 'Search Surah (name or number: Yasin, Fatiha, Baqarah, 36)...'
            }
            className="w-full pl-10 pr-12 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/30 focus:border-emerald-600 dark:border-emerald-600/30 dark:focus:border-emerald-400 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden shadow-sm transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            >
              {isBangla ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>

        {/* Live Search Status & Filter Chips */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              {
                id: 'all',
                label: isBangla ? `সবগুলো (${toDigits(114)})` : `All (${toDigits(114)})`,
              },
              {
                id: 'popular',
                label: isBangla ? 'জনপ্রিয় সূরা' : 'Popular Surahs',
              },
              {
                id: 'makki',
                label: isBangla ? `মাক্কী (${toDigits(86)})` : `Meccan (${toDigits(86)})`,
              },
              {
                id: 'madani',
                label: isBangla ? `মাদানী (${toDigits(28)})` : `Medinan (${toDigits(28)})`,
              },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilterType(chip.id as any)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition ${
                  filterType === chip.id
                    ? 'bg-emerald-700 text-white shadow-2xs font-semibold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {searchQuery && (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold whitespace-nowrap shrink-0 ml-auto flex items-center gap-1">
              <span>{isBangla ? 'কাছাকাছি ফলাফল:' : 'Closest matches:'}</span>
              <span className="bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded-full font-mono text-[10px] text-emerald-900 dark:text-emerald-300">
                {toDigits(filteredSurahs.length)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Sleek Quick Access Bar with Individual Icons */}
      <div
        id="quick-access-icons-bar"
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-0.5"
      >
        {/* Individual Icon: Daily Tasks & Reading Goals */}
        <button
          type="button"
          id="btn-quick-daily-task"
          onClick={handleOpenTask}
          className="group flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500 transition active:scale-95 shrink-0"
          title={isBangla ? 'আজকের পড়ার টাস্ক ও স্ট্রিক দেখুন' : 'View Reading Tasks & Streak'}
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>{isBangla ? 'দৈনিক টাস্ক' : 'Daily Task'}</span>
              <span className="inline-flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-1 py-0.2 rounded">
                <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500 mr-0.5" />
                {toDigits(dailyGoal.currentStreak)} {isBangla ? 'দিন' : 'd'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-mono">
              {toDigits(dailyGoal.readAyahsToday)}/{toDigits(dailyGoal.targetAyahs || 10)} {isBangla ? 'আয়াত' : 'ayahs'}
            </div>
          </div>
        </button>

        {/* Quick Resume Bookmark */}
        {lastRead && (
          <button
            type="button"
            id="btn-quick-last-read"
            onClick={() => onSelectSurah(lastRead.surahNumber, lastRead.ayahNumber)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300/40 transition active:scale-95 shrink-0 ml-auto"
            title={isBangla ? 'সর্বশেষ পঠিত স্থান থেকে পড়ুন' : 'Resume reading'}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold truncate max-w-[140px]">
              {isBangla ? lastRead.surahNameBangla : `Surah ${lastRead.surahNumber}`}: {toDigits(lastRead.ayahNumber)}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Surah List Cards */}
      <div className="space-y-2">
        {filteredSurahs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Search className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isBangla
                ? `কোনো সূরা পাওয়া যায়নি "${searchQuery}"`
                : `No surahs found matching "${searchQuery}"`}
            </p>
          </div>
        ) : (
          filteredSurahs.map((surah: SurahMeta) => {
            const isCompleted = dailyGoal.completedSurahs.includes(surah.number);
            const revelationText =
              surah.revelationType === 'মাক্কী'
                ? isBangla
                  ? 'মাক্কী'
                  : 'Meccan'
                : isBangla
                ? 'মাদানী'
                : 'Medinan';

            return (
              <div
                key={surah.number}
                id={`surah-card-${surah.number}`}
                onClick={() => onSelectSurah(surah.number)}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 transition cursor-pointer shadow-xs active:scale-[0.995]"
              >
                {/* Left: Number badge & Bengali/English details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-10 h-10 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                    <span className="font-mono">{toDigits(surah.number)}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {isBangla ? surah.nameBangla : surah.nameEnglish}
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        ({isBangla ? surah.nameEnglish : surah.nameBangla})
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-1.5 py-0.2 rounded font-medium">
                          {isBangla ? 'পঠিত' : 'Read'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="truncate">{surah.meaningBangla}</span>
                      <span>•</span>
                      <span className="shrink-0">{revelationText}</span>
                      <span>•</span>
                      <span className="shrink-0 font-mono">
                        {toDigits(surah.numberOfAyahs)} {isBangla ? 'আয়াত' : 'Ayahs'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Arabic Name */}
                <div className="text-right pl-3 shrink-0">
                  <span className="font-arabic text-xl font-bold text-emerald-800 dark:text-emerald-300 tracking-wide block">
                    {surah.nameArabic}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Local Modal for Daily Tasks */}
      {showLocalTaskModal && (
        <Suspense fallback={null}>
          <DailyTaskModal
            isOpen={showLocalTaskModal}
            onClose={() => setShowLocalTaskModal(false)}
            lastRead={lastRead}
            dailyGoal={dailyGoal}
            onSelectSurah={onSelectSurah}
            onUpdateTargetAyahs={onUpdateTargetAyahs}
            language={language}
          />
        </Suspense>
      )}
    </div>
  );
};
