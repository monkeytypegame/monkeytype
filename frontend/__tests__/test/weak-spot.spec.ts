import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Wordset } from "../../src/ts/test/wordset";
import type { InputEventData } from "../../src/ts/test/events/types";

type WeakSpotModule = typeof import("../../src/ts/test/weak-spot");
type LiveCacheModule = typeof import("../../src/ts/test/events/live-cache");

function wordsetReturning(first: string, second: string): Wordset {
  return {
    randomWord: vi
      .fn()
      .mockReturnValue(first)
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second),
  } as unknown as Wordset;
}

describe("weak-spot", () => {
  let WeakSpot: WeakSpotModule;
  let liveCache: LiveCacheModule;
  let now: number;

  beforeEach(async () => {
    vi.resetModules();
    WeakSpot = await import("../../src/ts/test/weak-spot");
    liveCache = await import("../../src/ts/test/events/live-cache");
    liveCache.resetLiveCache();
    now = 0;
  });

  function input(word: string, data: InputEventData, spacing = 100): void {
    now += spacing;
    liveCache.recordEventForCache({
      type: "input",
      ms: now,
      testMs: now,
      data,
    });
    if (data.inputType === "insertText") WeakSpot.updateScore(word);
  }

  function letter(
    word: string,
    char: string,
    charIndex: number,
    spacing = 100,
    extra: Partial<InputEventData> = {},
  ): void {
    input(
      word,
      {
        inputType: "insertText",
        wordIndex: 0,
        charIndex,
        inputValue: word.slice(0, charIndex) + char,
        data: char,
        correct: word.slice(charIndex).startsWith(char),
        ...extra,
      },
      spacing,
    );
  }

  function pair(word: string, spacing: number, correct = true): void {
    liveCache.resetLiveCache();
    letter(word, word[0] as string, 0);
    letter(word, correct ? (word[1] as string) : "x", 1, spacing);
  }

  it("selects the slow transition without treating its letters as weak", () => {
    pair("th", 200);
    pair("sh", 80);
    expect(WeakSpot.getWord(wordsetReturning("ship", "thing"))).toBe("thing");
  });

  it("penalizes the intended pair rather than the typo", () => {
    pair("ab", 1000);
    pair("th", 1, false);
    expect(WeakSpot.getWord(wordsetReturning("ab", "th"))).toBe("th");
    expect(WeakSpot.getWord(wordsetReturning("ab", "tx"))).toBe("ab");
  });

  it("keeps the 5000 ms error penalty", () => {
    pair("th", 100, false);
    pair("ab", 5099);
    expect(WeakSpot.getWord(wordsetReturning("ab", "th"))).toBe("th");
    pair("cd", 5101);
    expect(WeakSpot.getWord(wordsetReturning("th", "cd"))).toBe("cd");
  });

  it("does not learn a transition immediately after an incorrect key", () => {
    letter("the", "t", 0);
    letter("the", "x", 1);
    letter("the", "e", 2);
    expect(WeakSpot.getWord(wordsetReturning("ab", "xe"))).toBe("ab");
  });

  it("scores a stopped error but not its retry as a new transition", () => {
    letter("th", "t", 0);
    letter("th", "x", 1, 100, { inputStopped: true });
    letter("th", "h", 1);
    expect(WeakSpot.getWord(wordsetReturning("ab", "th"))).toBe("th");
    expect(WeakSpot.getWord(wordsetReturning("ab", "xh"))).toBe("ab");
  });

  it("does not bridge whitespace or word changes", () => {
    letter("t ", "t", 0);
    letter("t ", " ", 1, 5000, { commitsWord: true });
    letter("he", "h", 0, 5000, { wordIndex: 1 });
    expect(WeakSpot.getWord(wordsetReturning("ab", "th"))).toBe("ab");
    expect(WeakSpot.getWord(wordsetReturning("ab", "t "))).toBe("ab");
    expect(WeakSpot.getWord(wordsetReturning("ab", " h"))).toBe("ab");
  });

  it("does not bridge words even when no space was typed", () => {
    letter("t", "t", 0);
    letter("he", "h", 0, 5000, { wordIndex: 1 });
    expect(WeakSpot.getWord(wordsetReturning("ab", "th"))).toBe("ab");
  });

  it("ignores overtyping beyond the target word", () => {
    letter("t", "t", 0);
    letter("t", "h", 1);
    expect(WeakSpot.getWord(wordsetReturning("ab", "th"))).toBe("ab");
  });

  it("resets transition context, but keeps learned scores, across tests", () => {
    pair("ab", 100);
    liveCache.resetLiveCache();
    letter("th", "t", 0);
    expect(WeakSpot.getWord(wordsetReturning("ab", "bt"))).toBe("ab");
    letter("th", "h", 1, 200);
    expect(WeakSpot.getWord(wordsetReturning("ab", "th"))).toBe("th");
  });

  it("does not use deletion timing as a letter transition", () => {
    letter("the", "t", 0);
    letter("the", "h", 1);
    input("the", {
      inputType: "deleteContentBackward",
      wordIndex: 0,
      charIndex: 2,
      inputValue: "t",
    });
    letter("the", "h", 1, 5000);
    pair("ab", 200);
    expect(WeakSpot.getWord(wordsetReturning("ab", "th"))).toBe("ab");
    expect(WeakSpot.getWord(wordsetReturning("ab", "hh"))).toBe("ab");
  });

  it.each([
    { automatic: true as const },
    { isCompositionEnding: true as const },
  ])("ignores generated or composed input: %j", (extra) => {
    letter("th", "t", 0);
    letter("th", "h", 1, 5000, extra);
    letter("the", "e", 2);
    expect(WeakSpot.getWord(wordsetReturning("ab", "th"))).toBe("ab");
    expect(WeakSpot.getWord(wordsetReturning("ab", "he"))).toBe("ab");
  });

  it("forms candidate pairs from Unicode code points", () => {
    letter("𐐀a", "𐐀", 0);
    letter("𐐀a", "a", 2);
    expect(WeakSpot.getWord(wordsetReturning("ab", "𐐀a"))).toBe("𐐀a");
  });

  it("averages only observed bigrams", () => {
    pair("th", 300);
    pair("he", 100);
    pair("ab", 150);
    expect(WeakSpot.getWord(wordsetReturning("ab", "them"))).toBe("them");
    pair("cd", 250);
    expect(WeakSpot.getWord(wordsetReturning("them", "cd"))).toBe("cd");
  });

  it("retains the capped 50-observation moving average", () => {
    for (let i = 0; i < 50; i++) pair("th", 100);
    pair("th", 5100); // 5100 / 50 + 100 * 49 / 50 = 200
    pair("ab", 199);
    pair("cd", 201);
    expect(WeakSpot.getWord(wordsetReturning("ab", "th"))).toBe("th");
    expect(WeakSpot.getWord(wordsetReturning("th", "cd"))).toBe("cd");
  });

  it("samples 20 words, keeping the first on ties or no observations", () => {
    const wordset = wordsetReturning("a", "b");
    expect(WeakSpot.getWord(wordset)).toBe("a");
    expect(wordset.randomWord).toHaveBeenCalledTimes(20);
    expect(wordset.randomWord).toHaveBeenCalledWith("normal");
  });
});
