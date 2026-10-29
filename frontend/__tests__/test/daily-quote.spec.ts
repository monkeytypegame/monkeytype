import { CompletedEvent } from "@monkeytype/schemas/results";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// fresh module state (and localStorage cache) per test
let DailyQuote: typeof import("../../src/ts/test/daily-quote");
let Config: typeof import("../../src/ts/config/store").Config;
let __testing: typeof import("../../src/ts/config/testing").__testing;

vi.mock("../../src/ts/controllers/quotes-controller", () => ({
  default: {
    getQuotes: vi.fn(async () => ({
      quotes: [],
      groups: [[], [{ id: 3 }, { id: 1 }, { id: 2 }]],
    })),
  },
}));

const finishedTest = {
  wpm: 101.6,
  acc: 97.8,
  chartData: { wpm: [], burst: [], err: [0, 0, 1, 0, 3, 0] },
} as unknown as CompletedEvent;

function label(): string | null {
  const score = DailyQuote.getDailyScore();
  return score && DailyQuote.getAttemptLabel(score);
}

describe("daily-quote", () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    DailyQuote = await import("../../src/ts/test/daily-quote");
    ({ Config } = await import("../../src/ts/config/store"));
    ({ __testing } = await import("../../src/ts/config/testing"));
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 9, 30, 12));
    __testing.replaceConfig({
      mode: "time",
      language: "german",
      quoteLength: [1],
      funbox: [],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("numbers days from the first one", () => {
    expect(DailyQuote.getDailyNumber()).toBe(2);
  });

  it("counts every attempt", async () => {
    expect(await DailyQuote.setupDailyQuote()).toBe(true);
    expect(DailyQuote.isDailyActive()).toBe(true);
    expect(Config.mode).toBe("quote");
    expect(Config.language).toBe("english");

    // restarting before starting isn't an attempt
    DailyQuote.onRestart();
    expect(DailyQuote.getTodaysAttempts()).toBe(0);

    // abandoned
    DailyQuote.onTestStart();
    DailyQuote.onRestart();
    expect(DailyQuote.isDailyActive()).toBe(true);
    expect(Config.mode).toBe("quote");

    DailyQuote.onTestStart();
    DailyQuote.onTestFinish(finishedTest, false);
    // best on the latest attempt
    expect(DailyQuote.getDailyScore()).toEqual({
      best: { wpm: 102, acc: 97, errors: [0, 0, 1, 0, 3, 0], attempt: 2 },
      attempts: 2,
    });
    const score = DailyQuote.getDailyScore();
    expect(score && DailyQuote.getShareText(score)).toBe(
      `Monkeytype daily quote #2 (2nd attempt)\n⌨️ 102 wpm · 🎯 97% acc\n🟩🟩🟨🟩🟥🟩\n${location.origin}/?daily`,
    );

    // slower: the best stays
    DailyQuote.onRestart();
    DailyQuote.onTestStart();
    DailyQuote.onTestFinish({ ...finishedTest, wpm: 80 }, false);
    expect(DailyQuote.getDailyScore()?.best.wpm).toBe(102);
    expect(label()).toBe("best out of 3 attempts");

    // invalid: can't be the best
    DailyQuote.onRestart();
    DailyQuote.onTestStart();
    DailyQuote.onTestFinish({ ...finishedTest, wpm: 200 }, true);
    expect(DailyQuote.getDailyScore()?.best.wpm).toBe(102);

    // new best
    DailyQuote.onRestart();
    DailyQuote.onTestStart();
    DailyQuote.onTestFinish({ ...finishedTest, wpm: 110 }, false);
    expect(label()).toBe("5th attempt");

    // still on the daily quote after finishing
    DailyQuote.onRestart();
    expect(DailyQuote.getDailyScore()).toBe(null);
    expect(DailyQuote.isDailyActive()).toBe(true);

    vi.setSystemTime(Date.UTC(2026, 9, 31, 1));
    expect(DailyQuote.getTodaysAttempts()).toBe(0);
  });

  it("restores the settings on exit", async () => {
    await DailyQuote.setupDailyQuote();
    DailyQuote.onTestStart();
    DailyQuote.exitDailyQuote();
    DailyQuote.onRestart();
    expect(DailyQuote.isDailyActive()).toBe(false);
    expect(Config.mode).toBe("time");
    expect(Config.language).toBe("german");
    expect(Config.quoteLength).toEqual([1]);

    // the attempts are kept
    expect(await DailyQuote.setupDailyQuote()).toBe(true);
    expect(DailyQuote.getTodaysAttempts()).toBe(1);
  });

  it("refuses with funboxes", async () => {
    __testing.replaceConfig({ funbox: ["mirror"] });
    expect(await DailyQuote.setupDailyQuote()).toBe(false);
  });
});
