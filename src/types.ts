export interface SurahMeta {
  number: number;
  nameArabic: string;
  nameBangla: string;
  nameEnglish: string;
  meaningBangla: string;
  revelationType: 'মাক্কী' | 'মাদানী';
  numberOfAyahs: number;
  pageNumber: number;
  rukuCount: number;
}

export interface QuranWord {
  id?: number;
  position?: number;
  textArabic: string;
  textBanglaMeaning?: string;
  textEnglishMeaning?: string;
  transliteration?: string;
  charType?: string; // 'word' | 'end'
}

export interface Ayah {
  number: number; // overall number (1..6236)
  numberInSurah: number;
  textArabic: string;
  textBanglaPronunciation: string;
  textEnglishPronunciation?: string;
  textBanglaTranslation: string;
  textEnglishTranslation?: string;
  words?: QuranWord[];
  tafsirBangla?: string;
  tafsirEnglish?: string;
  audioUrl?: string;
  juz: number;
  sajdah?: boolean;
}

export interface SurahDetail extends SurahMeta {
  ayahs: Ayah[];
  bismillahPre: boolean;
}

export interface RabbanaDua {
  id: number;
  arabic: string;
  pronunciationBangla: string;
  pronunciationEnglish?: string;
  translationBangla: string;
  translationEnglish?: string;
  surahNameBangla: string;
  surahNameEnglish?: string;
  surahNameArabic: string;
  ayahReference: string;
  significanceBangla: string;
  significanceEnglish?: string;
  audioUrl: string;
}

export interface Bookmark {
  id: string;
  surahNumber: number;
  surahNameBangla: string;
  ayahNumber: number;
  textArabic: string;
  textBangla: string;
  category: 'দৈনিক পাঠ' | 'মুখস্থ' | 'পছন্দ' | 'দোয়া' | 'Daily Reading' | 'Memorization' | 'Favorites' | 'Dua' | 'Duas';
  createdAt: number;
  note?: string;
}

export interface LastRead {
  surahNumber: number;
  surahNameBangla: string;
  ayahNumber: number;
  timestamp: number;
}

export interface DailyGoalProgress {
  targetAyahs: number;
  readAyahsToday: number;
  lastReadDate: string; // YYYY-MM-DD
  lastActiveDate?: string; // YYYY-MM-DD
  currentStreak: number;
  totalAyahsRead: number;
  completedSurahs: number[];
  readingHistory: { [date: string]: number }; // date -> ayahs read
}

export interface PrayerTimeData {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  tahajjud: string;
  sehri: string;
  iftar: string;
}

export interface CityLocation {
  nameBangla: string;
  nameEnglish: string;
  lat: number;
  lng: number;
  timezone: number;
}

export interface Qari {
  id: string;
  nameEnglish: string;
  nameBangla: string;
  subfolder: string;
  serverUrl: string;
}

export type AppLanguage = 'bn' | 'en';

export interface AppSettings {
  darkMode?: boolean;
  language?: AppLanguage;
  arabicFontSize: number; // 22..48
  banglaFontSize: number; // 14..26
  showPronunciation: boolean;
  showTranslation: boolean;
  showWordMeaning?: boolean;
  showFullAyahTranslation?: boolean;
  selectedQariId: string;
  playbackSpeed?: number;
  district?: string;
  selectedDistrict?: string;
  hanafiAsr?: boolean;
  autoPlayNext?: boolean;
  autoPlayNextAyah?: boolean;
  repeatMode?: 'none' | 'ayah' | 'surah';
  dailyAyahTarget?: number;
}
