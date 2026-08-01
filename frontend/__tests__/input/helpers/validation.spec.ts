import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import {
  isCharCorrect,
  shouldGoToNextWord,
} from "../../../src/ts/input/helpers/validation";
import { __testing } from "../../../src/ts/config/testing";
import * as FunboxList from "../../../src/ts/test/funbox/list";
import * as Strings from "../../../src/ts/utils/strings";

const { replaceConfig } = __testing;

// Mock dependencies
vi.mock("../../../src/ts/test/funbox/list", () => ({
  findSingleActiveFunboxWithFunction: vi.fn(),
}));

vi.mock("../../../src/ts/utils/strings", async () => {
  const actual = await vi.importActual<typeof Strings>(
    "../../../src/ts/utils/strings",
  );
  return {
    ...actual,
    areCharactersVisuallyEqual: vi.fn(),
  };
});

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
    // oxlint-disable-next-line typescript/no-unsafe-call
    (FunboxList.findSingleActiveFunboxWithFunction as any).mockReturnValue(
      null,
    );
    // oxlint-disable-next-line typescript/no-unsafe-call
    (Strings.areCharactersVisuallyEqual as any).mockReturnValue(false);
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
        }),
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
        }),
      ).toBe(false);
    });
  });

  describe("Space Handling", () => {
    it.each([
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
        }),
      ).toBe(expected);
    });
  });

  describe("Separator at the end of a word", () => {
    // target words store their separator as a trailing space/newline; typing
    // that separator at the separator position is a correct char regardless of
    // whether the preceding letters were correct (word-level correctness is
    // derived from the per-letter events elsewhere)
    it.each([
      ["space separator at the correct position", " ", "word", "word ", true],
      [
        "space separator is correct even after a wrong letter",
        " ",
        "worx",
        "word ",
        true,
      ],
      [
        "newline separator at the correct position",
        "\n",
        "word",
        "word\n",
        true,
      ],
      [
        "newline separator is correct even after a wrong letter",
        "\n",
        "xord",
        "word\n",
        true,
      ],
    ])("%s", (_desc, char, input, word, expected) => {
      expect(
        isCharCorrect({
          data: char,
          inputValue: input,
          targetWord: word,
          correctShiftUsed: true,
        }),
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
          }),
        ).toBe(expected);
      },
    );
  });
});

describe("shouldGoToNextWord", () => {
  // target words store their separator as a trailing space
  beforeEach(() => {
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

  it("returns false when the input is not a commit character", () => {
    expect(
      shouldGoToNextWord({
        data: "a",
        inputValue: "test",
        targetWord: "test ",
        commitCharacterType: false,
      }),
    ).toBe(false);
  });

  it("returns true in zen mode", () => {
    replaceConfig({ mode: "zen" });
    expect(
      shouldGoToNextWord({
        data: " ",
        inputValue: "test",
        targetWord: "test ",
        commitCharacterType: "separator",
      }),
    ).toBe(true);
  });

  it("returns true when committing a word with a newline", () => {
    expect(
      shouldGoToNextWord({
        data: "\n",
        inputValue: "word",
        targetWord: "word\n",
        commitCharacterType: "separator",
      }),
    ).toBe(true);
  });

  // the empty-input guard must not block a nospace commit on a 1-letter word,
  // otherwise such words can never be advanced
  it.each([
    { desc: "strictSpace on", strictSpace: true, difficulty: "normal" },
    { desc: "difficulty expert", strictSpace: false, difficulty: "expert" },
  ])(
    "commits a nospace 1-letter word on empty input ($desc)",
    ({ strictSpace, difficulty }) => {
      replaceConfig({ strictSpace, difficulty } as any);
      expect(
        shouldGoToNextWord({
          data: "a",
          inputValue: "",
          targetWord: "a",
          commitCharacterType: "nospace",
        }),
      ).toBe(true);
    },
  );

  describe("Logic Checks", () => {
    it.each([
      // Standard behavior (submit word)
      {
        desc: "go to next word on correct word",
        inputValue: "hello",
        targetWord: "hello ",
        config: {
          stopOnError: "off",
          strictSpace: false,
          difficulty: "normal",
        },
        expected: true,
      },
      {
        desc: "go to next word on incorrect word (stopOnError off)",
        inputValue: "hel",
        targetWord: "hello ",
        config: {
          stopOnError: "off",
          strictSpace: false,
          difficulty: "normal",
        },
        expected: true,
      },
      // Stop on error
      {
        desc: "stay on incorrect word (stopOnError letter)",
        inputValue: "hel",
        targetWord: "hello ",
        config: {
          stopOnError: "letter",
          strictSpace: false,
          difficulty: "normal",
        },
        expected: false,
      },
      {
        desc: "stay on incorrect word (stopOnError word)",
        inputValue: "hel",
        targetWord: "hello ",
        config: {
          stopOnError: "word",
          strictSpace: false,
          difficulty: "normal",
        },
        expected: false,
      },
      {
        desc: "go to next word on correct word (stopOnError letter)",
        inputValue: "hello",
        targetWord: "hello ",
        config: {
          stopOnError: "letter",
          strictSpace: false,
          difficulty: "normal",
        },
        expected: true,
      },
      // Strict space / Difficulty
      {
        desc: "stay on empty input (strictSpace on)",
        inputValue: "",
        targetWord: "hello ",
        config: {
          stopOnError: "off",
          strictSpace: true,
          difficulty: "normal",
        },
        expected: false,
      },
      {
        desc: "stay on empty input (difficulty not normal - expert or master)",
        inputValue: "",
        targetWord: "hello ",
        config: {
          stopOnError: "off",
          strictSpace: false,
          difficulty: "expert",
        },
        expected: false,
      },
      {
        desc: "go to next word on non-empty input (strictSpace on)",
        inputValue: "h",
        targetWord: "hello ",
        config: {
          stopOnError: "off",
          strictSpace: true,
          difficulty: "normal",
        },
        expected: true,
      },
    ])("$desc", ({ inputValue, targetWord, config, expected }) => {
      replaceConfig(config as any);
      expect(
        shouldGoToNextWord({
          data: " ",
          inputValue,
          targetWord,
          commitCharacterType: "separator",
        }),
      ).toBe(expected);
    });
  });
});
