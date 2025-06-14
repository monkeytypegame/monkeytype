export const charsetRanges = {
  arabic: [
    { start: 1569, end: 1594 }, // U+0621–U+063A (ء to غ)
    { start: 1601, end: 1608 }, // U+0641–U+0648 (ف to و)
    { start: 1610, end: 1610 }, // U+064A (ي)
  ],
  latin: [
    { start: 97, end: 122 }, // U+0061-U+007A (a to z)
  ],
  cyrillic: [
    { start: 1072, end: 1103 }, //  U+0430-U+044F (а to я)
  ],
  devanagari: [
    { start: 2309, end: 2361 }, // U+0905–U+0939 (अ to ह)
    { start: 2366, end: 2376 }, // U+093E–U+0948 (vowel signs आ to ऐ)
  ],
  gujarati: [
    { start: 2693, end: 2702 }, // U+0A85–U+0A94 (અ to ઔ)
    { start: 2705, end: 2745 }, // U+0A95–U+0AB9 (ક to હ)
    { start: 2750, end: 2764 }, // U+0ABE–U+0ACC (vowel signs ા to ૌ)
  ],
  geez: [
    { start: 4768, end: 4960 }, // U+1200–U+135F (ሀ to ፟)
  ],
  tamil: [
    { start: 2949, end: 3020 }, // U+0B85–U+0BBC (அ to ஔ)
    { start: 3006, end: 3028 }, // U+0BBE–U+0BCC (vowel signs ா to ௌ)
  ],
  telugu: [
    { start: 3077, end: 3148 }, // U+0C05–U+0C4C (అ to ౌ)
    { start: 3158, end: 3160 }, // U+0C56–U+0C58 (additional vowels ౖ to ౘ)
  ],
  bengali: [
    { start: 2437, end: 2489 }, // U+0985–U+09B9 (অ to হ)
    { start: 2494, end: 2508 }, // U+09BE–U+09CC (vowel signs া to ৌ)
  ],
  malayalam: [
    { start: 3333, end: 3396 }, // U+0D05–U+0D3C (അ to ഹ)
    { start: 3398, end: 3404 }, // U+0D3E–U+0D44 (vowel signs ാ to ൄ)
  ],
  kannada: [
    { start: 3205, end: 3268 }, // U+0C85–U+0CBC (ಅ to ಹ)
    { start: 3270, end: 3276 }, // U+0CBE–U+0CC4 (vowel signs ಾ to ೄ)
  ],
  burmese: [
    { start: 4096, end: 4138 }, // U+1000–U+102A (က to ဪ)
  ],
  tibetan: [
    { start: 3904, end: 3911 }, // U+0F40–U+0F47 (ཀ to ཧ)
  ],
  sinhala: [
    { start: 3461, end: 3516 }, // U+0D85–U+0DBC (අ to හ)
    { start: 3535, end: 3551 }, // U+0DCF–U+0DDF (vowel signs ඾ to ෟ)
  ],
  hebrew: [
    { start: 1488, end: 1514 }, // U+05D0-U+05EA (א to ת)
  ],
  thai: [
    { start: 3585, end: 3631 }, // U+0E01–U+0E2F (ก to ๏)
  ],
  greek: [
    { start: 945, end: 969 }, // U+03B1-U+03C9 (α to ω)
  ],
  han: [
    { start: 19968, end: 27903 }, // U+4E00–U+6CAF (common CJK ideographs)
  ],
  hangul: [
    { start: 44032, end: 55203 }, // U+AC00-U+D7A3 (가 to 힣)
  ],
  khmer: [
    { start: 6016, end: 6067 }, // U+1780–U+17B3 (ក to ឳ)
  ],
  ol_chiki: [
    { start: 7248, end: 7293 }, // U+1C5A–U+1C7D (ᱚ to ᱽ)
  ],
  hiragana: [
    { start: 12353, end: 12438 }, // U+3041-U+3096 (あ to ん)
  ],
  katakana: [
    { start: 12449, end: 12538 }, // U+30A1-U+30FA (ア to ン)
  ],
} as const;

// Charset type
export type Charset = keyof typeof charsetRanges;
