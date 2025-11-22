import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import {
  checkIfFailedDueToMinBurst,
  checkIfFailedDueToDifficulty,
  checkIfFinished,
} from "../../../src/ts/input/helpers/fail-or-finish";
import { __testing } from "../../../src/ts/config";
import * as Misc from "../../../src/ts/utils/misc";
import * as TestLogic from "../../../src/ts/test/test-logic";
import * as Strings from "../../../src/ts/utils/strings";

const { replaceConfig } = __testing;

vi.mock("../../../src/ts/utils/misc", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../../src/ts/utils/misc")
  >();
  return {
    ...actual,
    whorf: vi.fn(),
  };
});

vi.mock("../../../src/ts/test/test-logic", () => ({
  areAllTestWordsGenerated: vi.fn(),
}));

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
    (Misc.whorf as any).mockReturnValue(0);
    (TestLogic.areAllTestWordsGenerated as any).mockReturnValue(true);
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
      (Misc.whorf as any).mockReturnValue(whorfRet);
    }

    const result = checkIfFailedDueToMinBurst({
      testInputResult: "test",
      currentWord: "test",
      lastBurst,
    });

    expect(result).toBe(expected);
  });

  it("uses correct length for whorf calculation in zen mode", () => {
    replaceConfig({ minBurst: "flex", mode: "zen", minBurstCustomSpeed: 100 });
    checkIfFailedDueToMinBurst({
      testInputResult: "zeninput",
      currentWord: "ignored",
      lastBurst: 50,
    });
    expect(Misc.whorf).toHaveBeenCalledWith(100, 8);
  });

  it("uses correct length for whorf calculation in normal mode", () => {
    replaceConfig({ minBurst: "flex", mode: "time", minBurstCustomSpeed: 100 });
    checkIfFailedDueToMinBurst({
      testInputResult: "input",
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
      spaceOrNewline: true,
      input: "hello",
      expected: false,
    },
    {
      desc: "zen mode - never fails",
      config: { mode: "zen", difficulty: "normal" },
      correct: false,
      spaceOrNewline: true,
      input: "hello",
      expected: false,
    },
    //
    {
      desc: "normal typing incorrect- never fails",
      config: { difficulty: "normal" },
      correct: false,
      spaceOrNewline: false,
      input: "hello",
      expected: false,
    },
    {
      desc: "normal typing space incorrect - never fails",
      config: { difficulty: "normal" },
      correct: false,
      spaceOrNewline: true,
      input: "hello",
      expected: false,
    },
    {
      desc: "normal typing correct - never fails",
      config: { difficulty: "normal" },
      correct: true,
      spaceOrNewline: false,
      input: "hello",
      expected: false,
    },
    {
      desc: "normal typing space correct - never fails",
      config: { difficulty: "normal" },
      correct: true,
      spaceOrNewline: true,
      input: "hello",
      expected: false,
    },
    //
    {
      desc: "expert - fail if incorrect space",
      config: { difficulty: "expert" },
      correct: false,
      spaceOrNewline: true,
      input: "he",
      expected: true,
    },
    {
      desc: "expert - dont fail if space is the first character",
      config: { difficulty: "expert" },
      correct: false,
      spaceOrNewline: true,
      input: " ",
      expected: false,
    },
    {
      desc: "expert: - dont fail if just typing",
      config: { difficulty: "expert" },
      correct: false,
      spaceOrNewline: false,
      input: "h",
      expected: false,
    },
    {
      desc: "expert: - dont fail if just typing",
      config: { difficulty: "expert" },
      correct: true,
      spaceOrNewline: false,
      input: "h",
      expected: false,
    },
    //
    {
      desc: "master - fail if incorrect char",
      config: { difficulty: "master" },
      correct: false,
      spaceOrNewline: false,
      input: "h",
      expected: true,
    },
    {
      desc: "master - fail if incorrect first space",
      config: { difficulty: "master" },
      correct: true,
      spaceOrNewline: true,
      input: " ",
      expected: false,
    },
    {
      desc: "master - dont fail if correct char",
      config: { difficulty: "master" },
      correct: true,
      spaceOrNewline: false,
      input: "a",
      expected: false,
    },
    {
      desc: "master - dont fail if correct space",
      config: { difficulty: "master" },
      correct: true,
      spaceOrNewline: true,
      input: " ",
      expected: false,
    },
  ])("$desc", ({ config, correct, spaceOrNewline, input, expected }) => {
    replaceConfig(config as any);
    const result = checkIfFailedDueToDifficulty({
      testInputResult: input,
      correct,
      spaceOrNewline,
    });
    expect(result).toBe(expected);
  });
});

describe("checkIfFinished", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceConfig({
      quickEnd: false,
      stopOnError: "off",
    });
    (Strings.isSpace as any).mockReturnValue(false);
    (TestLogic.areAllTestWordsGenerated as any).mockReturnValue(true);
  });

  afterAll(() => {
    replaceConfig({});
  });

  it.each([
    {
      desc: "false if not all words typed",
      allWordsTyped: false,
      testInputResult: "word",
      currentWord: "word",
      expected: false,
    },
    {
      desc: "false if not all words generated, but on the last word",
      allGenerated: false,
      allWordsTyped: true,
      testInputResult: "word",
      currentWord: "word",
      expected: false,
    },
    {
      desc: "true if last word is correct",
      allWordsTyped: true,
      testInputResult: "word",
      currentWord: "word",
      expected: true,
    },
    {
      desc: "true if quickEnd enabled and lengths match",
      allWordsTyped: true,
      testInputResult: "asdf",
      currentWord: "word",
      config: { quickEnd: true },
      expected: true,
    },
    {
      desc: "false if quickEnd disabled and lengths match",
      allWordsTyped: true,
      testInputResult: "asdf",
      currentWord: "word",
      config: { quickEnd: false },
      expected: false,
    },
    {
      desc: "true if space on the last word",
      allWordsTyped: true,
      testInputResult: "wo ",
      currentWord: "word",
      shouldGoToNextWord: true,
      expected: true,
    },
    {
      desc: "false if still typing, quickend disabled",
      allWordsTyped: true,
      testInputResult: "wordwordword",
      currentWord: "word",
      expected: false,
    },
  ] as {
    desc: string;
    allWordsTyped: boolean;
    allGenerated?: boolean;
    shouldGoToNextWord: boolean;
    testInputResult: string;
    currentWord: string;
    config?: Record<string, any>;
    isSpace?: boolean;
    expected: boolean;
  }[])(
    "$desc",
    ({
      allWordsTyped,
      allGenerated,
      shouldGoToNextWord,
      testInputResult,
      currentWord,
      config,
      expected,
    }) => {
      if (config) replaceConfig(config as any);
      (TestLogic.areAllTestWordsGenerated as any).mockReturnValue(
        allGenerated ?? true
      );

      const result = checkIfFinished({
        shouldGoToNextWord,
        testInputResult,
        currentWord,
        allWordsTyped,
      });

      expect(result).toBe(expected);
    }
  );
});
