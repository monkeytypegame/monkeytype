import { describe, it, expect } from "vitest";
import { getTestWordFacts } from "../../src/ts/test/words-generator";

describe("words-generator", () => {
  describe("getTestWordFacts", () => {
    const none = {
      hasTab: false,
      hasNewline: false,
      hasNumbers: false,
      hasKorean: false,
    };

    it("finds nothing in plain words", () => {
      expect(getTestWordFacts([["the ", "cat"], ["sat"]])).toEqual(none);
    });

    it.each([
      ["a tab", "a\tb", { hasTab: true }],
      ["a newline", "end\n", { hasNewline: true }],
      ["a digit", "abc1", { hasNumbers: true }],
      ["an Arabic-Indic digit", "٣", { hasNumbers: true }],
      ["a Devanagari digit", "३", { hasNumbers: true }],
      ["a Hangul syllable", "안녕", { hasKorean: true }],
      ["decomposed Hangul", "안녕".normalize("NFD"), { hasKorean: true }],
      ["compatibility jamo", "ㅎ", { hasKorean: true }],
    ])("finds %s", (_name, word, expected) => {
      expect(getTestWordFacts([[word]])).toEqual({ ...none, ...expected });
    });

    it("finds a fact only in the wordset, not the generated words", () => {
      const generated = ["the ", "cat "];
      const wordset = ["the", "cat", "a1", "안녕"];
      expect(getTestWordFacts([generated, wordset])).toEqual({
        ...none,
        hasNumbers: true,
        hasKorean: true,
      });
    });
  });
});
