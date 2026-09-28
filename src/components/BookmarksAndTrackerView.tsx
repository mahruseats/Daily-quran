import React, { useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Trash2,
  Flame,
  Award,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import { Bookmark as BookmarkType, DailyGoalProgress, LastRead, AppLanguage } from '../types';

interface BookmarksAndTrackerViewProps {
  bookmarks: BookmarkType[];
  onRemoveBookmark: (surahNumber: number, ayahNumber: number) => void;
  onSelectSurah: (surahNumber: number, ayahNumber?: number) => void;
  dailyGoal: DailyGoalProgress;
  onUpdateTargetAyahs: (target: number) => void;
  lastRead: LastRead | null;
  language?: AppLanguage;
}

export const BookmarksAndTrackerView: React.FC<BookmarksAndTrackerViewProps> = ({
  bookmarks,
  onRemoveBookmark,
  onSelectSurah,
  dailyGoal,
  onUpdateTargetAyahs,
  lastRead,
  language = 'bn',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(dailyGoal.targetAyahs.toString());

  const isBangla = language === 'bn';

  const toBanglaDigits = (num: number | string): string => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map((c) => bnDigits[parseInt(c, 10)] ?? c).join('');
  };

  const formatDigits = (num: number | string): string => {
    return isBangla ? toBanglaDigits(num) : num.toString();
  };

  const categories = [
    { id: 'all', label: isBangla ? 'সবগুলো' : 'All' },
    { id: 'দৈনিক পাঠ', label: isBangla ? 'দৈনিক পাঠ' : 'Daily Reading' },
    { id: 'মুখস্থ', label: isBangla ? 'মুখস্থ' : 'Memorization' },
    { id: 'পছন্দ', label: isBangla ? 'পছন্দের আয়াত' : 'Favorites' },
    { id: 'দোয়া', label: isBangla ? 'দোয়া' : 'Duas' },
  ];

  const filteredBookmarks = bookmarks.filter((b) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'দৈনিক পাঠ' || selectedCategory === 'Daily Reading') {
      return b.category === 'দৈনিক পাঠ' || b.category === 'Daily Reading';
    }
    if (selectedCategory === 'মুখস্থ' || selectedCategory === 'Memorization') {
      return b.category === 'মুখস্থ' || b.category === 'Memorization';
    }
    if (selectedCategory === 'পছন্দ' || selectedCategory === 'Favorites') {
      return b.category === 'পছন্দ' || b.category === 'Favorites';
    }
    if (selectedCategory === 'দোয়া' || selectedCategory === 'Duas') {
      return b.category === 'দোয়া' || b.category === 'Duas' || b.category === 'Dua';
    }
    return b.category === selectedCategory;
  });

  const progressPercent = Math.min(
    100,
    Math.round((dailyGoal.readAyahsToday / (dailyGoal.targetAyahs || 10)) * 100)
  );

  const handleSaveTarget = () => {
    const parsed = parseInt(tempTarget, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateTargetAyahs(parsed);
    }
    setEditingTarget(false);
  };

  // Generate last 7 days history for mini tracker chart
  const getLast7DaysData = () => {
    const days: { dateStr: string; dayName: string; count: number }[] = [];
    const banglaDays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
    const englishDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const count = dailyGoal.readingHistory[isoDate] || (i === 0 ? dailyGoal.readAyahsToday : 0);
      days.push({
        dateStr: isoDate,
        dayName: isBangla ? banglaDays[d.getDay()] : englishDays[d.getDay()],
        count,
      });
    }
    return days;
  };

  const last7Days = getLast7DaysData();
  const maxDayCount = Math.max(...last7Days.map((d) => d.count), dailyGoal.targetAyahs || 10, 1);

  return (
    <div className="space-y-4 pb-28">
      {/* Hero Header */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 p-6 text-white text-center shadow-lg border border-emerald-800/40">
        <div className="max-w-md mx-auto">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 px-3 py-1 rounded-full bg-emerald-900/60 border border-amber-400/30 mb-2">
            <Award className="w-3 h-3" />{' '}
            {isBangla ? 'দৈনিক কুরআন তিলাওয়াত ট্র্যাকার' : 'Daily Quran Recitation Tracker'}
          </span>
          <h2 className="text-2xl font-bold tracking-tight">
            {isBangla ? 'বুকমার্ক ও অগ্রগতি' : 'Bookmarks & Progress'}
          </h2>
          <p className="text-xs text-emerald-200/90 mt-1">
            {isBangla
              ? 'দৈনিক পাঠের লক্ষ্যমাত্রা নির্ধারণ করুন, স্ট্রিক বজায় রাখুন এবং সংরক্ষিত আয়াতসমূহ পড়ুন'
              : 'Set daily recitation goals, maintain your reading streak, and review saved verses'}
          </p>
        </div>
      </div>

      {/* Daily Goal & Streak Card */}
      <div
        id="reading-progress-card"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isBangla ? 'আজকের পাঠের অগ্রগতি' : "Today's Reading Progress"}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                {formatDigits(dailyGoal.readAyahsToday)}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                / {formatDigits(dailyGoal.targetAyahs)} {isBangla ? 'আয়াত' : 'Verses'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1.5 rounded-xl">
            <Flame className="w-4 h-4 fill-current text-amber-500" />
            <span>
              {formatDigits(dailyGoal.currentStreak)} {isBangla ? 'দিন স্ট্রিক' : 'Day Streak'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>
              {formatDigits(progressPercent)}% {isBangla ? 'সম্পন্ন' : 'Completed'}
            </span>
            {progressPercent >= 100 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />{' '}
                {isBangla ? 'আজকের লক্ষ্য অর্জিত হয়েছে!' : "Today's goal completed!"}
              </span>
            ) : (
              <span>
                {isBangla
                  ? `আর ${formatDigits(Math.max(0, dailyGoal.targetAyahs - dailyGoal.readAyahsToday))} আয়াত বাকি`
                  : `${formatDigits(Math.max(0, dailyGoal.targetAyahs - dailyGoal.readAyahsToday))} verses remaining`}
              </span>
            )}
          </div>
        </div>

        {/* Last 7 Days Activity Visualizer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 block">
            {isBangla ? 'বিগত ৭ দিনের তিলাওয়াত রেকর্ড:' : 'Past 7 Days Reading Log:'}
          </span>
          <div className="grid grid-cols-7 gap-1.5 items-end h-20 pt-2">
            {last7Days.map((item, idx) => {
              const barHeight = Math.max(12, Math.round((item.count / maxDayCount) * 100));
              const isToday = idx === 6;

              return (
                <div key={item.dateStr} className="flex flex-col items-center h-full justify-end">
                  <span className="text-[9px] text-slate-400 font-mono mb-1">
                    {formatDigits(item.count)}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isToday
                        ? 'bg-amber-400 dark:bg-amber-500'
                        : item.count > 0
                        ? 'bg-emerald-600 dark:bg-emerald-500'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                    style={{ height: `${barHeight}%` }}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {item.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit Target button */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {isBangla
              ? `মোট তিলাওয়াত: ${formatDigits(dailyGoal.totalAyahsRead)} আয়াত`
              : `Total Recited: ${formatDigits(dailyGoal.totalAyahsRead)} Verses`}
          </span>

          {editingTarget ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className="w-16 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                min="1"
                max="500"
              />
              <button
                onClick={handleSaveTarget}
                className="px-2 py-1 bg-emerald-600 text-white rounded font-medium text-[11px]"
              >
                {isBangla ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTempTarget(dailyGoal.targetAyahs.toString());
                setEditingTarget(true);
              }}
              className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> {isBangla ? 'লক্ষ্য পরিবর্তন করুন' : 'Change Goal'}
            </button>
          )}
        </div>
      </div>

      {/* Quick Last Read Resume */}
      {lastRead && (
        <div
          onClick={() => onSelectSurah(lastRead.surahNumber, lastRead.ayahNumber)}
          className="p-4 rounded-2xl bg-emerald-800 text-white flex items-center justify-between shadow-xs cursor-pointer hover:bg-emerald-850 transition"
        >
          <div>
            <span className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider block">
              {isBangla ? 'পড়া চালিয়ে যান (Resume)' : 'Resume Reading'}
            </span>
            <h4 className="text-base font-bold text-white mt-0.5">
              {lastRead.surahNameBangla} — {isBangla ? `আয়াত নং ${formatDigits(lastRead.ayahNumber)}` : `Verse ${formatDigits(lastRead.ayahNumber)}`}
            </h4>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-bold">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Bookmarks Section Header */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-current" />
            {isBangla ? 'সংরক্ষিত বুকমার্কসমূহ' : 'Saved Bookmarks'} ({formatDigits(bookmarks.length)})
          </h3>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Bookmarks List */}
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
            <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {isBangla ? 'কোনো বুকমার্ক সংরক্ষিত নেই' : 'No bookmarks saved yet'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {isBangla
                ? 'যেকোনো সূরার আয়াত অথবা ৪০ রব্বানা দোয়ার পাশে থাকা বুকমার্ক আইকনে চাপ দিয়ে এখানে সংরক্ষণ করুন।'
                : 'Bookmark any verse from a Surah or any of the 40 Rabbana Duas to save it here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookmarks.map((bm) => (
              <div
                key={bm.id}
                id={`bookmark-item-${bm.id}`}
                className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs hover:border-emerald-500/40 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    onClick={() => {
                      if (bm.surahNumber > 0) {
                        onSelectSurah(bm.surahNumber, bm.ayahNumber);
                      }
                    }}
                    className="cursor-pointer flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        {bm.surahNameBangla}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {bm.surahNumber > 0
                          ? isBangla
                            ? `আয়াত: ${formatDigits(bm.ayahNumber)}`
                            : `Verse: ${formatDigits(bm.ayahNumber)}`
                          : bm.note || ''}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {bm.category}
                      </span>
                    </div>

                    <p className="font-arabic text-lg text-slate-900 dark:text-emerald-100 line-clamp-2 my-1 leading-loose">
                      {bm.textArabic}
                    </p>

                    <p className="font-bangla text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                      {bm.textBangla}
                    </p>
                  </div>

                  <button
                    onClick={() => onRemoveBookmark(bm.surahNumber, bm.ayahNumber)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                    title={isBangla ? 'বুকমার্ক মুছুন' : 'Remove Bookmark'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
