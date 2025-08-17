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
  wordSlice: string,
  additionalAccents?: Accents
): [string, string] | undefined {
  const lookup = wordSlice.toLowerCase();

  const found = additionalAccents?.find((rule) => lookup.startsWith(rule[0]));

  const common = accentsMap.get(lookup[0] as string);

  const commonFound =
    common !== undefined
      ? ([lookup[0], common] as [string, string])
      : undefined;

  return found !== undefined ? found : commonFound;
}

export function replaceAccents(
  word: string,
  additionalAccents?: Accents
): string {
  if (!word) return word;
  const uppercased = word.toUpperCase();
  const cases = [...word].map((it, i) => it === uppercased[i]);
  const newWordArray: string[] = [];

  let offset = 0;
  for (let i = 0; i < word.length; i++) {
    const index = i + offset;
    if (index >= word.length) break;
    const wordSlice = word.slice(index);
    const caseSlice = cases.slice(index);
    const accent = findAccent(wordSlice, additionalAccents);

    if (accent !== undefined) {
      for (let j = 0; j < accent[1].length; j++) {
        const char = accent[1][j] as string;
        const isUpperCase = caseSlice[j] ?? false;
        newWordArray.push(isUpperCase ? char.toUpperCase() : char);
      }
      offset += accent[0].length - 1;
    } else {
      const char = word[index] as string;
      const isUpperCase = cases[index];
      newWordArray.push(isUpperCase ? char.toUpperCase() : char);
    }
  }

  return newWordArray.join("");
}
