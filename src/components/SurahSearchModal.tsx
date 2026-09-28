import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { SurahMeta, AppLanguage } from '../types';
import { SURAH_LIST } from '../data/surahList';
import { searchSurahsWithClosest } from '../utils/surahSearch';

interface SurahSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSurah: (surahNumber: number) => void;
  language?: AppLanguage;
}

export const SurahSearchModal: React.FC<SurahSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSurah,
  language = 'bn',
}) => {
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'popular' | 'makki' | 'madani'>('all');

  const isBangla = language === 'bn';

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedFilter('all');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toDigits = (num: number | string): string => {
    if (!isBangla) return num.toString();
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map((c) => bnDigits[parseInt(c, 10)] ?? c).join('');
  };

  const filteredSurahs = useMemo(() => {
    return searchSurahsWithClosest(query, SURAH_LIST, selectedFilter);
  }, [query, selectedFilter]);

  if (!isOpen) return null;

  return (
    <div
      id="surah-search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 pt-12 sm:pt-16 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="surah-search-modal-content"
        className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Bar for Surahs Only */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isBangla ? 'শুধুমাত্র সূরা খুঁজুন' : 'Search Surahs Only'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isBangla
                    ? '১১৪টি সূরার মধ্য থেকে নাম বা নম্বর দিয়ে খুঁজুন'
                    : 'Search among all 114 Surahs by name or number'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              title={isBangla ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="modal-surah-search-input"
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isBangla
                  ? 'সূরার নাম বা নম্বর লিখুন (যেমন: ফাতিহা, Yasin, 36, 112)...'
                  : 'Enter Surah name or number (e.g. Fatihah, Yasin, 36, 112)...'
              }
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 focus:border-emerald-600 dark:border-emerald-600/40 dark:focus:border-emerald-400 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {isBangla ? 'মুছুন' : 'Clear'}
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar text-xs">
            {[
              { id: 'all', label: isBangla ? `সবগুলো (${toDigits(114)})` : `All (${toDigits(114)})` },
              { id: 'popular', label: isBangla ? 'জনপ্রিয় সূরা' : 'Popular Surahs' },
              { id: 'makki', label: isBangla ? `মাক্কী (${toDigits(86)})` : `Meccan (${toDigits(86)})` },
              { id: 'madani', label: isBangla ? `মাদানী (${toDigits(28)})` : `Medinan (${toDigits(28)})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition text-[11px] ${
                  selectedFilter === f.id
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 no-scrollbar">
          {query.trim() && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pb-1">
              <span>{isBangla ? 'কাছাকাছি ফলাফল' : 'Closest matching results'}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {toDigits(filteredSurahs.length)} {isBangla ? 'টি সূরা' : 'surahs'}
              </span>
            </div>
          )}

          {filteredSurahs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Search className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
              <p className="text-sm font-medium">
                {isBangla
                  ? `"${query}" নামে কোনো সূরা খুঁজে পাওয়া যায়নি`
                  : `No Surah found matching "${query}"`}
              </p>
              <p className="text-xs text-slate-400">
                {isBangla
                  ? 'অনুগ্রহ করে সূরার বাংলা/ইংরেজি নাম অথবা ১-১১৪ এর মধ্যে নম্বর লিখে চেষ্টা করুন'
                  : 'Try searching by Bangla or English name, or a number from 1 to 114'}
              </p>
            </div>
          ) : (
            filteredSurahs.map((surah) => {
              const revelationText =
                surah.revelationType === 'মাক্কী'
                  ? isBangla
                    ? 'মাক্কী'
                    : 'Meccan'
                  : isBangla
                  ? 'মাদানী'
                  : 'Medinan';

              return (
                <button
                  key={surah.number}
                  onClick={() => {
                    onSelectSurah(surah.number);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-850/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-700 transition group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                      {toDigits(surah.number)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition">
                          {isBangla ? surah.nameBangla : surah.nameEnglish}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          ({isBangla ? surah.nameEnglish : surah.nameBangla})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {isBangla ? surah.meaningBangla : surah.nameEnglish} • {toDigits(surah.numberOfAyahs)} {isBangla ? 'আয়াত' : 'verses'} • {revelationText}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="font-arabic font-bold text-lg text-emerald-900 dark:text-emerald-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
                      {surah.nameArabic}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
