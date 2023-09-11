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
  if (!word) return word;

  const accentMap = new Map(accentsOverride || accents);

  const uppercased = word.toUpperCase();
  const cases = Array(word.length);

  for (let i = 0; i < word.length; i++) {
    cases[i] = word[i] === uppercased[i] ? 1 : 0;
  }

  const newWordArray: string[] = [];

  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    if (accentMap.has(char)) {
      newWordArray.push(accentMap.get(char) as string);
    } else {
      newWordArray.push(char);
    }
  }

  if (cases.includes(1)) {
    for (let i = 0; i < cases.length; i++) {
      if (cases[i] === 1) {
        newWordArray[i] = newWordArray[i].toUpperCase();
      }
    }
  }

  return newWordArray.join("");
}
