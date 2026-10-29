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

  it("allows one attempt per day", async () => {
    expect(await DailyQuote.setupDailyQuote()).toBe(true);
    expect(DailyQuote.isDailyActive()).toBe(true);
    expect(Config.mode).toBe("quote");
    expect(Config.language).toBe("english");

    DailyQuote.onTestStart();
    DailyQuote.onTestFinish(finishedTest);
    expect(DailyQuote.isDailyActive()).toBe(false);

    const result = DailyQuote.getDailyResult();
    expect(result).toEqual({ wpm: 102, acc: 97, errors: [0, 0, 1, 0, 3, 0] });
    expect(result && DailyQuote.getShareText(result)).toBe(
      `Monkeytype daily quote #2\n⌨️ 102 wpm · 🎯 97% acc\n🟩🟩🟨🟩🟥🟩\n${location.origin}/?daily`,
    );

    DailyQuote.onRestart();
    expect(Config.mode).toBe("time");
    expect(Config.language).toBe("german");
    expect(Config.quoteLength).toEqual([1]);

    expect(await DailyQuote.setupDailyQuote()).toBe(false);

    vi.setSystemTime(Date.UTC(2026, 9, 31, 1));
    expect(await DailyQuote.setupDailyQuote()).toBe(true);
  });

  it("uses up the attempt when abandoned", async () => {
    await DailyQuote.setupDailyQuote();
    // restarting before starting keeps the daily quote
    DailyQuote.onRestart();
    expect(DailyQuote.isDailyActive()).toBe(true);

    DailyQuote.onTestStart();
    DailyQuote.onRestart();
    expect(DailyQuote.isDailyActive()).toBe(false);
    expect(Config.mode).toBe("time");
    expect(await DailyQuote.setupDailyQuote()).toBe(false);
  });

  it("refuses with funboxes", async () => {
    __testing.replaceConfig({ funbox: ["mirror"] });
    expect(await DailyQuote.setupDailyQuote()).toBe(false);
  });
});
