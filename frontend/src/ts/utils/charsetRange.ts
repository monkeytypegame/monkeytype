export const charsetRanges = {
  arabic: {
    start: 1569, //ء
    end: 1610, //ي
  },
  latin: {
    start: 97, // a
    end: 122, // z
  },
  cyrillic: {
    start: 1072, // а
    end: 1103, // я
  },
  devanagari: {
    start: 2309, // अ
    end: 2361, // ह
  },
  geez: {
    start: 4768, // ሀ
    end: 4991, // ቿ
  },
  tamil: {
    start: 2949, // அ
    end: 3020, // ஔ
  },
  telugu: {
    start: 3077, // అ
    end: 3149, // ఔ
  },
  bengali: {
    start: 2437, // অ
    end: 2489, // হ
  },
  malayalam: {
    start: 3333, // അ
    end: 3396, // ഹ
  },
  kannada: {
    start: 3205, // ಅ
    end: 3268, // ಹ
  },
  burmese: {
    start: 4096, // က
    end: 4138, // ်
  },
  tibetan: {
    start: 3840, // ༀ
    end: 3911, // ཧ
  },
  sinhala: {
    start: 3461, // අ
    end: 3516, // හ
  },
  hebrew: {
    start: 1488, // א
    end: 1514, // ת
  },
  thai: {
    start: 3585, // ก
    end: 3630, // ฮ
  },
  greek: {
    start: 945, // α
    end: 969, // ω
  },
  han: {
    start: 19968, // 一
    end: 40959, // 龥
  },
  hangul: {
    start: 44032, // 가
    end: 55203, // 힣
  },
  khmer: {
    start: 6016, // ក
    end: 6109, // ឳ
  },
  ol_chiki: {
    start: 7248, // ᱚ
    end: 7295, // ᱿
  },
  hiragana: {
    start: 12353, // あ
    end: 12438, // ん
  },
  katakana: {
    start: 12449, // ア
    end: 12538, // ン
  },
} as const;

// Charset type
export type Charset = keyof typeof charsetRanges;
