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

vi.mock("../../../src/ts/utils/misc", () => ({
  whorf: vi.fn(),
}));

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
      desc: "returns false in zen mode even if master",
      config: { mode: "zen", difficulty: "master" },
      correct: false,
      spaceOrNewline: true,
      inputLen: 5,
      expected: false,
    },
    {
      desc: "returns false for normal difficulty",
      config: { difficulty: "normal" },
      correct: false,
      spaceOrNewline: true,
      inputLen: 5,
      expected: false,
    },
    {
      desc: "expert: returns true if incorrect, space, and input > 0",
      config: { difficulty: "expert" },
      correct: false,
      spaceOrNewline: true,
      inputLen: 1,
      expected: true,
    },
    {
      desc: "expert: returns false if correct",
      config: { difficulty: "expert" },
      correct: true,
      spaceOrNewline: true,
      inputLen: 1,
      expected: false,
    },
    {
      desc: "expert: returns false if not space/newline",
      config: { difficulty: "expert" },
      correct: false,
      spaceOrNewline: false,
      inputLen: 1,
      expected: false,
    },
    {
      desc: "expert: returns false if input length is 0",
      config: { difficulty: "expert" },
      correct: false,
      spaceOrNewline: true,
      inputLen: 0,
      expected: false,
    },
    {
      desc: "master: returns true if incorrect",
      config: { difficulty: "master" },
      correct: false,
      spaceOrNewline: false,
      inputLen: 1,
      expected: true,
    },
    {
      desc: "master: returns false if correct",
      config: { difficulty: "master" },
      correct: true,
      spaceOrNewline: false,
      inputLen: 1,
      expected: false,
    },
  ])("$desc", ({ config, correct, spaceOrNewline, inputLen, expected }) => {
    replaceConfig(config as any);
    const result = checkIfFailedDueToDifficulty({
      testInputResult: "a".repeat(inputLen),
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
      desc: "returns false if not all words typed",
      allWordsTyped: false,
      allGenerated: true,
      input: "word",
      current: "word",
      expected: false,
    },
    {
      desc: "returns false if not all words generated",
      allWordsTyped: true,
      allGenerated: false,
      input: "word",
      current: "word",
      expected: false,
    },
    {
      desc: "returns true if word is correct",
      allWordsTyped: true,
      allGenerated: true,
      input: "word",
      current: "word",
      expected: true,
    },
    {
      desc: "returns true if quickEnd enabled and lengths match",
      allWordsTyped: true,
      allGenerated: true,
      input: "wor",
      current: "wor",
      config: { quickEnd: true, stopOnError: "off" },
      expected: true,
    },
    {
      desc: "returns false if quickEnd enabled but stopOnError is on",
      allWordsTyped: true,
      allGenerated: true,
      input: "wor",
      current: "wor",
      config: { quickEnd: true, stopOnError: "letter" },
      expected: false,
    },
    {
      desc: "returns true if input char is space",
      allWordsTyped: true,
      allGenerated: true,
      input: "wor",
      current: "word",
      isSpace: true,
      expected: true,
    },
    {
      desc: "returns false if incorrect, no quickEnd, no space",
      allWordsTyped: true,
      allGenerated: true,
      input: "wor",
      current: "word",
      expected: false,
    },
  ])(
    "$desc",
    ({
      allWordsTyped,
      allGenerated,
      input,
      current,
      config,
      isSpace,
      expected,
    }) => {
      if (config) replaceConfig(config as any);
      (TestLogic.areAllTestWordsGenerated as any).mockReturnValue(allGenerated);
      (Strings.isSpace as any).mockReturnValue(isSpace || false);

      const result = checkIfFinished({
        data: isSpace ? " " : "a",
        testInputResult: input,
        currentWord: current,
        allWordsTyped,
      });

      expect(result).toBe(expected);
    }
  );
});
