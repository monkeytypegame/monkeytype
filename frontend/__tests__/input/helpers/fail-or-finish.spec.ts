import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import {
  checkIfFailedDueToMinBurst,
  checkIfFailedDueToDifficulty,
  checkIfFinished,
} from "../../../src/ts/input/helpers/fail-or-finish";
import { __testing } from "../../../src/ts/config/testing";
import * as Misc from "../../../src/ts/utils/misc";
import * as Strings from "../../../src/ts/utils/strings";

const { replaceConfig } = __testing;

vi.mock("../../../src/ts/utils/misc", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../src/ts/utils/misc")>();
  return {
    ...actual,
    whorf: vi.fn(),
  };
});

vi.mock("../../../src/ts/utils/strings", () => ({
  isSpace: vi.fn(),
}));

describe("checkIfFailedDueToMinBurst", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceConfig({
      minBurst: "off",
      mode: "time",
      minBurstCustomSpeed: 100,
    });
    // oxlint-disable-next-line typescript/no-unsafe-call
    (Misc.whorf as any).mockReturnValue(0);
  });

  afterAll(() => {
    replaceConfig({});
  });

  it.each([
    {
      desc: "returns false if minBurst is off",
      config: { minBurst: "off" },
      lastBurst: 50,
      expected: false,
    },
    {
      desc: "returns false if lastBurst is null",
      config: { minBurst: "fixed" },
      lastBurst: null,
      expected: false,
    },
    {
      desc: "returns true if fixed burst is too slow",
      config: { minBurst: "fixed", minBurstCustomSpeed: 100 },
      lastBurst: 99,
      expected: true,
    },
    {
      desc: "returns false if fixed burst is fast enough",
      config: { minBurst: "fixed", minBurstCustomSpeed: 100 },
      lastBurst: 100,
      expected: false,
    },
    {
      desc: "returns true if flex burst is too slow",
      config: { minBurst: "flex", minBurstCustomSpeed: 100 },
      lastBurst: 49,
      whorfRet: 50,
      expected: true,
    },
    {
      desc: "returns false if flex burst is fast enough",
      config: { minBurst: "flex", minBurstCustomSpeed: 100 },
      lastBurst: 50,
      whorfRet: 50,
      expected: false,
    },
  ])("$desc", ({ config, lastBurst, whorfRet, expected }) => {
    replaceConfig(config as any);
    if (whorfRet !== undefined) {
      // oxlint-disable-next-line typescript/no-unsafe-call
      (Misc.whorf as any).mockReturnValue(whorfRet);
    }

    const result = checkIfFailedDueToMinBurst({
      testInputWithData: "test",
      currentWord: "test",
      lastBurst,
    });

    expect(result).toBe(expected);
  });

  it("uses correct length for whorf calculation in zen mode", () => {
    replaceConfig({ minBurst: "flex", mode: "zen", minBurstCustomSpeed: 100 });
    checkIfFailedDueToMinBurst({
      testInputWithData: "zeninput",
      currentWord: "ignored",
      lastBurst: 50,
    });
    expect(Misc.whorf).toHaveBeenCalledWith(100, 8);
  });

  it("uses correct length for whorf calculation in normal mode", () => {
    replaceConfig({ minBurst: "flex", mode: "time", minBurstCustomSpeed: 100 });
    checkIfFailedDueToMinBurst({
      testInputWithData: "input",
      currentWord: "target",
      lastBurst: 50,
    });
    expect(Misc.whorf).toHaveBeenCalledWith(100, 6);
  });
});

describe("checkIfFailedDueToDifficulty", () => {
  beforeEach(() => {
    replaceConfig({
      mode: "time",
      difficulty: "normal",
    });
  });

  afterAll(() => {
    replaceConfig({});
  });

  it.each([
    {
      desc: "zen mode, master - never fails",
      config: { mode: "zen", difficulty: "master" },
      correct: false,
      data: " ",
      testInput: "hello",
      targetWord: "hello ",
      commitCharacterType: "separator",
      expected: false,
    },
    {
      desc: "zen mode - never fails",
      config: { mode: "zen", difficulty: "normal" },
      correct: false,
      data: " ",
      testInput: "hello",
      targetWord: "hello ",
      commitCharacterType: "separator",
      expected: false,
    },
    //
    {
      desc: "normal typing incorrect- never fails",
      config: { difficulty: "normal" },
      correct: false,
      data: "h",
      testInput: "hell",
      targetWord: "hello",
      commitCharacterType: false,
      expected: false,
    },
    {
      desc: "normal typing space incorrect - never fails",
      config: { difficulty: "normal" },
      correct: false,
      data: " ",
      testInput: "hell",
      targetWord: "hello ",
      commitCharacterType: "separator",
      expected: false,
    },
    {
      desc: "normal typing correct - never fails",
      config: { difficulty: "normal" },
      correct: true,
      data: "o",
      testInput: "hell",
      targetWord: "hello",
      commitCharacterType: false,
      expected: false,
    },
    {
      desc: "normal typing space correct - never fails",
      config: { difficulty: "normal" },
      correct: true,
      data: " ",
      testInput: "hello",
      targetWord: "hello ",
      commitCharacterType: "separator",
      expected: false,
    },
    //
    {
      desc: "expert - fail if incorrect space",
      config: { difficulty: "expert" },
      correct: false,
      data: " ",
      testInput: "he",
      targetWord: "hello ",
      commitCharacterType: "separator",
      expected: true,
    },
    {
      desc: "expert - dont fail if space is the first character",
      config: { difficulty: "expert" },
      correct: false,
      data: " ",
      testInput: "",
      targetWord: "hello ",
      commitCharacterType: "separator",
      expected: false,
    },
    {
      desc: "expert: - dont fail if just typing",
      config: { difficulty: "expert" },
      correct: false,
      data: "h",
      testInput: "hell",
      targetWord: "hello",
      commitCharacterType: false,
      expected: false,
    },
    {
      desc: "expert: - dont fail if just typing",
      config: { difficulty: "expert" },
      correct: true,
      data: "o",
      testInput: "hell",
      targetWord: "hello",
      commitCharacterType: false,
      expected: false,
    },
    //
    {
      desc: "master - fail if incorrect char",
      config: { difficulty: "master" },
      correct: false,
      data: "h",
      testInput: "hell",
      targetWord: "hello",
      commitCharacterType: false,
      expected: true,
    },
    {
      desc: "master - fail if incorrect first space",
      config: { difficulty: "master" },
      correct: true,
      data: " ",
      testInput: "",
      targetWord: "hello ",
      commitCharacterType: "separator",
      expected: false,
    },
    {
      desc: "master - dont fail if correct char",
      config: { difficulty: "master" },
      correct: true,
      data: "a",
      testInput: "te",
      targetWord: "tea",
      commitCharacterType: false,
      expected: false,
    },
    {
      desc: "master - dont fail if correct space",
      config: { difficulty: "master" },
      correct: true,
      data: " ",
      testInput: "hello",
      targetWord: "hello ",
      commitCharacterType: "separator",
      expected: false,
    },
  ])(
    "$desc",
    ({
      config,
      correct,
      data,
      testInput,
      targetWord,
      commitCharacterType,
      expected,
    }) => {
      replaceConfig(config as any);
      const result = checkIfFailedDueToDifficulty({
        data,
        testInput,
        targetWord,
        correct,
        commitCharacterType: commitCharacterType as "separator" | false,
      });
      expect(result).toBe(expected);
    },
  );
});

describe("checkIfFinished", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceConfig({
      quickEnd: false,
      stopOnError: "off",
    });
    // oxlint-disable-next-line typescript/no-unsafe-call
    (Strings.isSpace as any).mockReturnValue(false);
  });

  afterAll(() => {
    replaceConfig({});
  });

  it.each([
    {
      desc: "false if not all words typed",
      allWordsTyped: false,
      testInputWithData: "word",
      currentWord: "word",
      expected: false,
    },
    {
      desc: "false if not all words generated, but on the last word",
      allWordsGenerated: false,
      allWordsTyped: true,
      testInputWithData: "word",
      currentWord: "word",
      expected: false,
    },
    {
      desc: "true if last word is correct",
      allWordsTyped: true,
      testInputWithData: "word",
      currentWord: "word",
      expected: true,
    },
    {
      desc: "true if quickEnd enabled and lengths match",
      allWordsTyped: true,
      testInputWithData: "asdf",
      currentWord: "word",
      config: { quickEnd: true },
      expected: true,
    },
    {
      desc: "false if quickEnd disabled and lengths match",
      allWordsTyped: true,
      testInputWithData: "asdf",
      currentWord: "word",
      config: { quickEnd: false },
      expected: false,
    },
    {
      desc: "true if space on the last word",
      allWordsTyped: true,
      testInputWithData: "wo ",
      currentWord: "word",
      goingToNextWord: true,
      expected: true,
    },
    {
      desc: "false if still typing, quickend disabled",
      allWordsTyped: true,
      testInputWithData: "wordwordword",
      currentWord: "word",
      expected: false,
    },
  ] as {
    desc: string;
    allWordsTyped: boolean;
    allWordsGenerated?: boolean;
    goingToNextWord: boolean;
    testInputWithData: string;
    currentWord: string;
    config?: Record<string, any>;
    isSpace?: boolean;
    expected: boolean;
  }[])(
    "$desc",
    ({
      allWordsTyped,
      allWordsGenerated,
      goingToNextWord,
      testInputWithData,
      currentWord,
      config,
      expected,
    }) => {
      if (config) replaceConfig(config as any);

      const result = checkIfFinished({
        goingToNextWord,
        testInputWithData,
        currentWord,
        allWordsTyped,
        allWordsGenerated: allWordsGenerated ?? true,
      });

      expect(result).toBe(expected);
    },
  );
});
