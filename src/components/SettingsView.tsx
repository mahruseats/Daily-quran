import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  Volume2,
  Type,
  Trash2,
  Languages,
  Sparkles,
} from 'lucide-react';
import { AppSettings, Qari, AppLanguage } from '../types';
import { RECITERS } from '../utils/quranApi';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  language?: AppLanguage;
  onChangeLanguage?: (lang: AppLanguage) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  language = 'bn',
  onChangeLanguage,
}) => {
  const [cacheClearMessage, setCacheClearMessage] = useState<string | null>(null);
  const isBangla = language === 'bn';

  const handleClearAudioCache = async () => {
    if ('caches' in window) {
      try {
        await caches.delete('quran-audio-cache');
        setCacheClearMessage(
          isBangla
            ? 'অফলাইন অডিও ক্যাশ সফলভাবে মুছে ফেলা হয়েছে।'
            : 'Offline audio cache successfully cleared.'
        );
        setTimeout(() => setCacheClearMessage(null), 3000);
      } catch (e) {
        console.error('Error clearing audio cache:', e);
      }
    } else {
      setCacheClearMessage(
        isBangla
          ? 'ক্যাশ স্টোরেজ সমর্থিত নয় বা খালি।'
          : 'Cache storage not supported or already empty.'
      );
      setTimeout(() => setCacheClearMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 p-6 text-white text-center shadow-lg border border-emerald-800/40">
        <div className="max-w-md mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 px-3 py-1 rounded-full bg-emerald-900/60 border border-amber-400/30 mb-2">
            <Sliders className="w-3.5 h-3.5" />
            {isBangla ? 'পছন্দ ও কনফিগারেশন' : 'Preferences & Configuration'}
          </span>
          <h2 className="text-2xl font-bold tracking-tight">
            {isBangla ? 'অ্যাপ সেটিংস' : 'App Settings'}
          </h2>
          <p className="text-xs text-emerald-200/90 mt-1">
            {isBangla
              ? 'ভাষা, ক্বারী নির্বাচন, ফন্ট সাইজ, উচ্চারণ ও থিম কাস্টমাইজেশন'
              : 'Language, reciter selection, font sizes, transliteration, and theme'}
          </p>
        </div>
      </div>

      {/* Language Selection Card */}
      <div
        id="settings-language-card"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isBangla ? 'অ্যাপের ভাষা (Language)' : 'Application Language'}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            {isBangla ? 'বাংলা সক্রিয়' : 'English Active'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isBangla
            ? 'অ্যাপের সমস্ত মেনু, অনুবাদ, দোয়া ও নামাজের তথ্যের ভাষা নির্বাচন করুন:'
            : 'Select the primary language for all menus, translations, supplications, and prayer times:'}
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            id="settings-lang-bn"
            onClick={() => onChangeLanguage && onChangeLanguage('bn')}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
              isBangla
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="font-bold text-sm">বাংলা</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">Bengali Language</div>
            </div>
            {isBangla && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
          </button>

          <button
            type="button"
            id="settings-lang-en"
            onClick={() => onChangeLanguage && onChangeLanguage('en')}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
              !isBangla
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="font-bold text-sm">English</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">ইংরেজি সংস্করণ</div>
            </div>
            {!isBangla && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
          </button>
        </div>
      </div>

      {/* Reciter (Qari) Selection */}
      <div
        id="settings-reciter-card"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
      >
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isBangla ? 'প্রিয় ক্বারী / তিলাওয়াতকারী নির্বাচন' : 'Select Preferred Reciter / Qari'}
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isBangla
            ? 'কুরআন তিলাওয়াত শোনার জন্য বিশ্বমানের বিশিষ্ট ক্বারীদের নির্বাচন করুন:'
            : 'Choose from world-renowned reciters for audio playback:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RECITERS.map((qari: Qari) => {
            const isSelected = settings.selectedQariId === qari.id;

            return (
              <div
                key={qari.id}
                onClick={() => onUpdateSettings({ selectedQariId: qari.id })}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div>
                  <h4 className="font-bold text-xs">
                    {isBangla ? qari.nameBangla : qari.nameEnglish}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {isBangla ? qari.nameEnglish : qari.nameBangla}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Font Size & Display Preferences */}
      <div
        id="settings-font-card"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isBangla ? 'ফন্ট সাইজ ও পাঠ্য প্রদর্শন' : 'Font Size & Reading Preferences'}
          </h3>
        </div>

        {/* Arabic Font Size Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">
              {isBangla ? 'আরবি ফন্ট সাইজ:' : 'Arabic Font Size:'}
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {settings.arabicFontSize}px
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="42"
            value={settings.arabicFontSize}
            onChange={(e) => onUpdateSettings({ arabicFontSize: Number(e.target.value) })}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div
            className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 font-arabic text-emerald-900 dark:text-emerald-200"
            style={{ fontSize: `${settings.arabicFontSize}px` }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        </div>

        {/* Translation Font Size Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">
              {isBangla ? 'অনুবাদ ফন্ট সাইজ:' : 'Translation Font Size:'}
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {settings.banglaFontSize}px
            </span>
          </div>
          <input
            type="range"
            min="12"
            max="22"
            value={settings.banglaFontSize}
            onChange={(e) => onUpdateSettings({ banglaFontSize: Number(e.target.value) })}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div
            className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            style={{ fontSize: `${settings.banglaFontSize}px` }}
          >
            {isBangla
              ? 'পরম করুণাময় ও অসীম দয়ালু আল্লাহর নামে শুরু করছি'
              : 'In the name of Allah, the Entirely Merciful, the Especially Merciful'}
          </div>
          {settings.showPronunciation && (
            <div className="text-center p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 text-xs border border-emerald-200/50 dark:border-emerald-800/40">
              <span className="font-bold mr-1">{isBangla ? 'উচ্চারণ:' : 'Pronunciation:'}</span>{' '}
              {isBangla ? 'বিসমিল্লাহির রাহমানির রাহীম' : 'Bismillāhir-Raḥmānir-Raḥīm'}
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-800 dark:text-slate-200 font-medium block">
                {isBangla
                  ? 'উচ্চারণ / ট্রান্সলিটারেশন প্রদর্শন'
                  : 'Show Transliteration / Pronunciation'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isBangla
                  ? 'আরবি পড়তে সহায়ক স্পষ্ট উচ্চারণ'
                  : 'Assists with pronunciation of verses'}
              </span>
            </div>
            <button
              id="settings-toggle-pronunciation"
              onClick={() => onUpdateSettings({ showPronunciation: !settings.showPronunciation })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                settings.showPronunciation ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                  settings.showPronunciation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-800 dark:text-slate-200 font-medium block">
                {isBangla ? 'শব্দার্থে অর্থ প্রদর্শন (ব্র্যাকেটে)' : 'Word-by-Word Meaning (In Brackets)'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isBangla ? 'প্রতিটি শব্দের নিচে বন্ধনীতে অর্থ প্রদর্শন' : 'Display meaning of each word under the word in brackets'}
              </span>
            </div>
            <button
              id="settings-toggle-wbw-meaning"
              onClick={() => onUpdateSettings({ showWordMeaning: !(settings.showWordMeaning ?? true) })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                (settings.showWordMeaning ?? true) ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                  (settings.showWordMeaning ?? true) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-800 dark:text-slate-200 font-medium block">
                {isBangla ? 'পূর্ণ আয়াতের ভাবার্থ প্রদর্শন' : 'Show Full Verse Translation'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isBangla ? 'সম্পূর্ণ আয়াতের একত্রীভূত অনুবাদ সর্বদা উন্মুক্ত রাখা' : 'Keep complete verse translation expanded'}
              </span>
            </div>
            <button
              id="settings-toggle-full-translation"
              onClick={() => onUpdateSettings({ showFullAyahTranslation: !settings.showFullAyahTranslation })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                settings.showFullAyahTranslation ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                  settings.showFullAyahTranslation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Storage & Cache Management */}
      <div
        id="settings-storage-card"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
      >
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isBangla ? 'অফলাইন স্টোরেজ ও ক্যাশ ব্যবস্থাপনা' : 'Offline Storage & Cache Management'}
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isBangla
            ? 'ডাউনলোডকৃত অফলাইন অডিও ফাইল আপনার ডিভাইসের মেমোরিতে সংরক্ষিত থাকে যাতে ইন্টারনেট ছাড়া শোনা যায়।'
            : 'Downloaded offline audio files are stored in your device memory for seamless listening without internet.'}
        </p>

        {cacheClearMessage && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg">
            {cacheClearMessage}
          </p>
        )}

        <button
          onClick={handleClearAudioCache}
          className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-semibold hover:bg-rose-100 transition"
        >
          {isBangla ? 'অফলাইন অডিও ক্যাশ পরিষ্কার করুন' : 'Clear Offline Audio Cache'}
        </button>
      </div>
    </div>
  );
};
