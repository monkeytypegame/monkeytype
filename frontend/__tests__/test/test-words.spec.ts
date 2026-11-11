import { describe, it, expect, beforeEach, vi } from "vitest";

const { isLanguageRightToLeft, isDirectionReversed } = vi.hoisted(() => ({
  isLanguageRightToLeft: vi.fn(() => false),
  isDirectionReversed: vi.fn(() => false),
}));

vi.mock("../../src/ts/states/test", () => ({
  getActiveWordIndex: () => 0,
  isLanguageRightToLeft,
  isDirectionReversed,
}));

import { words } from "../../src/ts/test/test-words";
import type { Direction } from "../../src/ts/utils/strings";

describe("test-words", () => {
  beforeEach(() => {
    words.reset();
    isLanguageRightToLeft.mockReturnValue(false);
    isDirectionReversed.mockReturnValue(false);
  });

  describe("push", () => {
    // separators are added by the generator as a trailing space/newline; push
    // splits that into the commit char while keeping the bare word as text
    it("splits the trailing separator into the commit char", () => {
      words.push("the ", 0);
      words.push("cat ", 0);
      words.push("sat", 0);
      expect(words.get().map((w) => w.text)).toEqual(["the", "cat", "sat"]);
      expect(words.get().map((w) => w.commit)).toEqual([" ", " ", ""]);
      expect(words.get().map((w) => w.textWithCommit)).toEqual([
        "the ",
        "cat ",
        "sat",
      ]);
    });

    it("tracks length and section indexes", () => {
      words.push("a ", 3);
      words.push("b", 5);
      expect(words.length).toBe(2);
      expect(words.get().map((w) => w.sectionIndex)).toEqual([3, 5]);
    });
  });

  describe("direction", () => {
    const pushed = (word: string): Direction => words.push(word, 0).direction;

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
      words.reset();
      isDirectionReversed.mockReturnValue(true);
      expect(pushed("hello ")).toBe("rtl");
    });

    it("is kept by raw words", () => {
      words.push("שלום ", 0);
      expect(words.get(0, true)?.direction).toBe("rtl");
    });
  });

  describe("removeCommitCharacterFromLastWord", () => {
    it("strips a trailing space from the last word", () => {
      words.push("the ", 0);
      words.push("end ", 0);
      words.removeCommitCharacterFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["the ", "end"]);
    });

    it("strips a trailing newline from the last word", () => {
      words.push("line\n", 0);
      words.removeCommitCharacterFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["line"]);
    });

    it("leaves a bare last word unchanged", () => {
      words.push("the ", 0);
      words.push("end", 0);
      words.removeCommitCharacterFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["the ", "end"]);
    });

    it("does nothing on an empty list", () => {
      expect(() => words.removeCommitCharacterFromLastWord()).not.toThrow();
      expect(words.get()).toEqual([]);
    });

    it("does not empty the last word when it's only a newline", () => {
      words.push("word\n", 0);
      words.push("\n", 0);
      words.removeCommitCharacterFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual([
        "word\n",
        "\n",
      ]);
    });
  });
});
