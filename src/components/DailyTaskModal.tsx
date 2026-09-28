import React from 'react';
import {
  X,
  Flame,
  CheckCircle2,
  BookOpen,
  Clock,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { LastRead, DailyGoalProgress, AppLanguage } from '../types';

interface DailyTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastRead: LastRead | null;
  dailyGoal: DailyGoalProgress;
  onSelectSurah: (surahNumber: number, jumpToAyah?: number) => void;
  onUpdateTargetAyahs?: (target: number) => void;
  language?: AppLanguage;
}

export const DailyTaskModal: React.FC<DailyTaskModalProps> = ({
  isOpen,
  onClose,
  lastRead,
  dailyGoal,
  onSelectSurah,
  onUpdateTargetAyahs,
  language = 'bn',
}) => {
  if (!isOpen) return null;

  const isBangla = language === 'bn';

  const toDigits = (num: number | string): string => {
    if (!isBangla) return num.toString();
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map((c) => bnDigits[parseInt(c, 10)] ?? c).join('');
  };

  const target = dailyGoal.targetAyahs || 10;
  const readToday = dailyGoal.readAyahsToday || 0;
  const progressPercent = Math.min(100, Math.round((readToday / target) * 100));
  const remaining = Math.max(0, target - readToday);

  const handleResume = (surahNum: number, ayahNum?: number) => {
    onClose();
    onSelectSurah(surahNum, ayahNum);
  };

  return (
    <div
      id="daily-task-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="daily-task-modal-content"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 text-white border-b border-emerald-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center shadow-md font-bold">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                {isBangla ? 'দৈনিক টাস্ক ও পড়ার লক্ষ্য' : 'Daily Tasks & Reading Goals'}
              </h3>
              <p className="text-xs text-emerald-200">
                {isBangla ? 'ধারাবাহিক কুরআন তিলাওয়াত ও ট্র্যাকার' : 'Quran recitation tracker & streak'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-task-modal"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-emerald-200 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Streak Banner */}
          <div
            id="task-streak-box"
            className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                <Flame className="w-6 h-6 fill-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {isBangla ? 'ধারাবাহিক তিলাওয়াত' : 'Reading Streak'}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {toDigits(dailyGoal.currentStreak)} {isBangla ? 'দিনের স্ট্রিক!' : 'Days Streak!'}
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Award className="w-5 h-5 text-amber-500 ml-auto mb-0.5" />
              <span>{isBangla ? 'প্রতিদিনের অভ্যাস' : 'Daily Habit'}</span>
            </div>
          </div>

          {/* Primary Task 1: Continue Reading from Last Read */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isBangla ? '১. সর্বশেষ পঠিত স্থান থেকে পড়ুন' : '1. Resume from Last Read'}</span>
            </div>

            {lastRead ? (
              <div
                id="task-modal-last-read"
                onClick={() => handleResume(lastRead.surahNumber, lastRead.ayahNumber)}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-4 text-white shadow-md cursor-pointer border border-emerald-700/50 hover:border-amber-400/50 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider text-amber-300 uppercase px-2 py-0.5 rounded-full bg-emerald-900/60 border border-amber-400/30">
                      <Clock className="w-3 h-3" /> {isBangla ? 'সর্বশেষ বুকমার্ক' : 'Last Marked'}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold mt-1 text-white">
                      {isBangla ? lastRead.surahNameBangla : `Surah ${lastRead.surahNumber}`}
                    </h4>
                    <p className="text-xs text-emerald-200 mt-0.5">
                      {isBangla
                        ? `আয়াত নং ${toDigits(lastRead.ayahNumber)} থেকে পড়া চালিয়ে যান`
                        : `Continue reading from Ayah ${toDigits(lastRead.ayahNumber)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold bg-amber-400 text-emerald-950 px-3 py-2 rounded-xl group-hover:bg-amber-300 transition-colors shadow-sm shrink-0">
                    <span>{isBangla ? 'পড়ুন' : 'Read'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ) : (
              <div
                id="task-modal-start-read"
                onClick={() => handleResume(1, 1)}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-4 text-white shadow-md cursor-pointer border border-emerald-700/50 hover:border-amber-400/50 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 px-2 py-0.5 rounded-full bg-emerald-900/60">
                      <BookOpen className="w-3 h-3" /> {isBangla ? 'নতুন করে শুরু' : 'Start Reading'}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold mt-1 text-white">
                      {isBangla ? 'সূরা আল-ফাতিহা (উম্মুল কুরআন)' : 'Surah Al-Fatihah'}
                    </h4>
                    <p className="text-xs text-emerald-200 mt-0.5">
                      {isBangla ? 'পবিত্র কুরআনের প্রথম সূরা দিয়ে শুরু করুন' : 'Start with the opening chapter'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold bg-amber-400 text-emerald-950 px-3 py-2 rounded-xl group-hover:bg-amber-300 transition-colors shadow-sm shrink-0">
                    <span>{isBangla ? 'শুরু করুন' : 'Start'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Primary Task 2: Daily Reading Goal */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {isBangla ? '২. আজকের আয়াতের লক্ষ্য' : '2. Today\'s Ayah Target'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBangla ? 'প্রতিদিন অল্প হলেও কুরআন তিলাওয়াত করুন' : 'Consistent daily reading'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {toDigits(readToday)} / {toDigits(target)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                  {isBangla ? 'আয়াত' : 'Ayahs'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1 text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {progressPercent >= 100
                  ? isBangla
                    ? '🎉 মাশাআল্লাহ! আজকের লক্ষ্য অর্জিত হয়েছে'
                    : '🎉 MashaAllah! Daily goal achieved'
                  : isBangla
                  ? `আজকের লক্ষ্য পূরণ হতে বাকি: ${toDigits(remaining)} আয়াত`
                  : `${toDigits(remaining)} ayahs left for today`}
              </span>
              <span className="font-mono font-bold">{progressPercent}%</span>
            </div>

            {/* Quick target adjustment */}
            {onUpdateTargetAyahs && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {isBangla ? 'দৈনিক লক্ষ্য পরিবর্তন করুন:' : 'Change daily target:'}
                </span>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 20, 30].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onUpdateTargetAyahs(num)}
                      className={`px-2 py-0.5 rounded-lg font-semibold text-xs transition ${
                        target === num
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {toDigits(num)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* All-time Stats */}
          <div className="grid grid-cols-2 gap-3 pt-1 text-center">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isBangla ? 'মোট পঠিত আয়াত' : 'Total Ayahs Read'}
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {toDigits(dailyGoal.totalAyahsRead || 0)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isBangla ? 'আজকের পঠিত' : 'Read Today'}
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {toDigits(readToday)}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isBangla ? 'প্রতিদিনের আমল কবুল হোক' : 'May Allah accept your daily recitation'}
          </span>
          <button
            type="button"
            id="btn-task-modal-done"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm"
          >
            {isBangla ? 'ঠিক আছে' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
