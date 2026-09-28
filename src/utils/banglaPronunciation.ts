// Comprehensive Quranic Arabic transliteration to authentic Bangla pronunciation converter

export function convertTransliterationToBangla(text: string): string {
  if (!text) return '';

  let s = text.trim();

  // If already Bangla characters, return as is
  if (/^[\u0980-\u09FF\s\d\p{P}]+$/u.test(s)) {
    return s;
  }

  // Common Quranic phrases and formulas
  const phraseMap: [RegExp, string][] = [
    [/\bBismillaahir[ -]Rahmaanir[ -]Raheem\b/gi, 'বিসমিল্লাহির রাহমানির রাহীম'],
    [/\bBismil[ -]laahir[ -]Rahmaanir[ -]Raheem\b/gi, 'বিসমিল্লাহির রাহমানির রাহীম'],
    [/\bBismillaahir[ -]Rahmanir[ -]Rahim\b/gi, 'বিসমিল্লাহির রাহমানির রাহীম'],
    [/\bBismillaahi\b/gi, 'বিসমিল্লাহি'],
    [/\bBismillaah\b/gi, 'বিসমিল্লাহ'],
    [/\bAlhamdu lillaahi\b/gi, 'আলহামদু লিল্লাহি'],
    [/\bAlhamdu lillaah\b/gi, 'আলহামদু লিল্লাহ'],
    [/\bRabbil[ -]?['‘]?aalameen\b/gi, 'রাব্বিল ‘আলামীন'],
    [/\bRabbil[ -]?['‘]?alameen\b/gi, 'রাব্বিল ‘আলামীন'],
    [/\bAr[ -]Rahmaanir[ -]Raheem\b/gi, 'আর-রাহমানির রাহীম'],
    [/\bAr[ -]Rahmaan\b/gi, 'আর-রাহমান'],
    [/\bAr[ -]Raheem\b/gi, 'আর-রাহীম'],
    [/\bMaaliki Yawmid[ -]Deen\b/gi, 'মালিকি ইয়াওমিদ্দীন'],
    [/\bMaliki Yawmid[ -]Deen\b/gi, 'মালিকি ইয়াওমিদ্দীন'],
    [/\bIyyaaka na['‘]?budu\b/gi, 'ইয়্যাক্বা না‘বুদু'],
    [/\bwa lyyaaka\b/gi, 'ওয়া ইয়্যাক্বা'],
    [/\bwa iyyaaka\b/gi, 'ওয়া ইয়্যাক্বা'],
    [/\bnasta['‘]?een\b/gi, 'নাস্তা‘ঈন'],
    [/\bIhdinas[ -]Siraatal[ -]Mustaqeem\b/gi, 'ইহদিনাস সিরাতাল মুস্তাক্বীম'],
    [/\bSiraatal[ -]lazeena an['‘]?amta ['‘]?alayhim\b/gi, 'সিরাতাল্লাযীনা আন‘আমতা ‘আলাইহিম'],
    [/\bghayril[ -]maghdoobi ['‘]?alayhim wa lad[ -]daalleen\b/gi, 'গইরিল মাগদ্বূবি ‘আলাইহিম ওয়ালাদ্-দ্বাল্লীন'],
    [/\bQul Huwal Laahu Ahad\b/gi, 'ক্বুল হুওয়াল্লাহু আহাদ'],
    [/\bAllaahus[ -]Samad\b/gi, 'আল্লাহুস সামাদ'],
    [/\bLam yalid wa lam yoolad\b/gi, 'লাম ইয়ালিদ ওয়ালাম ইয়ূলাদ'],
    [/\bWa lam yakul[ -]lahoo kufuwan ahad\b/gi, 'ওয়ালাম ইয়াকুল্লাহু কুফুওয়ান আহাদ'],
    [/\bSubhaana Rabbiyal ['‘]?Azeem\b/gi, 'সুবহানা রাব্বিয়াল ‘আযীম'],
    [/\bSubhaana Rabbiyal ['‘]?A['‘]laa\b/gi, 'সুবহানা রাব্বিয়াল ‘আ‘লা'],
    [/\bLaa ilaaha illal[ -]laah\b/gi, 'লা ইলাহা ইল্লাল্লাহ'],
    [/\bLaa ilaaha illa[ -]Allaah\b/gi, 'লা ইলাহা ইল্লাল্লাহ'],
    [/\bMuhammadur Rasoolul[ -]laah\b/gi, 'মুহাম্মাদুর রাসূলুল্লাহ'],
    [/\bYaa[ -]Seeen\b/gi, 'ইয়া-সীন'],
    [/\bAlif[ -]Laaam[ -]Meeem\b/gi, 'আলিফ-লাম-মীম'],
    [/\bAlif[ -]Laam[ -]Meem\b/gi, 'আলিফ-লাম-মীম'],
    [/\bWal[ -]Qur['‘]?[ -]aanil[ -]Hakeem\b/gi, 'ওয়াল কুরআনিক হাকীম'],
    [/\bInnaka laminal mursaleen\b/gi, 'ইন্নাকা লামিনাল মুরসালীন'],
    [/\bTabaarakal lazee biyadihil mulk\b/gi, 'তাবারাকাল্লাযী বিয়াদিহিল মুলকু'],
    [/\bWa huwa ['‘]?alaa kulli shai['‘]?in Qadeer\b/gi, 'ওয়াহুওয়া ‘আলা কুল্লি শাইয়িন ক্বাদীর'],
    [/\bAyat al[ -]Kursi\b/gi, 'আয়াতুল কুরসী'],
    [/\bAllaahu laaa ilaaha illaa Huwal Hayyul Qayyoom\b/gi, 'আল্লাহু লা ইলাহা ইল্লা হুওয়াল হাইয়্যুল ক্বাইয়্যূম'],
  ];

  for (const [pattern, replacement] of phraseMap) {
    s = s.replace(pattern, replacement);
  }

  // Word-level transliteration rules
  const words = s.split(' ');
  const banglaWords = words.map((rawWord) => {
    // If the word already contains Bangla characters, keep it
    if (/[\u0980-\u09FF]/.test(rawWord)) return rawWord;

    return transliterateSingleWord(rawWord);
  });

  return banglaWords.join(' ');
}

function transliterateSingleWord(word: string): string {
  // Punctuation extraction
  const prefixMatch = word.match(/^[^\w'‘-]+/);
  const suffixMatch = word.match(/[^\w'‘-]+$/);
  const prefix = prefixMatch ? prefixMatch[0] : '';
  const suffix = suffixMatch ? suffixMatch[0] : '';
  const core = word.slice(prefix.length, word.length - suffix.length);

  if (!core) return word;

  // Exact word dictionary
  const lower = core.toLowerCase().replace(/['‘’-]/g, '');
  const exactDict: Record<string, string> = {
    'bismillah': 'বিসমিল্লাহ',
    'bismillahi': 'বিসমিল্লাহি',
    'bismillahir': 'বিসমিল্লাহির',
    'allah': 'আল্লাহ',
    'allahu': 'আল্লাহু',
    'allaha': 'আল্লাহা',
    'allahi': 'আল্লাহি',
    'lillah': 'লিল্লাহ',
    'lillahi': 'লিল্লাহি',
    'alhamdu': 'আলহামদু',
    'rabbi': 'রাব্বি',
    'rabbil': 'রাব্বিল',
    'rabbaka': 'রাব্বাকা',
    'rabbika': 'রাব্বিকা',
    'rabbina': 'রাব্বানা',
    'rabbana': 'রাব্বানা',
    'rabbukum': 'রাব্বুকুম',
    'alameen': '‘আলামীন',
    'alameena': '‘আলামীন',
    'rahman': 'রাহমান',
    'rahmani': 'রাহমানি',
    'rahmanir': 'রাহমানির',
    'rahmaan': 'রাহমান',
    'rahmaani': 'রাহমানি',
    'rahmaanir': 'রাহমানির',
    'raheem': 'রাহীম',
    'raheemi': 'রাহীমি',
    'malik': 'মালিক',
    'maliki': 'মালিকি',
    'maaliki': 'মালিকি',
    'yawm': 'ইয়াওম',
    'yawmid': 'ইয়াওমিদ',
    'deen': 'দীন',
    'deeni': 'দীন',
    'iyyaka': 'ইয়্যাক্বা',
    'iyyaaka': 'ইয়্যাক্বা',
    'nabudu': 'না‘বুদু',
    'nastaeen': 'নাস্তা‘ঈন',
    'ihdina': 'ইহদিনা',
    'ihdinas': 'ইহদিনাস',
    'sirat': 'সিরাত',
    'sirata': 'সিরাতা',
    'siratal': 'সিরাতাল',
    'siraatal': 'সিরাতাল',
    'mustaqeem': 'মুস্তাক্বীম',
    'allazeena': 'আল্লাযীনা',
    'lazeena': 'ল্লাযীনা',
    'anamta': 'আন‘আমতা',
    'alayhim': '‘আলাইহিম',
    'ghayril': 'গইরিল',
    'maghdoobi': 'মাগদ্বূবি',
    'daalleen': 'দ্বাল্লীন',
    'qul': 'ক্বুল',
    'huwa': 'হুওয়া',
    'huwal': 'হুওয়াল',
    'ahad': 'আহাদ',
    'samad': 'সামাদ',
    'lam': 'লাম',
    'yalid': 'ইয়ালিদ',
    'walam': 'ওয়ালাম',
    'yoolad': 'ইয়ূলাদ',
    'yakul': 'ইয়াকুল',
    'lahu': 'লাহূ',
    'lahoo': 'লাহূ',
    'kufuwan': 'কুফুওয়ান',
    'aoozu': 'আ‘ঊযু',
    'falaq': 'ফালাক্ব',
    'khalaq': 'খালাক্ব',
    'sharr': 'শারর',
    'sharri': 'শাররি',
    'sharrin': 'শাররিন',
    'ghasiqin': 'গাসিক্বিন',
    'ghaasiqin': 'গাসিক্বিন',
    'waqab': 'ওয়াক্বাব',
    'naffasati': 'নাফ্ফাস্বাতি',
    'naffaasaati': 'নাফ্ফাস্বাতি',
    'uqad': '‘উক্বাদ',
    'hasidin': 'হাসিদিন',
    'haasidin': 'হাসিদিন',
    'hasad': 'হাসাদ',
    'naas': 'নাস',
    'inna': 'ইন্না',
    'innaka': 'ইন্নাকা',
    'aataynaaka': 'আ‘ত্বয়নাকাল',
    'aataynaakal': 'আ‘ত্বয়নাকাল',
    'kawthar': 'কাউসার',
    'fasalli': 'ফাসাল্লি',
    'lirabbika': 'লিরাব্বিকা',
    'wanhar': 'ওয়ানহার',
    'shaniaka': 'শানি’আকা',
    'abtar': 'আবতার',
    'tabaaraka': 'তাবারাকা',
    'tabaarakal': 'তাবারাকাল',
    'mulk': 'মুলক',
    'mulku': 'মুলকু',
    'qadeer': 'ক্বাদীর',
    'azeez': '‘আযীয',
    'alazeez': 'আল-‘আযীয',
    'gafoor': 'গফূর',
    'ghafoor': 'গফূর',
    'alghafoor': 'আল-গফূর',
    'hakeem': 'হাকীম',
    'alhakeem': 'আল-হাকীম',
    'mursaleen': 'মুরসালীন',
    'jannah': 'জান্নাহ',
    'jannatin': 'জান্নাতিন',
    'jahannam': 'জাহান্নাম',
    'kitaab': 'কিতাব',
    'alkitaab': 'আল-কিতাব',
    'quran': 'কুরআন',
    'alquran': 'আল-কুরআন',
    'rasool': 'রাসূল',
    'rasoolullah': 'রাসূলুল্লাহ',
    'nabi': 'নবী',
    'malaaikah': 'মালা-ইকাহ',
    'aamanu': 'আমানূ',
    'kafaru': 'কাফারূ',
    'mumin': 'মু’মিন',
    'mumineen': 'মু’মিনীন',
    'muslim': 'মুসলিম',
    'muslimeen': 'মুসলিমীন',
    'munafiq': 'মুনাফিক্ব',
    'munafiqeen': 'মুনাফিক্বীন',
    'salaah': 'সালাত',
    'salat': 'সালাত',
    'zakaah': 'যাকাত',
    'zakat': 'যাকাত',
    'sawm': 'সাওম',
    'hajj': 'হজ্জ',
    'duaa': 'দোয়া',
    'subhanallah': 'সুবহানাল্লাহ',
    'alhamdulillah': 'আলহামদুলিল্লাহ',
    'allahuakbar': 'আল্লাহু আকবার',
    'astaghfirullah': 'আস্তাগফিরুল্লাহ',
    'inshallah': 'ইনশাআল্লাহ',
    'mashallah': 'মাশাআল্লাহ',
  };

  if (exactDict[lower]) {
    return prefix + exactDict[lower] + suffix;
  }

  // Prefix handling for common Arabic prefixes: wal-, bil-, lil-, fal-, kal-, al-
  const prefixes = [
    { en: 'wal-', bn: 'ওয়াল-' },
    { en: 'bil-', bn: 'বিল-' },
    { en: 'lil-', bn: 'লিল-' },
    { en: 'fal-', bn: 'ফাল-' },
    { en: 'kal-', bn: 'কাল-' },
    { en: 'al-', bn: 'আল-' },
    { en: 'wa-', bn: 'ওয়া ' },
    { en: 'fa-', bn: 'ফা ' },
  ];

  for (const p of prefixes) {
    if (core.toLowerCase().startsWith(p.en)) {
      const remainder = core.slice(p.en.length);
      const remTrans = transliterateSingleWord(remainder);
      return prefix + p.bn + remTrans + suffix;
    }
  }

  // Fallback to phoneme-based transliterator
  return prefix + phonemeTransliterate(core) + suffix;
}

function phonemeTransliterate(input: string): string {
  let s = input.toLowerCase();

  // Multi-char consonants
  const consonantMap: [string, string][] = [
    ['kh', 'খ'],
    ['gh', 'গ'],
    ['sh', 'শ'],
    ['th', 'ছ'],
    ['dh', 'য'],
    ['zh', 'য'],
    ['ch', 'চ'],
    ['ph', 'ফ'],
    ['aa', 'আ'],
    ['ee', 'ঈ'],
    ['oo', 'ূ'],
    ['ou', 'উ'],
    ['ai', 'আই'],
    ['ay', 'আই'],
    ['au', 'আউ'],
    ['aw', 'আউ'],
  ];

  // Single-char consonants
  const singleConsonants: Record<string, string> = {
    b: 'ব',
    t: 'ত',
    j: 'জ',
    h: 'হ',
    d: 'দ',
    r: 'র',
    z: 'য',
    s: 'স',
    f: 'ফ',
    q: 'ক্ব',
    k: 'ক',
    l: 'ল',
    m: 'ম',
    n: 'ন',
    w: 'ওয়',
    y: 'ইয়',
    p: 'প',
    v: 'ভ',
  };

  const vowelSign: Record<string, string> = {
    a: 'া',
    i: 'ি',
    u: 'ু',
    e: 'ে',
    o: 'ো',
  };

  const initialVowel: Record<string, string> = {
    a: 'আ',
    i: 'ই',
    u: 'উ',
    e: 'এ',
    o: 'ও',
  };

  let result = '';
  let i = 0;
  let prevIsConsonant = false;

  while (i < s.length) {
    const twoChars = s.slice(i, i + 2);

    // Skip apostrophes or ayn
    if (s[i] === '\'' || s[i] === '‘' || s[i] === '’') {
      result += '‘';
      i++;
      prevIsConsonant = false;
      continue;
    }

    if (s[i] === '-') {
      result += '-';
      i++;
      prevIsConsonant = false;
      continue;
    }

    // Check doubled consonants (shaddah like ll, mm, nn, rr, tt, ss)
    if (
      s[i] === s[i + 1] &&
      singleConsonants[s[i]] &&
      !['a', 'i', 'u', 'e', 'o'].includes(s[i])
    ) {
      const bnChar = singleConsonants[s[i]];
      result += bnChar + '্' + bnChar;
      prevIsConsonant = true;
      i += 2;
      continue;
    }

    // Check 2-char consonants first
    const match2 = consonantMap.find(([k]) => k === twoChars);
    if (match2) {
      if (['aa', 'ee', 'oo', 'ou', 'ai', 'ay', 'au', 'aw'].includes(match2[0])) {
        if (prevIsConsonant) {
          if (match2[0] === 'aa') result += 'া';
          else if (match2[0] === 'ee') result += 'ী';
          else if (match2[0] === 'oo' || match2[0] === 'ou') result += 'ূ';
          else if (match2[0] === 'ai' || match2[0] === 'ay') result += 'াই';
          else if (match2[0] === 'au' || match2[0] === 'aw') result += 'াউ';
        } else {
          result += match2[1];
        }
        prevIsConsonant = false;
      } else {
        result += match2[1];
        prevIsConsonant = true;
      }
      i += 2;
      continue;
    }

    // Check single consonants
    if (singleConsonants[s[i]]) {
      result += singleConsonants[s[i]];
      prevIsConsonant = true;
      i++;
      continue;
    }

    // Check vowels
    if (['a', 'i', 'u', 'e', 'o'].includes(s[i])) {
      if (prevIsConsonant) {
        result += vowelSign[s[i]] || '';
      } else {
        result += initialVowel[s[i]] || '';
      }
      prevIsConsonant = false;
      i++;
      continue;
    }

    // Default fallback
    result += s[i];
    i++;
  }

  return result;
}
