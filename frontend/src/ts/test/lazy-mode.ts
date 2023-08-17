const accents: [string, string][] = [
  ["áàâäåãąą́āą̄ă", "a"],
  ["éèêëẽęę́ēę̄ėě", "e"],
  ["íìîïĩįį́īį̄ı", "i"],
  ["óòôöøõóōǫǫ́ǭő", "o"],
  ["úùûüŭũúūůű", "u"],
  ["ńňñ", "n"],
  ["çĉčć", "c"],
  ["řŕ", "r"],
  ["ďđ", "d"],
  ["ťț", "t"],
  ["æ", "ae"],
  ["œ", "oe"],
  ["ẅŵ", "w"],
  ["ĝğg̃", "g"],
  ["ĥ", "h"],
  ["ĵ", "j"],
  ["ń", "n"],
  ["ŝśšșş", "s"],
  ["ß", "ss"],
  ["żźž", "z"],
  ["ÿỹýÿŷ", "y"],
  ["łľĺ", "l"],
  ["أإآ", "ا"],
  ["َ", ""],
  ["ُ", ""],
  ["ِ", ""],
  ["ْ", ""],
  ["ً", ""],
  ["ٌ", ""],
  ["ٍ", ""],
  ["ّ", ""],
  ["ё", "е"],
  ["ά", "α"],
  ["έ", "ε"],
  ["ί", "ι"],
  ["ύ", "υ"],
  ["ό", "ο"],
  ["ή", "η"],
  ["ώ", "ω"],
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
