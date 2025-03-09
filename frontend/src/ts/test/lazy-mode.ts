const accents: Accents = [
  ["áàâäåãąą́āą̄ă", "a"],
  ["éèêëẽęę́ēę̄ėě", "e"],
  ["íìîïĩįį́īį̄ı", "i"],
  ["óòôöøõóōǫǫ́ǭő", "o"],
  ["úùûüŭũúūůű", "u"],
  ["ńň", "n"],
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
  ["ńṇṅ", "n"],
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

const accentsMap = new Map<string, string>(
  accents.flatMap((rule) => [...rule[0]].map((accent) => [accent, rule[1]]))
);

export type Accents = [string, string][];

function findAccent(
  char: string,
  additionalAccents?: Accents
): string | undefined {
  const lookup = char.toLowerCase();

  const found = additionalAccents?.find((rule) => rule[0].includes(lookup));

  return found !== undefined ? found[1] : accentsMap.get(lookup);
}

export function replaceAccents(
  word: string,
  additionalAccents?: Accents
): string {
  if (!word) return word;
  const uppercased = word.toUpperCase();
  const cases = [...word].map((it, i) => it == uppercased[i]);
  const newWordArray: string[] = [];

  for (let i = 0; i < word.length; i++) {
    const char = word[i] as string;
    const isUpperCase = cases[i];
    const accent = findAccent(char, additionalAccents);

    if (accent !== undefined) {
      if (isUpperCase) {
        newWordArray.push(accent.substring(0, 1).toUpperCase());
        newWordArray.push(accent.substring(1));
      } else {
        newWordArray.push(accent);
      }
    } else {
      newWordArray.push(isUpperCase ? char.toUpperCase() : char);
    }
  }

  return newWordArray.join("");
}
