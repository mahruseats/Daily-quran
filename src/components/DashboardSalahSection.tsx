import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  MapPin,
  ChevronRight,
  Navigation,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  CloudSun,
  Sparkles,
} from 'lucide-react';
import { BANGLADESH_CITIES, calculatePrayerTimes } from '../utils/prayerTimes';
import { CityLocation, AppLanguage } from '../types';

interface DashboardSalahSectionProps {
  selectedDistrict?: string;
  onSelectDistrict?: (district: string) => void;
  onOpenFullPrayerTimes?: () => void;
  language?: AppLanguage;
}

export const DashboardSalahSection: React.FC<DashboardSalahSectionProps> = ({
  selectedDistrict = 'Dhaka',
  onSelectDistrict,
  onOpenFullPrayerTimes,
  language = 'bn',
}) => {
  const isBangla = language === 'bn';
  const [currentCity, setCurrentCity] = useState<CityLocation>(() => {
    const found = BANGLADESH_CITIES.find((c) => c.nameEnglish === selectedDistrict);
    return found || BANGLADESH_CITIES[0];
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (selectedDistrict) {
      const found = BANGLADESH_CITIES.find((c) => c.nameEnglish === selectedDistrict);
      if (found) setCurrentCity(found);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCityChange = (cityName: string) => {
    const city = BANGLADESH_CITIES.find((c) => c.nameEnglish === cityName);
    if (city) {
      setCurrentCity(city);
      if (onSelectDistrict) {
        onSelectDistrict(city.nameEnglish);
      }
    }
  };

  const handleUseGeolocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.geolocation) return;
    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const customCity: CityLocation = {
          nameBangla: 'বর্তমান অবস্থান',
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
      }
    );
  };

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
      nameBangla: 'ফজর',
      nameEnglish: 'Fajr',
      periodBangla: 'ভোর থেকে সূর্যোদয়',
      periodEnglish: 'Dawn to Sunrise',
      time: prayerCalc.times.fajr,
      icon: Sunrise,
    },
    {
      key: 'sunrise',
      nameBangla: 'সূর্যোদয়',
      nameEnglish: 'Sunrise',
      periodBangla: 'ইশরাকের ওয়াক্ত শুরু',
      periodEnglish: 'Ishraq time begins',
      time: prayerCalc.times.sunrise,
      icon: Sun,
    },
    {
      key: 'dhuhr',
      nameBangla: 'যোহর',
      nameEnglish: 'Dhuhr',
      periodBangla: 'দুপুর থেকে আসর',
      periodEnglish: 'Noon to Asr',
      time: prayerCalc.times.dhuhr,
      icon: Sun,
    },
    {
      key: 'asr',
      nameBangla: 'আসর',
      nameEnglish: 'Asr',
      periodBangla: 'বিকাল থেকে সূর্যাস্ত',
      periodEnglish: 'Afternoon to Sunset',
      time: prayerCalc.times.asr,
      icon: CloudSun,
    },
    {
      key: 'maghrib',
      nameBangla: 'মাগরিব',
      nameEnglish: 'Maghrib',
      periodBangla: 'সূর্যাস্তের পর / ইফতার',
      periodEnglish: 'Sunset / Iftar time',
      time: prayerCalc.times.maghrib,
      icon: Sunset,
    },
    {
      key: 'isha',
      nameBangla: 'ইশা',
      nameEnglish: 'Isha',
      periodBangla: 'রাত থেকে মধ্যরাত',
      periodEnglish: 'Night to Midnight',
      time: prayerCalc.times.isha,
      icon: Moon,
    },
  ];

  const formatLiveClock = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${displayHours}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
  };

  return (
    <div
      id="dashboard-salah-vertical"
      className="rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white p-3.5 sm:p-4 shadow-lg border border-emerald-700/40 relative overflow-hidden"
    >
      {/* Decorative subtle ambient glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header: Title, Live Clock, District Selector & Qibla Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-emerald-800/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>{isBangla ? 'আজকের নামাজের সময়সূচি' : 'Today\'s Prayer Times'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <div className="text-[11px] text-emerald-300 font-mono">
              {formatLiveClock()}
            </div>
          </div>
        </div>

        {/* Controls: District Selector, GPS, and Qibla Compass Link */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* District Dropdown */}
          <div className="relative flex items-center">
            <MapPin className="w-3 h-3 text-amber-400 absolute left-2 pointer-events-none" />
            <select
              id="dash-vertical-district-select"
              value={currentCity.nameEnglish}
              onChange={(e) => handleCityChange(e.target.value)}
              className="bg-emerald-950/90 hover:bg-emerald-900 text-slate-100 text-xs pl-6 pr-6 py-1.5 rounded-xl border border-emerald-600/40 appearance-none font-medium focus:outline-hidden cursor-pointer shadow-xs"
            >
              {BANGLADESH_CITIES.map((c) => (
                <option key={c.nameEnglish} value={c.nameEnglish} className="bg-slate-900 text-white">
                  {isBangla ? c.nameBangla : c.nameEnglish}
                </option>
              ))}
            </select>
            <ChevronRight className="w-3 h-3 text-emerald-400 absolute right-1.5 pointer-events-none rotate-90" />
          </div>

          {/* GPS Quick Locate */}
          <button
            id="btn-dash-vertical-gps"
            onClick={handleUseGeolocation}
            disabled={geoLoading}
            title={isBangla ? 'বর্তমান অবস্থান (GPS)' : 'Current Location (GPS)'}
            className="p-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600/40 text-amber-300 transition disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Direct Schedule Link Button */}
          {onOpenFullPrayerTimes && (
            <button
              id="btn-dash-vertical-schedule"
              onClick={onOpenFullPrayerTimes}
              title={isBangla ? 'পূর্ণাঙ্গ সময়সূচি' : 'Full Prayer Schedule'}
              className="flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 px-2.5 py-1.5 rounded-xl transition"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{isBangla ? 'সময়সূচি' : 'Schedule'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Next Prayer Highlight Banner */}
      <div className="my-2.5 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="text-amber-300 font-bold uppercase tracking-wider text-[10px] block">
              {isBangla ? 'পরবর্তী সালাত' : 'Upcoming Prayer'}
            </span>
            <span className="font-bold text-white text-sm">
              {isBangla ? prayerCalc.nextPrayer.nameBangla : prayerCalc.nextPrayer.nameEnglish} ({prayerCalc.nextPrayer.time})
            </span>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2.5 py-1 rounded-lg">
          {prayerCalc.nextPrayer.remainingText}
        </div>
      </div>

      {/* VERTICAL Waqt Schedule List */}
      <div className="space-y-1.5 mt-2">
        {prayers.map((p) => {
          const isNext = prayerCalc.nextPrayer.nameBangla === p.nameBangla;
          const Icon = p.icon;

          return (
            <div
              key={p.key}
              id={`dash-vertical-waqt-${p.key}`}
              className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all ${
                isNext
                  ? 'bg-amber-400/20 border-amber-400/70 text-white shadow-sm ring-1 ring-amber-400/40'
                  : 'bg-emerald-950/50 hover:bg-emerald-950/70 border-emerald-800/30 text-emerald-100'
              }`}
            >
              {/* Left: Icon & Waqt Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isNext
                      ? 'bg-amber-400 text-emerald-950 font-bold'
                      : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs sm:text-sm font-bold ${isNext ? 'text-white' : 'text-slate-100'}`}>
                      {isBangla ? p.nameBangla : p.nameEnglish}
                    </span>
                    {isNext && (
                      <span className="text-[9px] font-bold text-amber-950 bg-amber-400 px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                        {isBangla ? 'পরবর্তী' : 'Next'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-300/80 truncate block">
                    {isBangla ? p.periodBangla : p.periodEnglish}
                  </span>
                </div>
              </div>

              {/* Right: Waqt Time */}
              <div className="text-right shrink-0">
                <div
                  className={`text-xs sm:text-sm font-bold font-mono tracking-tight ${
                    isNext ? 'text-amber-300 font-black' : 'text-white'
                  }`}
                >
                  {p.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Sehri & Iftar Info & View Full Qibla & Schedule CTA */}
      <div className="mt-3 pt-2.5 border-t border-emerald-800/40 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-3 text-[11px] text-emerald-200">
          <div>
            <span className="text-emerald-400 font-medium">{isBangla ? 'সেহরি শেষ: ' : 'Sehri: '}</span>
            <span className="font-mono font-bold text-white">{prayerCalc.times.sehri}</span>
          </div>
          <span className="text-emerald-700">•</span>
          <div>
            <span className="text-amber-400 font-medium">{isBangla ? 'ইফতার: ' : 'Iftar: '}</span>
            <span className="font-mono font-bold text-amber-300">{prayerCalc.times.iftar}</span>
          </div>
        </div>

        {onOpenFullPrayerTimes && (
          <button
            onClick={onOpenFullPrayerTimes}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-amber-300 transition ml-auto"
          >
            <span>{isBangla ? 'সম্পূর্ণ নামাজের সময়সূচি' : 'Full Prayer Schedule'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
