import React, { useState, useMemo } from 'react';
import {
  Search,
  Play,
  Pause,
  Bookmark,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { RabbanaDua, Bookmark as BookmarkType, AppLanguage } from '../types';
import { RABBANA_DUAS } from '../data/rabbanaDuas';

interface RabbanaDuasViewProps {
  bookmarks: BookmarkType[];
  onAddBookmark: (bookmark: Omit<BookmarkType, 'id' | 'createdAt'>) => void;
  onRemoveBookmark: (surahNumber: number, ayahNumber: number) => void;
  onPlayAudioUrl: (url: string, title: string, subtitle: string) => void;
  playingAudioUrl: string | null;
  isPlayingAudio: boolean;
  language?: AppLanguage;
  onBack?: () => void;
}

export const RabbanaDuasView: React.FC<RabbanaDuasViewProps> = ({
  bookmarks,
  onAddBookmark,
  onRemoveBookmark,
  onPlayAudioUrl,
  playingAudioUrl,
  isPlayingAudio,
  language = 'bn',
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const isBangla = language === 'bn';

  const toBanglaDigits = (num: number | string): string => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map((c) => bnDigits[parseInt(c, 10)] ?? c).join('');
  };

  const formatDigits = (num: number | string): string => {
    return isBangla ? toBanglaDigits(num) : num.toString();
  };

  const tags = [
    {
      id: 'all',
      label: isBangla ? 'সবগুলো (৪০)' : 'All Duas (40)',
      queryBn: '',
      queryEn: '',
    },
    {
      id: 'forgiveness',
      label: isBangla ? 'ক্ষমা ও মাগফিরাত' : 'Forgiveness & Mercy',
      queryBn: 'ক্ষমা',
      queryEn: 'forgive',
    },
    {
      id: 'family',
      label: isBangla ? 'পিতামাতা ও পরিবার' : 'Parents & Family',
      queryBn: 'পিতামাতা',
      queryEn: 'parent',
    },
    {
      id: 'guidance',
      label: isBangla ? 'হেদায়েত ও অবিচলতা' : 'Guidance & Faith',
      queryBn: 'হেদায়েত',
      queryEn: 'guid',
    },
    {
      id: 'jannah',
      label: isBangla ? 'জাহান্নাম থেকে মুক্তি' : 'Protection from Fire',
      queryBn: 'জাহান্নাম',
      queryEn: 'fire',
    },
    {
      id: 'patience',
      label: isBangla ? 'ধৈর্য ও সাহায্য' : 'Patience & Victory',
      queryBn: 'ধৈর্য',
      queryEn: 'patience',
    },
  ];

  const filteredDuas = useMemo(() => {
    return RABBANA_DUAS.filter((dua) => {
      if (selectedTag !== 'all') {
        const tagItem = tags.find((t) => t.id === selectedTag);
        if (tagItem) {
          const qBn = tagItem.queryBn.toLowerCase();
          const qEn = tagItem.queryEn.toLowerCase();
          const matchTag =
            (qBn && (dua.translationBangla.includes(qBn) || dua.significanceBangla.includes(qBn))) ||
            (qEn &&
              ((dua.translationEnglish || '').toLowerCase().includes(qEn) ||
                (dua.significanceEnglish || '').toLowerCase().includes(qEn)));
          if (!matchTag) return false;
        }
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        dua.id.toString().includes(q) ||
        dua.translationBangla.toLowerCase().includes(q) ||
        (dua.translationEnglish || '').toLowerCase().includes(q) ||
        dua.pronunciationBangla.toLowerCase().includes(q) ||
        (dua.pronunciationEnglish || '').toLowerCase().includes(q) ||
        dua.surahNameBangla.toLowerCase().includes(q) ||
        (dua.surahNameEnglish || '').toLowerCase().includes(q) ||
        dua.significanceBangla.toLowerCase().includes(q) ||
        (dua.significanceEnglish || '').toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedTag]);

  const isDuaBookmarked = (duaId: number): boolean => {
    return bookmarks.some((b) => b.category === (isBangla ? 'দোয়া' : 'Dua') && b.ayahNumber === duaId);
  };

  const handleToggleBookmark = (dua: RabbanaDua) => {
    if (isDuaBookmarked(dua.id)) {
      onRemoveBookmark(0, dua.id);
    } else {
      onAddBookmark({
        surahNumber: 0,
        surahNameBangla: isBangla ? dua.surahNameBangla : (dua.surahNameEnglish || dua.surahNameBangla),
        ayahNumber: dua.id,
        textArabic: dua.arabic,
        textBangla: isBangla ? dua.translationBangla : (dua.translationEnglish || dua.translationBangla),
        category: isBangla ? 'দোয়া' : 'Dua',
        note: dua.ayahReference,
      });
    }
  };

  const handleCopyDua = (dua: RabbanaDua) => {
    const translit = isBangla ? dua.pronunciationBangla : (dua.pronunciationEnglish || dua.pronunciationBangla);
    const trans = isBangla ? dua.translationBangla : (dua.translationEnglish || dua.translationBangla);
    const surahName = isBangla ? dua.surahNameBangla : (dua.surahNameEnglish || dua.surahNameBangla);
    const sig = isBangla ? dua.significanceBangla : (dua.significanceEnglish || dua.significanceBangla);

    const text = isBangla
      ? `রব্বানা দোয়া #${toBanglaDigits(dua.id)}\n\n${dua.arabic}\n\nউচ্চারণ: ${translit}\n\nঅর্থ: ${trans}\n\nরেফারেন্স: [${surahName}: ${dua.ayahReference}]\nফজিলত: ${sig}`
      : `Rabbana Dua #${dua.id}\n\n${dua.arabic}\n\nTransliteration: ${translit}\n\nTranslation: ${trans}\n\nReference: [${surahName}: ${dua.ayahReference}]\nContext: ${sig}`;

    navigator.clipboard.writeText(text);
    setCopiedId(dua.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 p-6 text-white text-center shadow-lg border border-emerald-800/40 relative overflow-hidden">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/80 hover:bg-emerald-800 text-xs font-semibold text-emerald-100 border border-emerald-700/60 transition shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isBangla ? 'সূরা তালিকা' : 'Surah List'}</span>
          </button>
        )}

        <div className="relative z-10 max-w-md mx-auto pt-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 px-3 py-1 rounded-full bg-emerald-900/60 border border-amber-400/30 mb-2">
            <Sparkles className="w-3 h-3" />
            {isBangla ? 'পবিত্র কুরআনের শ্রেষ্ঠ মুনাজাত' : 'Essential Quranic Supplications'}
          </span>
          <h2 className="text-2xl font-bold tracking-tight">
            {isBangla ? '৪০ রব্বানা দোয়া' : '40 Rabbana Duas'}
          </h2>
          <p className="text-xs text-emerald-200/90 mt-1">
            {isBangla
              ? "পবিত্র কুরআনে বর্ণিত 'রব্বানা' (হে আমাদের প্রতিপালক) দিয়ে শুরু হওয়া সকল দোয়া, অর্থ, উচ্চারণ ও ফজিলত"
              : "All 40 supplications from the Holy Quran beginning with 'Rabbana' (Our Lord), with authentic translation, transliteration & context"}
          </p>
        </div>
      </div>

      {/* Search & Topic Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="dua-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isBangla
                ? 'দোয়া খুঁজুন (যেমন: ক্ষমা, পিতা-মাতা, ধৈর্য, রিযিক)...'
                : 'Search duas (e.g. forgiveness, parents, patience, mercy)...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                selectedTag === tag.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duas List */}
      <div className="space-y-4">
        {filteredDuas.map((dua) => {
          const isBookmarked = isDuaBookmarked(dua.id);
          const isPlayingThis =
            playingAudioUrl === dua.audioUrl && isPlayingAudio;

          const surahName = isBangla ? dua.surahNameBangla : (dua.surahNameEnglish || dua.surahNameBangla);
          const transliteration = isBangla ? dua.pronunciationBangla : (dua.pronunciationEnglish || dua.pronunciationBangla);
          const translation = isBangla ? dua.translationBangla : (dua.translationEnglish || dua.translationBangla);
          const significance = isBangla ? dua.significanceBangla : (dua.significanceEnglish || dua.significanceBangla);

          return (
            <div
              key={dua.id}
              id={`rabbana-dua-card-${dua.id}`}
              className={`rounded-2xl p-5 bg-white dark:bg-slate-900 border transition shadow-xs ${
                isPlayingThis
                  ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-slate-200/90 dark:border-slate-800/90'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center font-mono border border-amber-400/30">
                    {formatDigits(dua.id)}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {surahName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isBangla ? `আয়াত: ${dua.ayahReference}` : `Verse: ${dua.ayahReference}`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      onPlayAudioUrl(
                        dua.audioUrl,
                        isBangla ? `রব্বানা দোয়া #${toBanglaDigits(dua.id)}` : `Rabbana Dua #${dua.id}`,
                        `${surahName} (${dua.ayahReference})`
                      )
                    }
                    className={`p-2 rounded-xl transition ${
                      isPlayingThis
                        ? 'bg-amber-400 text-emerald-950 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={isBangla ? 'দোয়া তিলাওয়াত শুনুন' : 'Listen to Dua recitation'}
                  >
                    {isPlayingThis ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleBookmark(dua)}
                    className={`p-2 rounded-xl transition ${
                      isBookmarked
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title={
                      isBookmarked
                        ? (isBangla ? 'সংরক্ষণ বাতিল' : 'Remove Bookmark')
                        : (isBangla ? 'বুকমার্কে সংরক্ষণ' : 'Add to Bookmarks')
                    }
                  >
                    <Bookmark
                      className={`w-4 h-4 ${isBookmarked ? 'fill-current text-amber-500' : ''}`}
                    />
                  </button>

                  <button
                    onClick={() => handleCopyDua(dua)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title={isBangla ? 'দোয়া কপি করুন' : 'Copy Dua'}
                  >
                    {copiedId === dua.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Arabic */}
              <div className="font-arabic text-xl md:text-2xl font-bold text-emerald-900 dark:text-emerald-200 my-3 leading-loose select-text">
                {dua.arabic}
              </div>

              {/* Transliteration */}
              <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 italic mb-2 leading-relaxed bg-slate-50 dark:bg-slate-850/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 not-italic mr-1.5">
                  {isBangla ? 'উচ্চারণ:' : 'Transliteration:'}
                </span>
                {transliteration}
              </div>

              {/* Translation */}
              <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed select-text">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 mr-1.5">
                  {isBangla ? 'অর্থ:' : 'Translation:'}
                </span>
                {translation}
              </div>

              {/* Significance / Benefits */}
              {significance && (
                <div className="mt-3 pt-2 text-[11px] text-amber-800 dark:text-amber-300/90 bg-amber-50/60 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/50 dark:border-amber-800/30 flex items-start gap-1.5">
                  <span className="font-bold shrink-0">
                    {isBangla ? 'ফজিলত ও প্রেক্ষাপট:' : 'Context & Benefit:'}
                  </span>
                  <span>{significance}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
