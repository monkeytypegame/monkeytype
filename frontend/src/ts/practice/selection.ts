import { createSignal } from "solid-js";
import type { PracticeConfig } from "./types";
import { practiceConfigSchema } from "./types";

// Deliberately session-only: focused exercises never change account settings or rankings.
const [selection, setSelection] = createSignal<PracticeConfig | null>(null);
export const getKeySelection = selection;

export function applyKeySelection(config: PracticeConfig | null): void {
  if (config === null) {
    setSelection(null);
    return;
  }
  const parsed = practiceConfigSchema.parse(config);
  if (parsed.characters.length === 0) {
    throw new Error("Select at least one key.");
  }
  setSelection({ ...parsed, characters: [...new Set(parsed.characters)] });
}

export function matchesSelection(
  text: string,
  characters: readonly string[],
): boolean {
  const allowed = new Set(characters);
  return (
    text.trim().length > 0 &&
    Array.from(text).every((char) => /\s/u.test(char) || allowed.has(char))
  );
}

export function effectiveCharacters(
  characters: readonly string[],
  numbers: boolean,
  punctuation: boolean,
): string[] {
  return characters.filter((char) => {
    if (/^[0-9]$/.test(char)) return numbers;
    if (/[\p{P}\p{S}]/u.test(char)) return punctuation;
    return true;
  });
}
