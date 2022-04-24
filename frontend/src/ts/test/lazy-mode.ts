const accents: [string, string][] = [
  ["áàâäåãąą́āą̄ă", "a"],
  ["éèêëẽęę́ēę̄ėě", "e"],
  ["íìîïĩįį́īį̄", "i"],
  ["óòôöøõóōǫǫ́ǭő", "o"],
  ["úùûüŭũúūůű", "u"],
  ["ńň", "n"],
  ["çĉčć", "c"],
  ["ř", "r"],
  ["ď", "d"],
  ["ťț", "t"],
  ["æ", "ae"],
  ["œ", "oe"],
  ["ẅŵ", "w"],
  ["ĝğg̃", "g"],
  ["ĥ", "h"],
  ["ĵ", "j"],
  ["ń", "n"],
  ["ŝśšș", "s"],
  ["żźž", "z"],
  ["ÿỹýÿŷ", "y"],
  ["łľ", "l"],
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

export function replaceAccents(
  word: string,
  accentsOverride?: MonkeyTypes.Accents
): string {
  let newWord = word;
  if (!accents && !accentsOverride) return newWord;
  let regex;
  const list = accentsOverride || accents;
  for (let i = 0; i < list.length; i++) {
    regex = new RegExp(`[${list[i][0]}]`, "gi");
    newWord = newWord.replace(regex, list[i][1]);
  }
  return newWord;
}
