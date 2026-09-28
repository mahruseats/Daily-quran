import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Sparkles,
  Navigation,
  Sun,
  Moon,
} from 'lucide-react';
import { BANGLADESH_CITIES, calculatePrayerTimes } from '../utils/prayerTimes';
import { CityLocation, AppLanguage } from '../types';

interface PrayerTimesViewProps {
  selectedDistrict: string;
  onSelectDistrict: (name: string) => void;
  language?: AppLanguage;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({
  selectedDistrict,
  onSelectDistrict,
  language = 'bn',
  darkMode = false,
  onToggleDarkMode,
}) => {
  const isBangla = language === 'bn';

  const [currentCity, setCurrentCity] = useState<CityLocation>(() => {
    const found = BANGLADESH_CITIES.find((c) => c.nameEnglish === selectedDistrict);
    return found || BANGLADESH_CITIES[0];
  });

  const [useHanafiAsr, setUseHanafiAsr] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const prayerCalc = useMemo(() => {
    return calculatePrayerTimes(
      currentTime,
      currentCity.lat,
      currentCity.lng,
      currentCity.timezone,
      useHanafiAsr
    );
  }, [currentTime, currentCity, useHanafiAsr]);

  const handleCityChange = (cityName: string) => {
    const city = BANGLADESH_CITIES.find((c) => c.nameEnglish === cityName);
    if (city) {
      setCurrentCity(city);
      onSelectDistrict(city.nameEnglish);
    }
  };

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError(
        isBangla
          ? 'আপনার ব্রাউজারে জিপিএস অবস্থান সমর্থিত নয়।'
          : 'GPS geolocation is not supported on your browser.'
      );
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const customCity: CityLocation = {
          nameBangla: 'আমার বর্তমান অবস্থান',
          nameEnglish: 'Current Location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timezone: -new Date().getTimezoneOffset() / 60,
        };
        setCurrentCity(customCity);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        setGeoError(
          isBangla
            ? 'অবস্থান চিহ্নিত করা যায়নি। অনুগ্রহ করে তালিকা থেকে জেলা নির্বাচন করুন।'
            : 'Could not detect location. Please select a city from the list.'
        );
      }
    );
  };

  const prayerCards = [
    {
      key: 'fajr',
      name: isBangla ? 'ফজর' : 'Fajr',
      matchName: 'ফজর',
      time: prayerCalc.times.fajr,
      icon: Moon,
      desc: isBangla ? 'প্রভাতকালীন সালাত' : 'Dawn Prayer',
    },
    {
      key: 'sunrise',
      name: isBangla ? 'সূর্যোদয়' : 'Sunrise',
      matchName: 'সূর্যোদয়',
      time: prayerCalc.times.sunrise,
      icon: Sun,
      desc: isBangla ? 'নিষিদ্ধ সময় শেষ' : 'Prohibited prayer ends',
    },
    {
      key: 'dhuhr',
      name: isBangla ? 'যোহর' : 'Dhuhr',
      matchName: 'যোহর',
      time: prayerCalc.times.dhuhr,
      icon: Sun,
      desc: isBangla ? 'মধ্যাহ্ন সালাত' : 'Noon Prayer',
    },
    {
      key: 'asr',
      name: isBangla ? 'আসর' : 'Asr',
      matchName: 'আসর',
      time: prayerCalc.times.asr,
      icon: Sun,
      desc: isBangla ? 'অপরাহ্ন সালাত' : 'Afternoon Prayer',
    },
    {
      key: 'maghrib',
      name: isBangla ? 'মাগরিব' : 'Maghrib',
      matchName: 'মাগরিব',
      time: prayerCalc.times.maghrib,
      icon: Moon,
      desc: isBangla ? 'সূর্যাস্ত ও ইফতার' : 'Sunset & Iftar',
    },
    {
      key: 'isha',
      name: isBangla ? 'ইশা' : 'Isha',
      matchName: 'ইশা',
      time: prayerCalc.times.isha,
      icon: Moon,
      desc: isBangla ? 'রাত্রিকালীন সালাত' : 'Night Prayer',
    },
  ];

  // Localized next prayer name and remaining time
  const nextPrayerName = isBangla
    ? prayerCalc.nextPrayer.nameBangla
    : prayerCalc.nextPrayer.nameEnglish;

  const nextPrayerRemaining = isBangla
    ? prayerCalc.nextPrayer.remainingTextBangla
    : prayerCalc.nextPrayer.remainingTextEnglish;

  return (
    <div className="space-y-4 pb-28">
      {/* Next Prayer Countdown Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 p-6 text-white text-center shadow-lg border border-emerald-800/40">
        <div className="relative z-10 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isBangla ? 'পরবর্তী সালাত' : 'Upcoming Prayer'}</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white">
            {nextPrayerName}
          </h2>

          <div className="text-4xl font-black text-amber-400 font-mono tracking-wider my-2">
            {prayerCalc.nextPrayer.time}
          </div>

          <p className="text-sm font-medium text-emerald-200/90">
            {nextPrayerRemaining}
          </p>

          <div className="mt-4 pt-3 border-t border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300/80 px-2">
            <span>
              {isBangla ? 'সেহরি শেষ:' : 'Sehri Ends:'}{' '}
              <strong className="text-white font-mono">{prayerCalc.times.sehri}</strong>
            </span>
            <span>•</span>
            <span>
              {isBangla ? 'ইফতার:' : 'Iftar:'}{' '}
              <strong className="text-white font-mono">{prayerCalc.times.iftar}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Location Selector & Geolocation */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isBangla ? 'নামাজের স্থান / জেলা:' : 'Prayer Location / District:'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              id="district-selector"
              value={currentCity.nameEnglish}
              onChange={(e) => handleCityChange(e.target.value)}
              className="text-xs font-semibold py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {BANGLADESH_CITIES.map((city) => (
                <option key={city.nameEnglish} value={city.nameEnglish}>
                  {isBangla ? city.nameBangla : city.nameEnglish}
                </option>
              ))}
            </select>

            <button
              onClick={handleUseGeolocation}
              disabled={geoLoading}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
              title={isBangla ? 'আমার জিপিএস অবস্থান ব্যবহার করুন' : 'Use GPS location'}
            >
              <Navigation className="w-3 h-3" />
              <span className="hidden sm:inline">{isBangla ? 'জিপিএস' : 'GPS'}</span>
            </button>

            {/* Wide toggle beside the location changer */}
            {onToggleDarkMode && (
              <button
                type="button"
                id="btn-prayer-times-dark-toggle"
                onClick={onToggleDarkMode}
                role="switch"
                aria-checked={darkMode}
                aria-label={isBangla ? 'ডার্ক মোড টগল' : 'Toggle Dark Mode'}
                title={
                  isBangla
                    ? (darkMode ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন')
                    : (darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode')
                }
                className={`relative inline-flex items-center w-14 h-6 rounded-full p-0.5 transition-colors duration-300 cursor-pointer select-none shrink-0 border ${
                  darkMode
                    ? 'bg-slate-800 border-indigo-400/60 shadow-inner'
                    : 'bg-slate-200 border-amber-400/60 shadow-inner'
                }`}
              >
                <Sun
                  className={`w-3 h-3 absolute left-1.5 transition-opacity duration-200 ${
                    darkMode ? 'opacity-30 text-slate-400' : 'opacity-100 text-amber-500'
                  }`}
                />
                <Moon
                  className={`w-3 h-3 absolute right-1.5 transition-opacity duration-200 ${
                    darkMode ? 'opacity-100 text-amber-400' : 'opacity-30 text-slate-400'
                  }`}
                />
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-amber-400 shadow-md transform transition-transform duration-300 ${
                    darkMode ? 'translate-x-7.5 text-slate-900' : 'translate-x-0.5 text-amber-600'
                  }`}
                >
                  {darkMode ? (
                    <Moon className="w-3 h-3 text-slate-950 stroke-[2.5]" />
                  ) : (
                    <Sun className="w-3 h-3 text-amber-600 stroke-[2.5]" />
                  )}
                </span>
              </button>
            )}
          </div>
        </div>

        {geoError && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
            {geoError}
          </p>
        )}

        {/* Asr Mazhab toggle & Live Qibla quick trigger */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 dark:text-slate-400">
              {isBangla ? 'আসরের সময়:' : 'Asr Method:'}
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => setUseHanafiAsr(true)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  useHanafiAsr
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {isBangla ? 'হানাফী' : 'Hanafi'}
              </button>
              <button
                onClick={() => setUseHanafiAsr(false)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  !useHanafiAsr
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {isBangla ? 'অন্যান্য' : 'Standard'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Daily Prayer Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {prayerCards.map((item) => {
          const isNext = prayerCalc.nextPrayer.nameBangla.includes(item.matchName);
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              id={`prayer-card-${item.key}`}
              className={`rounded-2xl p-3.5 border transition ${
                isNext
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {item.name}
                </span>
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isNext ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {item.time}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {item.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Extra Times: Tahajjud, Sehri, Iftar */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-3.5 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-around text-center text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
            {isBangla ? 'তাহাজ্জুদ' : 'Tahajjud'}
          </span>
          <strong className="text-emerald-800 dark:text-emerald-400 font-mono text-sm block mt-0.5">
            {prayerCalc.times.tahajjud}
          </strong>
        </div>
        <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
            {isBangla ? 'সেহরি শেষ' : 'Sehri Ends'}
          </span>
          <strong className="text-emerald-800 dark:text-emerald-400 font-mono text-sm block mt-0.5">
            {prayerCalc.times.sehri}
          </strong>
        </div>
        <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
            {isBangla ? 'ইফতার শুরু' : 'Iftar Starts'}
          </span>
          <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm block mt-0.5">
            {prayerCalc.times.iftar}
          </strong>
        </div>
      </div>
    </div>
  );
};
