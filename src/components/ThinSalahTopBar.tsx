import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, ChevronDown, Sun, Moon, Languages } from 'lucide-react';
import { BANGLADESH_CITIES, calculatePrayerTimes } from '../utils/prayerTimes';
import { CityLocation, AppLanguage } from '../types';

interface ThinSalahTopBarProps {
  selectedDistrict?: string;
  onSelectDistrict?: (district: string) => void;
  language?: AppLanguage;
  onToggleLanguage?: (lang: AppLanguage) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const ThinSalahTopBar: React.FC<ThinSalahTopBarProps> = ({
  selectedDistrict = 'Dhaka',
  onSelectDistrict,
  language = 'bn',
  onToggleLanguage,
  darkMode = false,
  onToggleDarkMode,
}) => {
  const isBangla = language === 'bn';

  const [currentCity, setCurrentCity] = useState<CityLocation>(() => {
    const found = BANGLADESH_CITIES.find((c) => c.nameEnglish === selectedDistrict);
    return found || BANGLADESH_CITIES[0];
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (selectedDistrict) {
      const found = BANGLADESH_CITIES.find((c) => c.nameEnglish === selectedDistrict);
      if (found) setCurrentCity(found);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    // Update every minute (or 10 seconds)
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const prayerCalc = useMemo(() => {
    return calculatePrayerTimes(
      currentTime,
      currentCity.lat,
      currentCity.lng,
      currentCity.timezone,
      true
    );
  }, [currentTime, currentCity]);

  const prayers = [
    {
      key: 'fajr',
      nameBn: 'ফজর',
      nameEn: 'Fajr',
      time: prayerCalc.times.fajr,
    },
    {
      key: 'sunrise',
      nameBn: 'সূর্যোদয়',
      nameEn: 'Sunrise',
      time: prayerCalc.times.sunrise,
    },
    {
      key: 'dhuhr',
      nameBn: 'যোহর',
      nameEn: 'Dhuhr',
      time: prayerCalc.times.dhuhr,
    },
    {
      key: 'asr',
      nameBn: 'আসর',
      nameEn: 'Asr',
      time: prayerCalc.times.asr,
    },
    {
      key: 'maghrib',
      nameBn: 'মাগরিব',
      nameEn: 'Maghrib',
      time: prayerCalc.times.maghrib,
    },
    {
      key: 'isha',
      nameBn: 'ইশা',
      nameEn: 'Isha',
      time: prayerCalc.times.isha,
    },
  ];

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    const city = BANGLADESH_CITIES.find((c) => c.nameEnglish === cityName);
    if (city) {
      setCurrentCity(city);
      if (onSelectDistrict) onSelectDistrict(city.nameEnglish);
    }
  };

  return (
    <div
      id="thin-salah-top-bar"
      className="w-full bg-emerald-950 dark:bg-slate-900 border-b border-emerald-800/40 text-white shadow-xs select-none"
    >
      <div className="max-w-4xl mx-auto px-2 py-1">
        {/* Micro Utility Bar: District selector, wide night mode toggle, and Bangla/English language switcher */}
        <div className="flex items-center justify-between gap-1 text-[11px] pb-1 border-b border-emerald-800/30">
          <div className="flex items-center gap-1.5 shrink-0">
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            <div className="relative">
              <select
                id="thin-salah-city-select"
                value={currentCity.nameEnglish}
                onChange={handleCityChange}
                aria-label={isBangla ? 'জেলা নির্বাচন' : 'Select District'}
                className="bg-emerald-900/90 dark:bg-slate-800 text-amber-300 font-bold text-[11px] rounded pl-1.5 pr-4 py-0.5 border border-emerald-700/60 dark:border-slate-700 appearance-none focus:outline-hidden cursor-pointer"
              >
                {BANGLADESH_CITIES.map((city) => (
                  <option key={city.nameEnglish} value={city.nameEnglish} className="bg-slate-900 text-white">
                    {isBangla ? city.nameBangla : city.nameEnglish}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-2.5 h-2.5 text-amber-300 absolute right-1 top-1.5 pointer-events-none" />
            </div>

            {/* Wide night mode toggle directly beside the location changer */}
            {onToggleDarkMode && (
              <button
                type="button"
                id="btn-salah-bar-dark-toggle"
                onClick={onToggleDarkMode}
                role="switch"
                aria-checked={darkMode}
                aria-label={isBangla ? 'ডার্ক মোড টগল' : 'Toggle Dark Mode'}
                title={
                  isBangla
                    ? (darkMode ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন')
                    : (darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode')
                }
                className={`relative inline-flex items-center w-12 sm:w-14 h-5 sm:h-5.5 rounded-full p-0.5 transition-all duration-300 cursor-pointer select-none shrink-0 border ${
                  darkMode
                    ? 'bg-slate-800 border-indigo-400/60 shadow-inner ring-1 ring-indigo-400/30'
                    : 'bg-emerald-900 border-amber-400/60 shadow-inner ring-1 ring-amber-400/30'
                }`}
              >
                <Sun
                  className={`w-2.5 h-2.5 absolute left-1 transition-opacity duration-200 ${
                    darkMode ? 'opacity-25 text-slate-400' : 'opacity-100 text-amber-300'
                  }`}
                />
                <Moon
                  className={`w-2.5 h-2.5 absolute right-1 transition-opacity duration-200 ${
                    darkMode ? 'opacity-100 text-amber-300' : 'opacity-25 text-emerald-300'
                  }`}
                />
                <span
                  className={`inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white dark:bg-amber-400 shadow-md transform transition-transform duration-300 ${
                    darkMode ? 'translate-x-6 sm:translate-x-7.5 text-slate-900' : 'translate-x-0.5 text-amber-600'
                  }`}
                >
                  {darkMode ? (
                    <Moon className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-slate-950 stroke-[2.5]" />
                  ) : (
                    <Sun className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-amber-600 stroke-[2.5]" />
                  )}
                </span>
              </button>
            )}
          </div>

          {/* Replaced incoming prayer time and Qibla button with Bangla and English language toggle */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <div
              id="topbar-language-toggle"
              className="inline-flex items-center p-0.5 rounded-lg bg-emerald-900/90 dark:bg-slate-800 border border-emerald-700/60 dark:border-slate-700 shadow-xs"
              title={isBangla ? 'ভাষা ও অনুবাদ পরিবর্তন: বাংলা / English' : 'Change Language & Translation: Bangla / English'}
            >
              <Languages className="w-3 h-3 text-amber-400 ml-1 mr-0.5 hidden xs:inline" />
              <button
                type="button"
                id="btn-topbar-lang-bn"
                onClick={() => onToggleLanguage && onToggleLanguage('bn')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  isBangla
                    ? 'bg-amber-400 text-emerald-950 shadow-xs'
                    : 'text-emerald-200/90 hover:text-white'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                id="btn-topbar-lang-en"
                onClick={() => onToggleLanguage && onToggleLanguage('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  !isBangla
                    ? 'bg-amber-400 text-emerald-950 shadow-xs'
                    : 'text-emerald-200/90 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* 6-Column Prayer Times Grid: FULL WIDTH, ZERO SCROLLING ON ALL PHONE SIZES */}
        <div className="grid grid-cols-6 gap-1 pt-1 text-center">
          {prayers.map((prayer) => {
            const isUpcoming = prayerCalc.nextPrayer.nameBangla === prayer.nameBn;
            // Clean display: e.g. "4:45"
            const cleanTime = prayer.time.replace(/\s*(AM|PM)/i, '');

            return (
              <div
                key={prayer.key}
                id={`thin-salah-${prayer.key}`}
                className={`flex flex-col items-center justify-center py-0.5 px-0.5 rounded transition-all ${
                  isUpcoming
                    ? 'bg-amber-400 text-emerald-950 font-black shadow-xs ring-1 ring-amber-300 scale-[1.02]'
                    : 'bg-emerald-900/40 dark:bg-slate-800/50 text-emerald-100 hover:bg-emerald-900/60'
                }`}
              >
                <span className={`text-[10px] sm:text-[11px] leading-tight block ${isUpcoming ? 'font-black text-emerald-950' : 'font-medium opacity-90'}`}>
                  {isBangla ? prayer.nameBn : prayer.nameEn}
                </span>
                <span className={`text-[11px] sm:text-xs font-mono tracking-tight leading-tight ${isUpcoming ? 'font-black text-emerald-950' : 'font-bold text-white'}`}>
                  {cleanTime}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
