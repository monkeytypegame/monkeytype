let accents = [
  ["áàâäåãąą́āą̄", "a"],
  ["éèêëẽęę́ēę̄ė", "e"],
  ["íìîïĩįį́īį̄", "i"],
  ["óòôöøõóōǫǫ́ǭ", "o"],
  ["úùûüŭũúūů", "u"],
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

export function replaceAccents(word, accentsOverride) {
  let newWord = word;
  if (!accents && !accentsOverride) return newWord;
  let regex;
  let list = accentsOverride || accents;
  for (let i = 0; i < list.length; i++) {
    regex = new RegExp(`[${list[i][0]}]`, "gi");
    newWord = newWord.replace(regex, list[i][1]);
  }
  return newWord;
}
