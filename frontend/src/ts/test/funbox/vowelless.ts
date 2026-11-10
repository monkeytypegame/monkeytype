const vowels = /[aeiou]/gi;

export function removeVowels(word: string): string {
  return word.replace(vowels, "");
}

export function isVowelOnlyWord(word: string): boolean {
  // Ignore punctuation when deciding whether a token contains only vowels.
  const letters = word.replace(/[^a-z]/gi, "");
  return letters.length > 0 && /^[aeiou]+$/i.test(letters);
}

export function removeVowelOnlyWords(words: string[]): string[] {
  return words.filter((word) => !isVowelOnlyWord(word));
}
