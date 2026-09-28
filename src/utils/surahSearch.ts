import { SurahMeta } from '../types';
import { SURAH_LIST } from '../data/surahList';

/**
 * Bengali digits map
 */
const BN_DIGITS: { [key: string]: string } = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function convertBnDigitsToEn(str: string): string {
  return str.replace(/[০-৯]/g, (d) => BN_DIGITS[d] || d);
}

/**
 * Clean English string: lowercase, remove dashes, apostrophes, accents, and prefixes like "surah", "al-", "an-", etc.
 */
export function normalizeEnglish(str: string): string {
  return str
    .toLowerCase()
    .replace(/[’'"`\-–—.]/g, '')
    .replace(/\b(surah|sura|chapter)\b/gi, '')
    .replace(/\b(al|an|ar|at|ad|az|as|ash)\b/gi, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Clean Bangla string: normalize vowel signs, identical sounds, remove prefixes like "সূরা", "আল-", etc.
 */
export function normalizeBangla(str: string): string {
  return str
    .replace(/[’'"`\-–—.]/g, '')
    .replace(/(সূরা|সুরা|সুরাহ|সূরাহ)/g, '')
    .replace(/(আল|আন|আর|আত|আদ|আজ|আশ|আস)/g, '')
    .replace(/ক্ব/g, 'ক')
    .replace(/ক্বা/g, 'কা')
    .replace(/ী/g, 'ি')
    .replace(/ূ/g, 'ু')
    .replace(/[ষশছ]/g, 'স')
    .replace(/ৎ/g, 'ত')
    .replace(/ত্ব/g, 'ত')
    .replace(/[যয়য়]/g, 'য')
    .replace(/ণ/g, 'ন')
    .replace(/ঃ/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Phonetic English normalization (e.g. yaseen -> yasin, falak -> falaq, rehman -> rahman)
 */
export function phoneticNormalize(str: string): string {
  return normalizeEnglish(str)
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/sh/g, 's')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/zh/g, 'z')
    .replace(/q/g, 'k')
    .replace(/c/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/v/g, 'w')
    .replace(/y/g, 'i');
}

/**
 * Compute Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio (0 to 1) based on Levenshtein distance
 */
export function similarityRatio(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;

  // Substring bonus
  if (longer.includes(shorter)) {
    return 0.85 + (shorter.length / longer.length) * 0.15;
  }

  const distance = levenshteinDistance(s1, s2);
  return Math.max(0, (longer.length - distance) / longer.length);
}

/**
 * Common popular nicknames / aliases / alternate transliterations
 */
const SURAH_ALIASES: { [surahNumber: number]: string[] } = {
  1: ['fatiha', 'fatihah', 'fateha', 'al fatihah', 'al fateha', 'ফাতিহা', 'ফাতিহাহ', 'উম্মুল কুরআন'],
  2: ['baqarah', 'baqara', 'bakara', 'bakarah', 'al baqarah', 'al baqara', 'বাকারা', 'বাক্বারাহ', 'গাভী'],
  3: ['imran', 'ali imran', 'aal imran', 'ইমরান', 'আলে ইমরান'],
  4: ['nisa', 'an nisa', 'nisaa', 'নিসা', 'আন নিসা', 'নারী'],
  5: ['maidah', 'maida', 'al maidah', 'মায়েদা', 'মায়িদাহ'],
  6: ['anam', 'al anam', 'আনআম', 'আনআম'],
  7: ['araf', 'al araf', 'আরাফ', 'আ’রাফ'],
  8: ['anfal', 'al anfal', 'আনফাল'],
  9: ['tawbah', 'tawba', 'tauba', 'taubah', 'তওবা', 'তাওবাহ'],
  10: ['yunus', 'ইউনুস', 'জোনাহ'],
  11: ['hud', 'হুদ'],
  12: ['yusuf', 'joseph', 'ইউসুফ'],
  13: ['rad', 'raad', 'ar rad', 'রাদ'],
  14: ['ibrahim', 'abraham', 'ইব্রাহিম', 'ইব্রাহীম'],
  15: ['hijr', 'al hijr', 'হিজর'],
  16: ['nahl', 'an nahl', 'নাহল', 'মৌমাছি'],
  17: ['isra', 'bani israel', 'israil', 'ইসরাঈল', 'ইসরা'],
  18: ['kahf', 'kahaf', 'cave', 'al kahf', 'al kahaf', 'কাহফ', 'কাহাফ', 'গুহা'],
  19: ['maryam', 'mary', 'মরিয়ম', 'মারইয়াম'],
  20: ['taha', 'ta-ha', 'taaha', 'ত্বাহা', 'ত্বা-হা'],
  21: ['anbiya', 'al anbiya', 'ambiya', 'আম্বিয়া', 'নবীগণ'],
  22: ['hajj', 'al hajj', 'হজ', 'হজ্জ'],
  23: ['muminun', 'mouminun', 'al muminun', 'মুমিনুন'],
  24: ['nur', 'noor', 'an nur', 'নূর', 'আলো'],
  25: ['furqan', 'al furqan', 'ফুরকান'],
  26: ['shuara', 'ash shuara', 'শুয়ারা'],
  27: ['naml', 'an naml', 'নামল', 'পিপড়া'],
  28: ['qasas', 'kasas', 'al qasas', 'কাসাস', 'ক্বাসাস'],
  29: ['ankabut', 'al ankabut', 'আনকাবুত', 'মাকড়সা'],
  30: ['rum', 'room', 'ar rum', 'রূম', 'রোম'],
  31: ['luqman', 'lukman', 'লুকমান'],
  32: ['sajdah', 'sajda', 'as sajdah', 'সেজদা', 'সাজদাহ'],
  33: ['ahzab', 'al ahzab', 'আহযাব'],
  34: ['saba', 'sheba', 'সাবা'],
  35: ['fatir', 'ফাতির'],
  36: ['yasin', 'yaseen', 'ya-sin', 'ya seen', 'ইয়াসিন', 'ইয়াসীন', 'ইয়াসীন'],
  37: ['saffat', 'as saffat', 'সাফফাত'],
  38: ['sad', 'soad', 'ছোয়াদ', 'সোয়াদ'],
  39: ['zumar', 'az zumar', 'যুমার', 'জুমার'],
  40: ['ghafir', 'mumin', 'গাফির'],
  41: ['fussilat', 'ফুসসিলাত'],
  42: ['shura', 'ash shura', 'শুরা'],
  43: ['zukhruf', 'যুখরুফ'],
  44: ['dukhan', 'dukan', 'ad dukhan', 'দুখান', 'ধোঁয়া'],
  45: ['jathiyah', 'jasiyah', 'জাসিয়াহ'],
  46: ['ahqaf', 'ahkaf', 'আহকাফ'],
  47: ['muhammad', 'mohammad', 'মুহাম্মদ', 'মোহাম্মদ'],
  48: ['fath', 'fatah', 'al fath', 'ফাতহ', 'বিজয়'],
  49: ['hujurat', 'al hujurat', 'হুজুরাত'],
  50: ['qaf', 'kaf', 'কাফ'],
  51: ['dhariyat', 'zariyat', 'যারিয়াত'],
  52: ['tur', 'toor', 'at tur', 'তুর', 'তূর'],
  53: ['najm', 'an najm', 'নাজম', 'তারা'],
  54: ['qamar', 'kamar', 'al qamar', 'কামার', 'চাঁদ'],
  55: ['rahman', 'rehman', 'ar rahman', 'ar rehman', 'রহমান', 'আর রহমান', 'আর-রহমান'],
  56: ['waqiah', 'waqia', 'vakiah', 'al waqiah', 'al waqia', 'ওয়াকিয়া', 'ওয়াকিয়াহ'],
  57: ['hadid', 'al hadid', 'হাদীদ', 'লোহা'],
  58: ['mujadila', 'মুজাদালাহ'],
  59: ['hashr', 'al hashr', 'হাশর'],
  60: ['mumtahanah', 'মুমতাহিনা'],
  61: ['saff', 'as saff', 'সাফ'],
  62: ['jumuah', 'jummah', 'jumma', 'জুমা', 'জুমুআ'],
  63: ['munafiqun', 'মুনাফিকুন'],
  64: ['taghabun', 'তাগাবুন'],
  65: ['talaq', 'talak', 'তালাক'],
  66: ['tahrim', 'তাহরীম'],
  67: ['mulk', 'tabarak', 'al mulk', 'tabarakallazi', 'মুলক', 'আল মুলক', 'তাবারক'],
  68: ['qalam', 'kalam', 'noon', 'নূন', 'কলম'],
  69: ['haqqah', 'hakka', 'হাক্কাহ'],
  70: ['maarij', 'মাআরিজ'],
  71: ['nuh', 'nooh', 'নূহ'],
  72: ['jinn', 'জিন'],
  73: ['muzzammil', 'মুজ্জাম্মিল', 'মুযযাম্মিল'],
  74: ['muddathir', 'মুদ্দাসসির'],
  75: ['qiyamah', 'kiyama', 'কিয়ামত', 'কিয়ামাহ'],
  76: ['insan', 'dahr', 'ইনসান', 'দাহর'],
  77: ['mursalat', 'মুরসালাত'],
  78: ['naba', 'amma', 'an naba', 'আমপারা', 'নাবা'],
  79: ['naziat', 'নাযিয়াত'],
  80: ['abasa', 'আবাসা'],
  81: ['takwir', 'তাকবীর', 'তাকভীর'],
  82: ['infitar', 'ইনফিতার'],
  83: ['mutaffifin', 'মুতাফফিফীন'],
  84: ['inshiqaq', 'ইনশিকাক'],
  85: ['buruj', 'বুরুজ'],
  86: ['tariq', 'তারিক'],
  87: ['ala', 'আলা'],
  88: ['ghashiyah', 'গাশিয়াহ'],
  89: ['fajr', 'ফজর'],
  90: ['balad', 'বালাদ', 'শহর'],
  91: ['shams', 'শামস', 'সূর্য'],
  92: ['layl', 'lail', 'লাইল', 'রাত'],
  93: ['duha', 'doha', 'ad duha', 'waddoha', 'দুহা', 'দোহা', 'দ্বোহা'],
  94: ['inshirah', 'sharh', 'alam nashrah', 'ইনশিরাহ', 'শারহ'],
  95: ['tin', 'teen', 'at tin', 'watteeni', 'তীন', 'তিন'],
  96: ['alaq', 'alak', 'iqra', 'আলাক', 'ইকরা'],
  97: ['qadr', 'kadr', 'lailatul qadr', 'কদর'],
  98: ['bayyinah', 'বাইয়্যিনাহ'],
  99: ['zalzalah', 'zilzal', 'জলজলা', 'যালযালাহ'],
  100: ['adiyat', 'আদিয়াত'],
  101: ['qariah', 'kariya', 'কারিয়া', 'ক্বারিয়াহ'],
  102: ['takathur', 'তাকাসুর'],
  103: ['asr', 'wal asr', 'আসর'],
  104: ['humazah', 'হুমাযাহ'],
  105: ['fil', 'feel', 'elephant', 'ফিল', 'হাতি'],
  106: ['quraish', 'kuraish', 'কুরাইশ'],
  107: ['maun', 'maoon', 'মাউন'],
  108: ['kawthar', 'kausar', 'কওসার', 'কাউসার'],
  109: ['kafirun', 'kaferun', 'কাফিরুন'],
  110: ['nasr', 'নসর', 'সাহায্য'],
  111: ['masad', 'lahab', 'লাহাব', 'মাসাদ'],
  112: ['ikhlas', 'ikhlaas', 'tauheed', 'ইখলাস', 'কুলহু'],
  113: ['falaq', 'falak', 'ফালাক'],
  114: ['nas', 'naas', 'নাস', 'মানুষ'],
};

export interface ScoredSurah {
  surah: SurahMeta;
  score: number;
}

/**
 * Searches and ranks Surahs by closest match to the user query.
 * Will ALWAYS return ranked results based on similarity, never returning empty if there are closest names.
 */
export function searchSurahsWithClosest(
  query: string,
  surahList: SurahMeta[] = SURAH_LIST,
  filterType: 'all' | 'makki' | 'madani' | 'popular' = 'all'
): SurahMeta[] {
  // Apply category filter first if specified
  const popularSurahNumbers = [1, 2, 18, 36, 55, 56, 67, 78, 112, 113, 114];
  const basePool = surahList.filter((s) => {
    if (filterType === 'makki' && s.revelationType !== 'মাক্কী') return false;
    if (filterType === 'madani' && s.revelationType !== 'মাদানী') return false;
    if (filterType === 'popular' && !popularSurahNumbers.includes(s.number)) return false;
    return true;
  });

  const raw = query.trim();
  if (!raw) return basePool;

  const rawLower = raw.toLowerCase();

  // 1. Check if user typed a number (English or Bengali, with or without "surah", "#", "no")
  const convertedEn = convertBnDigitsToEn(raw);
  const numberMatch = convertedEn.match(/\b([1-9]\d{0,2})\b/);
  const targetNumber = numberMatch ? parseInt(numberMatch[1], 10) : null;

  // Normalized versions of the query
  const cleanEn = normalizeEnglish(raw);
  const cleanPhonetic = phoneticNormalize(raw);
  const cleanBn = normalizeBangla(raw);

  const scored: ScoredSurah[] = basePool.map((surah) => {
    let score = 0;

    // Exact number match (e.g. "36", "৩৬", "surah 36", "সূরা ৩৬")
    if (targetNumber !== null && surah.number === targetNumber) {
      score += 1000;
    } else if (targetNumber !== null && surah.number.toString().startsWith(targetNumber.toString())) {
      score += 200;
    }

    // Direct string includes
    const nameBnLower = surah.nameBangla.toLowerCase();
    const nameEnLower = surah.nameEnglish.toLowerCase();
    const meaningBnLower = surah.meaningBangla.toLowerCase();

    if (nameEnLower.includes(rawLower) || nameBnLower.includes(rawLower)) {
      score += 400;
    }
    if (surah.nameArabic.includes(raw)) {
      score += 350;
    }
    if (meaningBnLower.includes(rawLower)) {
      score += 150;
    }

    // Normalized matching
    const sCleanEn = normalizeEnglish(surah.nameEnglish);
    const sCleanBn = normalizeBangla(surah.nameBangla);
    const sPhonetic = phoneticNormalize(surah.nameEnglish);

    if (cleanEn && (sCleanEn === cleanEn || sCleanEn.includes(cleanEn) || cleanEn.includes(sCleanEn))) {
      score += 300;
    }
    if (cleanPhonetic && (sPhonetic === cleanPhonetic || sPhonetic.includes(cleanPhonetic) || cleanPhonetic.includes(sPhonetic))) {
      score += 280;
    }
    if (cleanBn && (sCleanBn === cleanBn || sCleanBn.includes(cleanBn) || cleanBn.includes(sCleanBn))) {
      score += 300;
    }

    // Check alias list for common nicknames and alternate spellings
    const aliases = SURAH_ALIASES[surah.number] || [];
    for (const alias of aliases) {
      const aClean = normalizeEnglish(alias);
      const aBn = normalizeBangla(alias);
      if (rawLower.includes(alias) || alias.includes(rawLower)) {
        score += 350;
        break;
      }
      if (cleanEn && (aClean.includes(cleanEn) || cleanEn.includes(aClean))) {
        score += 280;
        break;
      }
      if (cleanBn && (aBn.includes(cleanBn) || cleanBn.includes(aBn))) {
        score += 280;
        break;
      }
    }

    // Fuzzy similarity scoring (closest name distance)
    const simEn = similarityRatio(cleanEn, sCleanEn);
    const simPhonetic = similarityRatio(cleanPhonetic, sPhonetic);
    const simBn = similarityRatio(cleanBn, sCleanBn);

    const maxSim = Math.max(simEn, simPhonetic, simBn);
    if (maxSim > 0.45) {
      score += Math.round(maxSim * 200);
    }

    // Check similarity with aliases too
    for (const alias of aliases) {
      const simAliasEn = similarityRatio(cleanEn, normalizeEnglish(alias));
      const simAliasBn = similarityRatio(cleanBn, normalizeBangla(alias));
      const aliasSim = Math.max(simAliasEn, simAliasBn);
      if (aliasSim > 0.5) {
        score += Math.round(aliasSim * 150);
        break;
      }
    }

    return { surah, score };
  });

  // Sort by highest score first
  scored.sort((a, b) => b.score - a.score);

  // If we have high scoring matches (score >= 100), return those!
  const goodMatches = scored.filter((item) => item.score >= 100);
  if (goodMatches.length > 0) {
    return goodMatches.map((item) => item.surah);
  }

  // If no match was >= 100, return the TOP CLOSEST results (never return 0 results if query has letters)
  const closestMatches = scored.filter((item) => item.score > 20);
  if (closestMatches.length > 0) {
    return closestMatches.slice(0, 10).map((item) => item.surah);
  }

  // Absolute fallback: return top 5 closest by edit distance
  return scored.slice(0, 5).map((item) => item.surah);
}
