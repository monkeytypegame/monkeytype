let accents = [
  ["áàâäåãąą́āą̄ă", "a"],
  ["éèêëẽęę́ēę̄ėě", "e"],
  ["íìîïĩįį́īį̄", "i"],
  ["óòôöøõóōǫǫ́ǭő", "o"],
  ["úùûüŭũúūůű", "u"],
  ["ńňñ", "n"],
  ["çĉčć", "c"],
  ["ř", "r"],
  ["ď", "d"],
  ["ťț", "t"],
  ["æ", "ae"],
  ["œ", "oe"],
  ["ẅ", "w"],
  ["ĝğg̃", "g"],
  ["ĥ", "h"],
  ["ĵ", "j"],
  ["ń", "n"],
  ["ŝśšș", "s"],
  ["żźž", "z"],
  ["ÿỹýÿŷ", "y"],
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
