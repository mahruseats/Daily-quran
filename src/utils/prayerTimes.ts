import { CityLocation, PrayerTimeData } from '../types';

export const BANGLADESH_CITIES: CityLocation[] = [
  { nameBangla: 'ঢাকা (Dhaka)', nameEnglish: 'Dhaka', lat: 23.8103, lng: 90.4125, timezone: 6 },
  { nameBangla: 'চট্টগ্রাম (Chattogram)', nameEnglish: 'Chattogram', lat: 22.3569, lng: 91.7832, timezone: 6 },
  { nameBangla: 'সিলেট (Sylhet)', nameEnglish: 'Sylhet', lat: 24.8949, lng: 91.8687, timezone: 6 },
  { nameBangla: 'রাজশাহী (Rajshahi)', nameEnglish: 'Rajshahi', lat: 24.3636, lng: 88.6241, timezone: 6 },
  { nameBangla: 'খুলনা (Khulna)', nameEnglish: 'Khulna', lat: 22.8456, lng: 89.5403, timezone: 6 },
  { nameBangla: 'বরিশাল (Barishal)', nameEnglish: 'Barishal', lat: 22.7010, lng: 90.3535, timezone: 6 },
  { nameBangla: 'রংপুর (Rangpur)', nameEnglish: 'Rangpur', lat: 25.7439, lng: 89.2752, timezone: 6 },
  { nameBangla: 'ময়মনসিংহ (Mymensingh)', nameEnglish: 'Mymensingh', lat: 24.7471, lng: 90.4203, timezone: 6 },
  { nameBangla: 'বগুড়া (Bogura)', nameEnglish: 'Bogura', lat: 24.8465, lng: 89.3777, timezone: 6 },
  { nameBangla: 'কুমিল্লা (Cumilla)', nameEnglish: 'Cumilla', lat: 23.4682, lng: 91.1788, timezone: 6 },
  { nameBangla: 'কক্সবাজার (Cox\'s Bazar)', nameEnglish: 'Cox\'s Bazar', lat: 21.4272, lng: 92.0058, timezone: 6 },
  { nameBangla: 'মক্কা মুকাররমা (Makkah)', nameEnglish: 'Makkah', lat: 21.4225, lng: 39.8262, timezone: 3 },
  { nameBangla: 'মদিনা মুনাওয়ারা (Madinah)', nameEnglish: 'Madinah', lat: 24.5247, lng: 39.5692, timezone: 3 },
];

/**
 * Astronomical Prayer Time Calculator (University of Islamic Sciences, Karachi method / Islamic Foundation BD compatible)
 */
export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  timezone: number,
  hanafiAsr = true
): {
  times: PrayerTimeData;
  nextPrayer: {
    nameBangla: string;
    nameEnglish: string;
    time: string;
    remainingText: string;
    remainingTextBangla: string;
    remainingTextEnglish: string;
    isPast: boolean;
  };
} {
  const d = new Date(date);
  const dayOfYear = getDayOfYear(d);

  // Solar declination and equation of time
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const equationOfTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // in minutes
  const solarDeclination = 23.45 * Math.sin(((dayOfYear - 81) * 360 / 365) * (Math.PI / 180)); // in degrees

  const radLat = lat * (Math.PI / 180);
  const radDec = solarDeclination * (Math.PI / 180);

  // Solar noon (Dhuhr)
  const solarNoon = 12 + timezone - (lng / 15) - (equationOfTime / 60);

  // Helper to calculate hour angle for a given altitude angle
  const getHourAngle = (angle: number): number => {
    const radAngle = angle * (Math.PI / 180);
    const cosHA = (Math.sin(radAngle) - Math.sin(radLat) * Math.sin(radDec)) / (Math.cos(radLat) * Math.cos(radDec));
    if (cosHA < -1 || cosHA > 1) return 0;
    return (Math.acos(cosHA) * 180 / Math.PI) / 15;
  };

  // Karachi / BD parameters:
  // Fajr twilight angle: -18°
  // Sunrise angle: -0.833°
  // Maghrib / Sunset: -0.833°
  // Isha angle: -18°
  const haFajr = getHourAngle(-18);
  const haSun = getHourAngle(-0.833);
  const haIsha = getHourAngle(-18);

  // Asr calculation (shadow factor: 1 for Shafi'i, 2 for Hanafi)
  const shadowFactor = hanafiAsr ? 2 : 1;
  const asrAngleRad = Math.atan(1 / (shadowFactor + Math.tan(Math.abs(radLat - radDec))));
  const asrAngleDeg = asrAngleRad * (180 / Math.PI);
  const haAsr = getHourAngle(asrAngleDeg);

  const fajrHours = solarNoon - haFajr;
  const sunriseHours = solarNoon - haSun;
  const dhuhrHours = solarNoon + 4 / 60; // 4 minutes precautionary delay
  const asrHours = solarNoon + haAsr;
  const maghribHours = solarNoon + haSun + 2 / 60; // 2 minutes precautionary
  const ishaHours = solarNoon + haIsha;

  // Format decimal hours to 12-hour AM/PM string
  const formatTime = (hours: number): string => {
    let h = Math.floor(hours);
    let m = Math.round((hours - h) * 60);
    if (m === 60) {
      h += 1;
      m = 0;
    }
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const padM = m.toString().padStart(2, '0');
    return `${displayH}:${padM} ${period}`;
  };

  // Convert hours to Date object for today
  const hoursToDate = (hours: number): Date => {
    const t = new Date(d);
    let h = Math.floor(hours);
    let m = Math.round((hours - h) * 60);
    if (m === 60) {
      h += 1;
      m = 0;
    }
    t.setHours(h, m, 0, 0);
    return t;
  };

  const times: PrayerTimeData = {
    fajr: formatTime(fajrHours),
    sunrise: formatTime(sunriseHours),
    dhuhr: formatTime(dhuhrHours),
    asr: formatTime(asrHours),
    maghrib: formatTime(maghribHours),
    isha: formatTime(ishaHours),
    tahajjud: formatTime(fajrHours - 1.5),
    sehri: formatTime(fajrHours - 0.15), // ~9 mins before Fajr
    iftar: formatTime(maghribHours),
  };

  // Determine current & next prayer
  const now = new Date();
  const prayerSchedule = [
    { key: 'fajr', nameBangla: 'ফজর', nameEnglish: 'Fajr', date: hoursToDate(fajrHours) },
    { key: 'sunrise', nameBangla: 'সূর্যোদয়', nameEnglish: 'Sunrise', date: hoursToDate(sunriseHours) },
    { key: 'dhuhr', nameBangla: 'যোহর', nameEnglish: 'Dhuhr', date: hoursToDate(dhuhrHours) },
    { key: 'asr', nameBangla: 'আসর', nameEnglish: 'Asr', date: hoursToDate(asrHours) },
    { key: 'maghrib', nameBangla: 'মাগরিব', nameEnglish: 'Maghrib', date: hoursToDate(maghribHours) },
    { key: 'isha', nameBangla: 'ইশা', nameEnglish: 'Isha', date: hoursToDate(ishaHours) },
  ];

  let nextP = prayerSchedule.find((p) => p.date.getTime() > now.getTime());
  let isTomorrow = false;

  if (!nextP) {
    // Next is tomorrow's Fajr
    const tomorrowFajr = new Date(hoursToDate(fajrHours));
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    nextP = { key: 'fajr', nameBangla: 'ফজর (আগামীকাল)', nameEnglish: 'Fajr (Tomorrow)', date: tomorrowFajr };
    isTomorrow = true;
  }

  const diffMs = nextP.date.getTime() - now.getTime();
  const diffMinutesTotal = Math.max(0, Math.floor(diffMs / 60000));
  const diffH = Math.floor(diffMinutesTotal / 60);
  const diffM = diffMinutesTotal % 60;

  const toBanglaNum = (num: number) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map((c) => bnDigits[parseInt(c, 10)] ?? c).join('');
  };

  const remainingTextBangla = `${toBanglaNum(diffH)} ঘণ্টা ${toBanglaNum(diffM)} মিনিট বাকি`;
  const remainingTextEnglish = `${diffH}h ${diffM}m left`;

  return {
    times,
    nextPrayer: {
      nameBangla: nextP.nameBangla,
      nameEnglish: nextP.nameEnglish,
      time: times[nextP.key as keyof PrayerTimeData] || formatTime(fajrHours),
      remainingText: remainingTextBangla,
      remainingTextBangla,
      remainingTextEnglish,
      isPast: isTomorrow,
    },
  };
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Calculate Qibla bearing from current coordinates to Kaaba (21.4225° N, 39.8262° E)
 */
export function calculateQiblaDirection(userLat: number, userLng: number): number {
  const kaabaLat = 21.422487 * (Math.PI / 180);
  const kaabaLng = 39.826206 * (Math.PI / 180);

  const phiK = kaabaLat;
  const lambdaK = kaabaLng;
  const phi = userLat * (Math.PI / 180);
  const lambda = userLng * (Math.PI / 180);

  const deltaLambda = lambdaK - lambda;

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(deltaLambda);

  let qiblaRad = Math.atan2(y, x);
  let qiblaDeg = (qiblaRad * 180) / Math.PI;
  qiblaDeg = (qiblaDeg + 360) % 360;

  return Math.round(qiblaDeg * 10) / 10;
}
