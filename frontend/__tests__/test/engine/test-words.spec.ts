import { describe, it, expect, beforeEach, vi } from "vitest";

const { isLanguageRightToLeft, isDirectionReversed } = vi.hoisted(() => ({
  isLanguageRightToLeft: vi.fn(() => false),
  isDirectionReversed: vi.fn(() => false),
}));

vi.mock("../../../src/ts/states/test", () => ({
  isLanguageRightToLeft,
  isDirectionReversed,
}));

import {
  pushWord,
  removeCommitCharFromLastWord,
  resetWords,
  words,
} from "../../../src/ts/test/engine/test-words";
import type { Direction } from "../../../src/ts/utils/strings";

describe("test-words", () => {
  beforeEach(() => {
    resetWords();
    isLanguageRightToLeft.mockReturnValue(false);
    isDirectionReversed.mockReturnValue(false);
  });

  describe("push", () => {
    // separators are added by the generator as a trailing space/newline; push
    // splits that into the commit char while keeping the bare word as text
    it("splits the trailing separator into the commit char", () => {
      pushWord("the ", 0);
      pushWord("cat ", 0);
      pushWord("sat", 0);
      expect(words.get().map((w) => w.text)).toEqual(["the", "cat", "sat"]);
      expect(words.get().map((w) => w.commit)).toEqual([" ", " ", ""]);
      expect(words.get().map((w) => w.textWithCommit)).toEqual([
        "the ",
        "cat ",
        "sat",
      ]);
    });

    it("tracks length and section indexes", () => {
      pushWord("a ", 3);
      pushWord("b", 5);
      expect(words.length).toBe(2);
      expect(words.get().map((w) => w.sectionIndex)).toEqual([3, 5]);
    });
  });

  describe("direction", () => {
    const pushed = (word: string): Direction => pushWord(word, 0).direction;

    it("comes from the word's own characters", () => {
      isLanguageRightToLeft.mockReturnValue(true);
      expect(pushed("hello ")).toBe("ltr");
      isLanguageRightToLeft.mockReturnValue(false);
      expect(pushed("שלום ")).toBe("rtl");
    });

    it("falls back to the language without directional characters", () => {
      expect(pushed("!!! ")).toBe("ltr");
      isLanguageRightToLeft.mockReturnValue(true);
      expect(pushed("!!! ")).toBe("rtl");
    });

    it("is reversed, including the fallback", () => {
      isDirectionReversed.mockReturnValue(true);
      expect(pushed("hello ")).toBe("rtl");
      expect(pushed("שלום ")).toBe("ltr");
      expect(pushed("!!! ")).toBe("rtl");
    });

    it("is resolved again when a repeated test pushes the same word", () => {
      expect(pushed("hello ")).toBe("ltr");
      resetWords();
      isDirectionReversed.mockReturnValue(true);
      expect(pushed("hello ")).toBe("rtl");
    });

    it("is kept by raw words", () => {
      pushWord("שלום ", 0);
      expect(words.get(0, true)?.direction).toBe("rtl");
    });
  });

  describe("removeCommitCharacterFromLastWord", () => {
    it("strips a trailing space from the last word", () => {
      pushWord("the ", 0);
      pushWord("end ", 0);
      removeCommitCharFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["the ", "end"]);
    });

    it("strips a trailing newline from the last word", () => {
      pushWord("line\n", 0);
      removeCommitCharFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["line"]);
    });

    it("leaves a bare last word unchanged", () => {
      pushWord("the ", 0);
      pushWord("end", 0);
      removeCommitCharFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["the ", "end"]);
    });

    it("does nothing on an empty list", () => {
      expect(() => removeCommitCharFromLastWord()).not.toThrow();
      expect(words.get()).toEqual([]);
    });

    it("does not empty the last word when it's only a newline", () => {
      pushWord("word\n", 0);
      pushWord("\n", 0);
      removeCommitCharFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual([
        "word\n",
        "\n",
      ]);
    });
  });
});
