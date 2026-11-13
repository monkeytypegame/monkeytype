import { describe, expect, it } from "vitest";

import { createLetters } from "../../../../src/ts/components/pages/test/letters";

const settings = { replaceTypos: false, replaceComposition: false };

function statuses(text: string, input: string): string[] {
  return createLetters({ text, input, composition: "" }, settings).map(
    (it) => it.status,
  );
}

describe("createLetters", () => {
  describe("single code point characters", () => {
    it("marks each letter on its own", () => {
      expect(statuses("abc", "abd")).toEqual([
        "correct",
        "correct",
        "incorrect",
      ]);
    });

    it("marks untyped and extra letters", () => {
      expect(statuses("abc", "a")).toEqual(["correct", "untyped", "untyped"]);
      expect(statuses("ab", "abc")).toEqual(["correct", "correct", "extra"]);
    });
  });

  describe("multi code point characters", () => {
    // சோ = ச (U+0B9A) + ோ (U+0BCB), one grapheme cluster
    const text = "சோழ";

    it("keeps a correctly typed word correct", () => {
      expect(statuses(text, "சோழ")).toEqual(["correct", "correct", "correct"]);
    });

    it("marks the whole character when the vowel sign is wrong", () => {
      // சொழ: ொ (U+0BCA) instead of ோ (U+0BCB)
      expect(statuses(text, "சொழ")).toEqual([
        "incorrect",
        "incorrect",
        "correct",
      ]);
    });

    it("marks the whole character when the consonant is wrong", () => {
      // மோழ: ம instead of ச
      expect(statuses(text, "மோழ")).toEqual([
        "incorrect",
        "incorrect",
        "correct",
      ]);
    });

    it("does not touch other characters of the word", () => {
      // wrong last character only
      expect(statuses(text, "சோன")).toEqual([
        "correct",
        "correct",
        "incorrect",
      ]);
    });

    it("keeps a partially typed character correct while it matches", () => {
      expect(statuses(text, "ச")).toEqual(["correct", "untyped", "untyped"]);
    });

    it("marks a partially typed character when the typed part is wrong", () => {
      expect(statuses(text, "ம")).toEqual(["incorrect", "untyped", "untyped"]);
    });

    it("works with combining marks outside of Tamil", () => {
      // e + combining acute accent is one character
      expect(statuses("éx", "èx")).toEqual([
        "incorrect",
        "incorrect",
        "correct",
      ]);
    });
  });
});
