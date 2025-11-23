import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import {
  isCharCorrect,
  shouldInsertSpaceCharacter,
} from "../../../src/ts/input/helpers/validation";
import { __testing } from "../../../src/ts/config";
import * as FunboxList from "../../../src/ts/test/funbox/list";
import * as Strings from "../../../src/ts/utils/strings";

const { replaceConfig } = __testing;

// Mock dependencies
vi.mock("../../../src/ts/test/funbox/list", () => ({
  findSingleActiveFunboxWithFunction: vi.fn(),
}));

vi.mock("../../../src/ts/utils/strings", () => ({
  areCharactersVisuallyEqual: vi.fn(),
  isSpace: vi.fn(),
}));

describe("isCharCorrect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Config defaults
    replaceConfig({
      mode: "words",
      language: "english",
      stopOnError: "off",
      difficulty: "normal",
      strictSpace: false,
    });
    (FunboxList.findSingleActiveFunboxWithFunction as any).mockReturnValue(
      null
    );
    (Strings.areCharactersVisuallyEqual as any).mockReturnValue(false);
    (Strings.isSpace as any).mockReturnValue(false);
  });

  afterAll(() => {
    replaceConfig({});
  });

  describe("Zen Mode", () => {
    it("always returns true", () => {
      replaceConfig({ mode: "zen" });
      expect(
        isCharCorrect({
          data: "a",
          inputValue: "test",
          targetWord: "word",
          correctShiftUsed: true,
        })
      ).toBe(true);
    });
  });

  describe("Shift Key", () => {
    it("returns false if correct shift was not used", () => {
      expect(
        isCharCorrect({
          data: "A",
          inputValue: "test",
          targetWord: "testA",
          correctShiftUsed: false,
        })
      ).toBe(false);
    });
  });

  describe("Space Handling", () => {
    it.each([
      ["returns true at the end of a correct word", " ", "word", "word", true],
      [
        "returns false at the end of an incorrect word",
        " ",
        "worx",
        "word",
        false,
      ],
      ["returns false in the middle of a word", " ", "wor", "word", false],
      ["returns false at the start of a word", " ", "", "word", false],
      [
        "returns false when longer than a word",
        " ",
        "wordwordword",
        "word",
        false,
      ],
    ])("%s", (_desc, char, input, word, expected) => {
      expect(
        isCharCorrect({
          data: char,
          inputValue: input,
          targetWord: word,
          correctShiftUsed: true,
        })
      ).toBe(expected);
    });
  });

  describe("Standard Matching", () => {
    it.each([
      ["a", "te", "tea", true],
      ["b", "te", "tea", false],
      ["x", "tea", "tea", false],
    ])(
      "char '%s' for input '%s' (current word '%s') -> %s",
      (char, input, word, expected) => {
        expect(
          isCharCorrect({
            data: char,
            inputValue: input,
            targetWord: word,
            correctShiftUsed: true,
          })
        ).toBe(expected);
      }
    );
  });

  it("throws error if data is undefined", () => {
    expect(() =>
      isCharCorrect({
        data: undefined as any,
        inputValue: "val",
        targetWord: "word",
        correctShiftUsed: true,
      })
    ).toThrow();
  });
});

describe("shouldInsertSpaceCharacter", () => {
  beforeEach(() => {
    (Strings.isSpace as any).mockReturnValue(true);
    replaceConfig({
      mode: "time",
      stopOnError: "off",
      strictSpace: false,
      difficulty: "normal",
    });
  });

  afterAll(() => {
    replaceConfig({});
  });

  it("returns null if data is not a space", () => {
    (Strings.isSpace as any).mockReturnValue(false);
    expect(
      shouldInsertSpaceCharacter({
        data: "a",
        inputValue: "test",
        targetWord: "test",
      })
    ).toBe(null);
  });

  it("returns false in zen mode", () => {
    replaceConfig({ mode: "zen" });
    expect(
      shouldInsertSpaceCharacter({
        data: " ",
        inputValue: "test",
        targetWord: "test",
      })
    ).toBe(false);
  });

  describe("Logic Checks", () => {
    it.each([
      // Standard behavior (submit word)
      {
        desc: "submit correct word",
        inputValue: "hello",
        targetWord: "hello",
        config: {
          stopOnError: "off",
          strictSpace: false,
          difficulty: "normal",
        },
        expected: false,
      },
      {
        desc: "submit incorrect word (stopOnError off)",
        inputValue: "hel",
        targetWord: "hello",
        config: {
          stopOnError: "off",
          strictSpace: false,
          difficulty: "normal",
        },
        expected: false,
      },
      // Stop on error
      {
        desc: "insert space if incorrect (stopOnError letter)",
        inputValue: "hel",
        targetWord: "hello",
        config: {
          stopOnError: "letter",
          strictSpace: false,
          difficulty: "normal",
        },
        expected: true,
      },
      {
        desc: "insert space if incorrect (stopOnError word)",
        inputValue: "hel",
        targetWord: "hello",
        config: {
          stopOnError: "word",
          strictSpace: false,
          difficulty: "normal",
        },
        expected: true,
      },
      {
        desc: "submit if correct (stopOnError letter)",
        inputValue: "hello",
        targetWord: "hello",
        config: {
          stopOnError: "letter",
          strictSpace: false,
          difficulty: "normal",
        },
        expected: false,
      },
      // Strict space / Difficulty
      {
        desc: "insert space if empty input (strictSpace on)",
        inputValue: "",
        targetWord: "hello",
        config: {
          stopOnError: "off",
          strictSpace: true,
          difficulty: "normal",
        },
        expected: true,
      },
      {
        desc: "insert space if empty input (difficulty not normal - expert or master)",
        inputValue: "",
        targetWord: "hello",
        config: {
          stopOnError: "off",
          strictSpace: false,
          difficulty: "expert",
        },
        expected: true,
      },
      {
        desc: "submit if not empty input (strictSpace on)",
        inputValue: "h",
        targetWord: "hello",
        config: {
          stopOnError: "off",
          strictSpace: true,
          difficulty: "normal",
        },
        expected: false,
      },
    ])("$desc", ({ inputValue, targetWord, config, expected }) => {
      replaceConfig(config as any);
      expect(
        shouldInsertSpaceCharacter({
          data: " ",
          inputValue,
          targetWord,
        })
      ).toBe(expected);
    });
  });
});
