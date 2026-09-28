import React from 'react';
import { Settings, WifiOff, BookOpen, Sparkles, CheckCircle2, Flame, Search } from 'lucide-react';
import { AppLanguage } from '../types';

interface NavbarProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenSettings: () => void;
  onOpenSurahSearch?: () => void;
  onOpenPrayerTimes?: () => void;
  onOpenDailyTasks?: () => void;
  streakCount?: number;
  isOnline: boolean;
  language?: AppLanguage;
  onToggleLanguage?: (lang: AppLanguage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenSettings,
  onOpenSurahSearch,
  onOpenPrayerTimes,
  onOpenDailyTasks,
  streakCount = 0,
  isOnline,
  language = 'bn',
  onToggleLanguage,
}) => {
  const isBangla = language === 'bn';

  return (
    <>
      <div
        id="app-header"
        className="w-full border-b border-emerald-900/20 bg-emerald-800 dark:bg-slate-950 text-white transition-colors select-none"
      >
        <div className="max-w-4xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm text-emerald-950 shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
                  {isBangla ? 'দৈনিক কুরআন' : 'Daily Quran'}
                </h1>

                {/* Language Switcher beside name */}
                <div
                  id="nav-language-switch"
                  className="inline-flex items-center p-0.5 rounded-lg bg-emerald-950/80 dark:bg-slate-900 border border-emerald-600/50 shadow-inner text-[10px]"
                  title={isBangla ? 'ভাষা পরিবর্তন করুন (বাংলা / English)' : 'Change Language (Bangla / English)'}
                >
                  <button
                    type="button"
                    id="btn-nav-lang-bn"
                    onClick={() => onToggleLanguage && onToggleLanguage('bn')}
                    className={`px-1.5 py-0.5 rounded-md font-bold transition-all ${
                      isBangla
                        ? 'bg-amber-400 text-emerald-950'
                        : 'text-emerald-200 hover:text-white'
                    }`}
                  >
                    বাং
                  </button>
                  <button
                    type="button"
                    id="btn-nav-lang-en"
                    onClick={() => onToggleLanguage && onToggleLanguage('en')}
                    className={`px-1.5 py-0.5 rounded-md font-bold transition-all ${
                      !isBangla
                        ? 'bg-amber-400 text-emerald-950'
                        : 'text-emerald-200 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-emerald-200/80 dark:text-emerald-300/70 hidden sm:block">
                {isBangla ? 'অফলাইন তিলাওয়াত ও তাফসীর' : 'Offline Quran Recitation & Tafsir'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {!isOnline && (
              <span
                id="offline-pill"
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium bg-amber-500/20 text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded-full"
              >
                <WifiOff className="w-3 h-3 text-amber-300" /> {isBangla ? 'অফলাইন' : 'Offline'}
              </span>
            )}

            {/* Dedicated Surah Search Button */}
            {onOpenSurahSearch && (
              <button
                id="btn-nav-search-surah"
                onClick={onOpenSurahSearch}
                className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-xs transition active:scale-95"
                title={isBangla ? 'শুধুমাত্র সূরা খুঁজুন' : 'Search Surahs Only'}
              >
                <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline text-[11px]">{isBangla ? 'সূরা খুঁজুন' : 'Search Surah'}</span>
              </button>
            )}

            {/* Individual Icon: Daily Tasks */}
            {onOpenDailyTasks && (
              <button
                id="btn-nav-daily-tasks"
                onClick={onOpenDailyTasks}
                className="flex items-center gap-1 bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100 text-xs px-2 py-1.5 rounded-lg border border-emerald-500/40 transition active:scale-95"
                aria-label={isBangla ? 'দৈনিক টাস্ক' : 'Daily Tasks'}
                title={isBangla ? 'আজকের পড়ার টাস্ক' : 'Daily Tasks'}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                {streakCount > 0 ? (
                  <span className="flex items-center text-[10px] text-amber-300 font-bold">
                    <Flame className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-0.5" />
                    {streakCount}
                  </span>
                ) : (
                  <span className="hidden xs:inline text-[11px] font-medium">{isBangla ? 'টাস্ক' : 'Tasks'}</span>
                )}
              </button>
            )}

            {/* Settings Trigger */}
            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-lg bg-emerald-900/50 hover:bg-emerald-900 text-emerald-100 transition active:scale-90"
              aria-label={isBangla ? 'সেটিংস খুলুন' : 'Open Settings'}
              title={isBangla ? 'সেটিংস' : 'Settings'}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
