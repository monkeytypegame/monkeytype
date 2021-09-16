let accents = [
  ["áàâäåãąą́āą̄ǎ", "a"],
  ["éèêëẽęę́ēę̄ėě", "e"],
  ["íìîïĩįį́īį̄ǐ", "i"],
  ["óòôöøõóōǫǫ́ǭǒ", "o"],
  ["úùûüŭũúūůǔ", "u"],
  ["ü", "v"], // as in chinese pinyin
  ["ñń", "n"],
  ["çĉć", "c"],
  ["æ", "ae"],
  ["œ", "oe"],
  ["ẅ", "w"],
  ["ĝğg̃", "g"],
  ["ĥ", "h"],
  ["ĵ", "j"],
  ["ń", "n"],
  ["ŝś", "s"],
  ["żź", "z"],
  ["ÿỹ", "y"],
  ["ł", "l"],
  ["أإآ", "ا"],
  ["َ", ""],
  ["ُ", ""],
  ["ِ", ""],
  ["ْ", ""],
  ["ً", ""],
  ["ٌ", ""],
  ["ٍ", ""],
  ["ّ", ""],
];

export function replaceAccents(word) {
  let newWord = word;
  if (!accents) return newWord;
  let regex;
  for (let i = 0; i < accents.length; i++) {
    regex = new RegExp(`[${accents[i][0]}]`, "gi");
    newWord = newWord.replace(regex, accents[i][1]);
  }
  return newWord;
}
