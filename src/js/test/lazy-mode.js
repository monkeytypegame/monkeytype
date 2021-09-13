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
];

export function replaceAccents(word) {
  if (!accents) return newWord;

  let newWord = word;

  let regex;

  for (let i = 0; i < accents.length; i++) {
    regex = new RegExp(`[${accents[i][0]}]`, "gi");
    newWord = newWord.replace(regex, accents[i][1]);
  }

  return newWord;
}
