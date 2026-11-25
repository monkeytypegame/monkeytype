import { describe, expect, it } from "vitest";
import {
  isVowelOnlyWord,
  removeVowels,
  removeVowelOnlyWords,
} from "../../../src/ts/test/funbox/vowelless";

describe("vowelless funbox", () => {
  it("removes uppercase and lowercase vowels while preserving other characters", () => {
    expect(removeVowels("Monkey TYPE! 123, ok?")).toBe("Mnky TYP! 123, k?");
  });

  it("preserves consonant order", () => {
    expect(removeVowels("beautiful")).toBe("btfl");
  });

  it.each(["a", "AEIOU", "a!"])('recognizes "%s" as vowel-only', (word) => {
    expect(isVowelOnlyWord(word)).toBe(true);
  });

  it.each(["b", "a-b", "!!!", "1"])('keeps "%s" eligible', (word) => {
    expect(isVowelOnlyWord(word)).toBe(false);
  });

  it("skips vowel-only source tokens without mutating the source", () => {
    const words = ["the", "a!", "AEIOU", "b"];

    expect(removeVowelOnlyWords(words)).toEqual(["the", "b"]);
    expect(words).toEqual(["the", "a!", "AEIOU", "b"]);
  });
});
