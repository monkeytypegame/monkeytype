const accents: [string, string][] = [
  ["áàâäåãąą́āą̄ă", "a"],
  ["éèêëẽęę́ēę̄ėě", "e"],
  ["íìîïĩįį́īį̄ı", "i"],
  ["óòôöøõóōǫǫ́ǭő", "o"],
  ["úùûüŭũúūůű", "u"],
  ["ńňñ", "n"],
  ["çĉčć", "c"],
  ["řŕṛ", "r"],
  ["ďđḍ", "d"],
  ["ťțṭ", "t"],
  ["ṃ", "m"],
  ["æ", "ae"],
  ["œ", "oe"],
  ["ẅŵ", "w"],
  ["ĝğg̃", "g"],
  ["ĥ", "h"],
  ["ĵ", "j"],
  ["ńṇ", "n"],
  ["ŝśšșşṣ", "s"],
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
  ["þ", "th"],
];

export function replaceAccents(
  word: string,
  additionalAccents?: MonkeyTypes.Accents
): string {
  if (!word) return word;

  const accentsArray = [...(additionalAccents || []), ...accents];
  const uppercased = word.toUpperCase();
  const cases = [...word].map((it, i) => it == uppercased[i]);
  const newWordArray: string[] = [];

  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const isUpperCase = cases[i];
    const accent = accentsArray.find((accent) =>
      accent[0].includes(char.toLowerCase())
    );

    if (accent) {
      if (isUpperCase) {
        newWordArray.push(accent[1].substring(0, 1).toUpperCase());
        newWordArray.push(accent[1].substring(1));
      } else {
        newWordArray.push(accent[1]);
      }
    } else {
      newWordArray.push(isUpperCase ? char.toUpperCase() : char);
    }
  }

  return newWordArray.join("");
}
