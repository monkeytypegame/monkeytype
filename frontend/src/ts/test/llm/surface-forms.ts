// a valid surface form is any non-empty string without spaces.
// spaces are reserved as word boundary delimiters in the constraint trie.
// all other characters (letters, digits, punctuation, symbols) are allowed
// because the constraint engine treats them as regular trie transitions.
export function isValidSurfaceForm(word: string): boolean {
  const normalized = word.normalize("NFC");
  return normalized.length > 0 && !normalized.includes(" ");
}

export function buildSurfaceForms(words: string[]): string[] {
  const seen = new Set<string>();
  const surfaceForms: string[] = [];

  for (const word of words) {
    const normalizedWord = word.normalize("NFC");

    if (!isValidSurfaceForm(normalizedWord)) {
      continue;
    }

    if (seen.has(normalizedWord)) {
      continue;
    }

    seen.add(normalizedWord);
    surfaceForms.push(normalizedWord);
  }

  return surfaceForms;
}
