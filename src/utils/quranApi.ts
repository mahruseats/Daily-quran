import { Ayah, Qari, QuranWord } from '../types';
import { PRELOADED_SURAHS } from '../data/preloadedSurahs';
import { PRELOADED_WBW } from '../data/preloadedWbw';
import { convertTransliterationToBangla } from './banglaPronunciation';

export const RECITERS: Qari[] = [
  {
    id: 'dossari',
    nameBangla: 'শায়খ ইয়াসির আদ-দাওসারি (Sheikh Al-Dusarry)',
    nameEnglish: 'Sheikh Yasser Al-Dossari (Al Dusarry)',
    subfolder: 'Yasser_Ad-Dussary_128kbps',
    serverUrl: 'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps',
  },
  {
    id: 'alafasy',
    nameBangla: 'মিশারি রাশিদ আল-আফাসি',
    nameEnglish: 'Mishary Rashid Alafasy',
    subfolder: 'Alafasy_128kbps',
    serverUrl: 'https://everyayah.com/data/Alafasy_128kbps',
  },
  {
    id: 'abdulbasit',
    nameBangla: 'আব্দুল বাসিত (মুজাওয়াদ)',
    nameEnglish: 'Abdul Basit (Mujawwad)',
    subfolder: 'Abdul_Basit_Mujawwad_128kbps',
    serverUrl: 'https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps',
  },
  {
    id: 'ghamdi',
    nameBangla: 'সাদ আল-গামদি',
    nameEnglish: 'Saad Al-Ghamdi',
    subfolder: 'Ghamadi_40kbps',
    serverUrl: 'https://everyayah.com/data/Ghamadi_40kbps',
  },
  {
    id: 'shatri',
    nameBangla: 'আবু বকর আশ-শাতরি',
    nameEnglish: 'Abu Bakr Al-Shatri',
    subfolder: 'Abu_Bakr_Ash-Shaatree_128kbps',
    serverUrl: 'https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps',
  },
  {
    id: 'husary',
    nameBangla: 'মাহমুদ খলিল আল-হুসারি',
    nameEnglish: 'Mahmoud Khalil Al-Husary',
    subfolder: 'Husary_128kbps',
    serverUrl: 'https://everyayah.com/data/Husary_128kbps',
  },
];

export function formatAyahAudioCode(surahNumber: number, ayahNumberInSurah: number): string {
  const s = surahNumber.toString().padStart(3, '0');
  const a = ayahNumberInSurah.toString().padStart(3, '0');
  return `${s}${a}`;
}

export function getAyahAudioUrl(surahNumber: number, ayahNumberInSurah: number, qariId = 'alafasy'): string {
  const qari = RECITERS.find((q) => q.id === qariId) || RECITERS[0];
  const code = formatAyahAudioCode(surahNumber, ayahNumberInSurah);
  return `${qari.serverUrl}/${code}.mp3`;
}

const CACHE_PREFIX = 'quran_surah_wbw_v4_';

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function cleanMeaning(str?: string): string {
  if (!str) return '';
  return str.replace(/^["'"]/g, '').replace(/["'"]$/g, '').trim();
}

export async function fetchSurahAyahs(
  surahNumber: number,
  onProgress?: (percent: number) => void
): Promise<{ ayahs: Ayah[]; isOfflineCache: boolean; error?: string }> {
  // 1. Check preloaded high-priority Surahs
  if (PRELOADED_SURAHS[surahNumber]) {
    const data = PRELOADED_SURAHS[surahNumber];
    const wbwChapter = PRELOADED_WBW[surahNumber] || {};
    const ayahsWithWbw = data.ayahs.map((ayah) => ({
      ...ayah,
      words: wbwChapter[ayah.numberInSurah] || [
        ...ayah.textArabic.split(/\s+/).filter(Boolean).map((word, wIdx) => ({
          position: wIdx + 1,
          textArabic: word,
          textBanglaMeaning: '',
          textEnglishMeaning: '',
          charType: 'word',
        })),
        {
          position: 999,
          textArabic: `${ayah.numberInSurah}`,
          textBanglaMeaning: `(${ayah.numberInSurah})`,
          textEnglishMeaning: `(${ayah.numberInSurah})`,
          charType: 'end',
        },
      ],
    }));
    return { ayahs: ayahsWithWbw, isOfflineCache: true };
  }

  // 2. Check LocalStorage cache
  const cacheKey = `${CACHE_PREFIX}${surahNumber}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].words) {
        return { ayahs: parsed, isOfflineCache: true };
      }
    }
  } catch (err) {
    console.warn('LocalStorage read error:', err);
  }

  // 3. Fetch from Quran.com API with full word-by-word meanings (Bengali & English)
  try {
    if (onProgress) onProgress(20);

    const [bnRes, enRes] = await Promise.all([
      fetch(
        `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=bn&words=true&word_fields=text_uthmani,translation,transliteration&translations=161,20&per_page=300`
      ).then((r) => {
        if (!r.ok) throw new Error(`Quran.com API error: ${r.status}`);
        return r.json();
      }),
      fetch(
        `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=en&words=true&word_fields=text_uthmani,translation&per_page=300`
      ).then((r) => (r.ok ? r.json() : { verses: [] })).catch(() => ({ verses: [] })),
    ]);

    if (onProgress) onProgress(70);

    if (bnRes.verses && Array.isArray(bnRes.verses) && bnRes.verses.length > 0) {
      const enVerses = enRes.verses || [];
      const resultAyahs: Ayah[] = bnRes.verses.map((v: any, index: number) => {
        const enV = enVerses[index];
        const verseWords: QuranWord[] = (v.words || []).map((w: any, wIdx: number) => {
          const enW = enV?.words?.[wIdx];
          const isEnd = w.char_type_name === 'end' || wIdx === (v.words || []).length - 1;
          return {
            id: w.id,
            position: w.position || wIdx + 1,
            textArabic: w.text_uthmani || w.text || '',
            textBanglaMeaning: cleanMeaning(w.translation?.text),
            textEnglishMeaning: cleanMeaning(enW?.translation?.text),
            transliteration: w.transliteration?.text || '',
            charType: isEnd ? 'end' : 'word',
          };
        });

        // Overall ayah translations
        const bnTranslation = stripHtml(
          v.translations?.find((t: any) => t.resource_id === 161)?.text || ''
        );
        const enTranslation = stripHtml(
          v.translations?.find((t: any) => t.resource_id === 20)?.text || ''
        );

        // Combined transliteration from words
        const englishTransliteration = verseWords
          .filter((w) => w.charType !== 'end' && w.transliteration)
          .map((w) => w.transliteration)
          .join(' ');
        const banglaTransliteration = convertTransliterationToBangla(englishTransliteration);

        const fullArabic = verseWords
          .filter((w) => w.charType !== 'end')
          .map((w) => w.textArabic)
          .join(' ');

        return {
          number: v.id || v.verse_number,
          numberInSurah: v.verse_number,
          textArabic: fullArabic || v.text_uthmani || '',
          textBanglaPronunciation: banglaTransliteration,
          textEnglishPronunciation: englishTransliteration,
          textBanglaTranslation: bnTranslation || 'বাংলা অনুবাদ সংগৃহীত হচ্ছে...',
          textEnglishTranslation: enTranslation || 'English translation loading...',
          words: verseWords,
          tafsirBangla: `আয়াত নং ${v.verse_number} এর তাফসীর ও মূল শিক্ষা: আল্লাহর এই নির্দেশে অন্তরের পবিত্রতা, তাওহীদের গভীরতা ও হেদায়েতের বার্তা স্পষ্ট ফুটে উঠেছে।`,
          tafsirEnglish: `Tafsir & reflection for Ayah ${v.verse_number}: Highlights sincere devotion, faith in Allah, and guidance for righteous living.`,
          juz: v.juz_number || 1,
          sajdah: !!v.sajdah_number,
        };
      });

      try {
        localStorage.setItem(cacheKey, JSON.stringify(resultAyahs));
      } catch (e) {
        console.warn('Storage quota exceeded:', e);
      }

      if (onProgress) onProgress(100);
      return { ayahs: resultAyahs, isOfflineCache: false };
    }
  } catch (quranComErr) {
    console.warn('Quran.com API error, falling back to Al-Quran Cloud:', quranComErr);
  }

  // 4. Fallback to Al-Quran Cloud API
  try {
    if (onProgress) onProgress(80);
    const response = await fetch(
      `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,bn.bengali,en.sahih,en.transliteration`
    );

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const json = await response.json();
    if (!json.data || json.data.length < 2) {
      throw new Error('Invalid response structure');
    }

    const arabicAyahs = json.data[0].ayahs;
    const banglaAyahs = json.data[1]?.ayahs || [];
    const englishAyahs = json.data[2]?.ayahs || [];
    const translitAyahs = json.data[3]?.ayahs || [];

    const resultAyahs: Ayah[] = arabicAyahs.map((item: any, index: number) => {
      const bnItem = banglaAyahs[index] || { text: '' };
      const enItem = englishAyahs[index] || { text: '' };
      const transItem = translitAyahs[index] || { text: '' };

      const banglaPronunciation = convertTransliterationToBangla(transItem.text || '');

      const wordsList: QuranWord[] = item.text
        .split(/\s+/)
        .filter(Boolean)
        .map((w: string, wIdx: number) => ({
          position: wIdx + 1,
          textArabic: w,
          textBanglaMeaning: '',
          textEnglishMeaning: '',
          charType: 'word',
        }));

      wordsList.push({
        position: wordsList.length + 1,
        textArabic: `${item.numberInSurah}`,
        textBanglaMeaning: `(${item.numberInSurah})`,
        textEnglishMeaning: `(${item.numberInSurah})`,
        charType: 'end',
      });

      return {
        number: item.number,
        numberInSurah: item.numberInSurah,
        textArabic: item.text,
        textBanglaPronunciation: banglaPronunciation,
        textEnglishPronunciation: transItem.text || '',
        textBanglaTranslation: bnItem.text || 'বাংলা অনুবাদ সংগৃহীত হচ্ছে...',
        textEnglishTranslation: enItem.text || 'English translation loading...',
        words: wordsList,
        tafsirBangla: `আয়াত নং ${item.numberInSurah} এর তাফসীর ও মূল শিক্ষা: আল্লাহর এই নির্দেশে অন্তরের পবিত্রতা, তাওহীদের গভীরতা ও হেদায়েতের বার্তা স্পষ্ট ফুটে উঠেছে।`,
        tafsirEnglish: `Tafsir & reflection for Ayah ${item.numberInSurah}: Highlights sincere devotion, faith in Allah, and guidance for righteous living.`,
        juz: item.juz || 1,
        sajdah: !!item.sajdah,
      };
    });

    try {
      localStorage.setItem(cacheKey, JSON.stringify(resultAyahs));
    } catch (e) {
      console.warn('Storage quota exceeded:', e);
    }

    if (onProgress) onProgress(100);
    return { ayahs: resultAyahs, isOfflineCache: false };
  } catch (error) {
    console.error(`Failed to fetch Surah ${surahNumber}:`, error);

    return {
      ayahs: [],
      isOfflineCache: false,
      error: 'ইন্টারনেট সংযোগ প্রয়োজন অথবা অফলাইন ডেটা এখনো ডাউনলোড করা হয়নি।',
    };
  }
}

/**
 * Download and cache audio recitations for an entire Surah into the Cache API
 */
export async function downloadSurahAudioForOffline(
  surahNumber: number,
  ayahCount: number,
  qariId: string,
  onProgress?: (progressPercent: number, downloadedCount: number) => void
): Promise<{ success: boolean; error?: string }> {
  if (!('caches' in window)) {
    return { success: false, error: 'আপনার ব্রাউজার অফলাইন অডিও ক্যাশ সমর্থন করে না।' };
  }

  try {
    const cache = await caches.open('quran-audio-cache');
    let completed = 0;

    for (let i = 1; i <= ayahCount; i++) {
      const audioUrl = getAyahAudioUrl(surahNumber, i, qariId);
      const match = await cache.match(audioUrl);
      if (!match) {
        try {
          const resp = await fetch(audioUrl, { mode: 'cors' });
          if (resp.ok) {
            await cache.put(audioUrl, resp.clone());
          }
        } catch (e) {
          console.warn(`Failed to cache audio for ayah ${i}`, e);
        }
      }
      completed++;
      if (onProgress) {
        onProgress(Math.round((completed / ayahCount) * 100), completed);
      }
    }

    // Mark surah as downloaded in localStorage
    const downloadedMap = JSON.parse(localStorage.getItem('downloaded_surahs_audio') || '{}');
    downloadedMap[`${surahNumber}_${qariId}`] = true;
    localStorage.setItem('downloaded_surahs_audio', JSON.stringify(downloadedMap));

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'ডাউনলোডে ত্রুটি হয়েছে' };
  }
}

export function isSurahAudioCached(surahNumber: number, qariId: string): boolean {
  try {
    const downloadedMap = JSON.parse(localStorage.getItem('downloaded_surahs_audio') || '{}');
    return !!downloadedMap[`${surahNumber}_${qariId}`];
  } catch {
    return false;
  }
}
