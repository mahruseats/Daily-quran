import React from 'react';
import { BookOpen, HeartHandshake, Clock, BookmarkCheck, Sliders } from 'lucide-react';
import { AppLanguage } from '../types';

export type NavTab = 'surahs' | 'duas' | 'prayer' | 'tracker' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  bookmarkCount: number;
  language?: AppLanguage;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  bookmarkCount,
  language = 'bn',
}) => {
  const isBangla = language === 'bn';

  const tabs = [
    {
      id: 'surahs' as NavTab,
      labelBangla: 'কুরআন',
      labelEnglish: 'Quran',
      icon: BookOpen,
    },
    {
      id: 'duas' as NavTab,
      labelBangla: 'দোয়া',
      labelEnglish: 'Duas',
      labelSub: '৪০',
      icon: HeartHandshake,
    },
    {
      id: 'prayer' as NavTab,
      labelBangla: 'সালাত',
      labelEnglish: 'Salah',
      icon: Clock,
    },
    {
      id: 'tracker' as NavTab,
      labelBangla: 'বুকমার্ক',
      labelEnglish: 'Bookmarks',
      icon: BookmarkCheck,
      badge: bookmarkCount > 0 ? bookmarkCount.toString() : undefined,
    },
    {
      id: 'settings' as NavTab,
      labelBangla: 'সেটিংস',
      labelEnglish: 'Settings',
      icon: Sliders,
    },
  ];

  return (
    <nav
      id="app-navigation-bar"
      role="navigation"
      aria-label="App Navigation Bar"
      className="w-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors select-none"
    >
      <div className="max-w-4xl mx-auto grid grid-cols-5 px-1 sm:px-2 py-1 gap-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded-lg min-h-[42px] transition-all touch-manipulation active:scale-95 ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/80 ring-1 ring-emerald-200 dark:ring-emerald-800/60 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-150 ${
                    isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-amber-500 text-white text-[9px] font-bold rounded-full min-w-[14px] text-center leading-tight shadow-xs">
                    {tab.badge}
                  </span>
                )}
                {tab.labelSub && !tab.badge && (
                  <span className="absolute -top-1 -right-1.5 px-1 bg-emerald-600 text-white text-[8px] font-bold rounded-full leading-tight">
                    {tab.labelSub}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs tracking-tight leading-none">
                {isBangla ? tab.labelBangla : tab.labelEnglish}
              </span>
              {isActive && (
                <div className="sm:hidden absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

