let accents = [
  ["áàâäåãąą́āą̄", "a"],
  ["éèêëẽęę́ēę̄ėě", "e"],
  ["íìîïĩįį́īį̄", "i"],
  ["óòôöøõóōǫǫ́ǭ", "o"],
  ["úùûüŭũúūů", "u"],
  ["ńň", "n"],
  ["çĉčć", "c"],
  ["ř", "r"],
  ["ď", "d"],
  ["ť", "t"],
  ["æ", "ae"],
  ["œ", "oe"],
  ["ẅ", "w"],
  ["ĝğg̃", "g"],
  ["ĥ", "h"],
  ["ĵ", "j"],
  ["ń", "n"],
  ["ŝśš", "s"],
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
