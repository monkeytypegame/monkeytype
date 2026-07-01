import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../src/ts/test/test-stats", () => ({
  start: 1000,
}));

vi.mock("../../../src/ts/test/test-state", () => ({
  activeWordIndex: 0,
  bailedOut: false,
  resultCalculating: false,
  koreanStatus: false,
}));

vi.mock("../../../src/ts/config/store", () => ({
  Config: { mode: "words", funbox: [] as string[], words: 25, time: 0 },
  getConfig: {},
}));

vi.mock("../../../src/ts/test/test-words", () => {
  type CommitChar = " " | "\n" | "";
  type Word = { text: string; textWithCommit: string; commit: CommitChar };
  const list: Word[] = [];
  return {
    words: {
      list,
      get(): Word[] {
        return [...list];
      },
      push(word: string) {
        let commit: CommitChar = "";
        if (word.endsWith(" ")) {
          commit = " ";
          word = word.slice(0, -1);
        } else if (word.endsWith("\n")) {
          commit = "\n";
          word = word.slice(0, -1);
        }
        list.push({ text: word, textWithCommit: word + commit, commit });
      },
      reset() {
        list.length = 0;
      },
    },
  };
});

const customTextLimit = { mode: "words" as "words" | "time", value: 0 };
vi.mock("../../../src/ts/test/custom-text", () => ({
  getLimit: () => customTextLimit,
}));

vi.mock("../../../src/ts/states/test", () => ({
  getCurrentQuote: () => null,
}));

import {
  logTestEvent,
  resetTestEvents,
  getAllTestEvents,
  cleanupData,
  buildEventLog,
  __testing,
} from "../../../src/ts/test/events/data";
import { getEventsPerWord } from "../../../src/ts/test/events/helpers";
import {
  getStartToFirstKeypressMs,
  getLastKeypressToEndMs,
  getBurstHistory,
  getTestDurationMs,
  getAccuracy,
  getKeypressOverlap,
  getErrorCountHistory,
  getAfkDuration,
  getIncompleteTestSeconds,
  getKeypressDurations,
  getKeypressesPerSecond,
  getChars,
  getInputHistory,
  getWpmHistory,
  __testing as statsTesting,
  getCorrectedWordsHistory,
  getKeypressSpacing,
} from "../../../src/ts/test/events/stats";
import type {
  InputEventData,
  KeydownEventData,
  KeyupEventData,
  TimerEventData,
} from "../../../src/ts/test/events/types";
import { Config } from "../../../src/ts/config/store";
import { Keycode } from "../../../src/ts/constants/keys";
import * as TestState from "../../../src/ts/test/test-state";
import { words as TestWords } from "../../../src/ts/test/test-words";

function pushWords(...words: string[]): void {
  words.forEach((word, i) => TestWords.push(word, i));
}

function keyDown(code: Keycode = "KeyA"): KeydownEventData {
  return { code };
}

function keyUp(code: Keycode = "KeyA"): KeyupEventData {
  return { code };
}

const inputPerWord = new Map<number, string>();

function input(
  overrides: Partial<{
    charIndex: number;
    wordIndex: number;
    data: string;
    correct: boolean;
    inputType: string;
    isCompositionEnding: boolean;
    inputStopped: boolean;
    commitsWord: true;
    inputValue: string;
  }> = {},
): InputEventData {
  const wordIndex = overrides.wordIndex ?? 0;
  const data = overrides.data ?? "a";
  const inputStopped = overrides.inputStopped ?? false;

  let inputValue: string;
  if (overrides.inputValue !== undefined) {
    inputValue = overrides.inputValue;
  } else {
    const prev = inputPerWord.get(wordIndex) ?? "";
    inputValue = inputStopped ? prev : prev + data;
    inputPerWord.set(wordIndex, inputValue);
  }

  return {
    charIndex: 0,
    wordIndex: 0,
    inputType: "insertText",
    data: "a",
    correct: true,
    isCompositionEnding: false,
    inputStopped: false,
    inputValue,
    ...overrides,
  } as InputEventData;
}

function timer(
  event: "start" | "step" | "end",
  timerVal: number,
  opts: { catchup?: true } = {},
): TimerEventData {
  if (event === "step") {
    return opts.catchup
      ? { event, timer: timerVal, catchup: true }
      : { event, timer: timerVal, drift: 0 };
  }
  return { event, timer: timerVal, date: 0 };
}

// Helper: sets up a basic test with timer start, steps at 1s intervals,
// input events, and timer end
function setupBasicTest(): void {
  // start=0, step@1s, step@2s, step@3s, end@3s
  logTestEvent("timer", 1000, timer("start", 0));
  // 3 inputs in first second
  logTestEvent("input", 1200, input());
  logTestEvent("input", 1400, input({ charIndex: 1 }));
  logTestEvent("input", 1600, input({ charIndex: 2 }));
  logTestEvent("timer", 2000, timer("step", 1));
  // 2 inputs in second second
  logTestEvent("input", 2200, input({ charIndex: 3 }));
  logTestEvent("input", 2400, input({ charIndex: 4 }));
  logTestEvent("timer", 3000, timer("step", 2));
  // 1 input in third second
  logTestEvent("input", 3200, input({ charIndex: 5 }));
  logTestEvent("timer", 4000, timer("step", 3));
  logTestEvent("timer", 4000, timer("end", 3));
}

describe("stats.ts", () => {
  beforeEach(() => {
    resetTestEvents();
    __testing.resetPressedKeys();
    (Config as { mode: string }).mode = "words";
    (Config as { funbox: string[] }).funbox = [];
    (Config as { words: number }).words = 25;
    (Config as { time: number }).time = 0;
    (TestState as { activeWordIndex: number }).activeWordIndex = 0;
    TestWords.reset();
    inputPerWord.clear();
  });

  describe("getLaggedTimerBoundaries", () => {
    it("returns step boundaries and end", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 3000, timer("step", 2));
      logTestEvent("timer", 4000, timer("step", 3));
      logTestEvent("timer", 4000, timer("end", 3));

      const eventLog = buildEventLog();
      // end testMs=3000, last step testMs=3000 — gap is 0 < 500, end skipped
      expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toEqual([
        1000, 2000, 3000,
      ]);
    });

    it("includes end as boundary when endMs % 1000 >= 500ms", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 2500, timer("end", 1));

      const eventLog = buildEventLog();
      // endMs=1500 → 1500%1000=500ms → roundTo2(0.5)=0.5 → boundary added
      expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toEqual([
        1000, 1500,
      ]);
    });

    it("skips end when too close to last step", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 2400, timer("end", 1));

      const eventLog = buildEventLog();
      // end at testMs 1400, last step at testMs 1000 — gap is 400 < 500
      expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toEqual([1000]);
    });

    it("includes end boundary when endMs % 1000 rounds to 0.5s", () => {
      // endMs=1496 → 1496%1000=496ms → roundTo2(0.496)=0.50 → boundary added
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 2496, timer("end", 1));

      const eventLog = buildEventLog();
      expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toEqual([
        1000, 1496,
      ]);
    });

    it("skips end boundary when endMs % 1000 rounds below 0.5s", () => {
      // endMs=1494 → 1494%1000=494ms → roundTo2(0.494)=0.49 → no boundary
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 2494, timer("end", 1));

      const eventLog = buildEventLog();
      expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toEqual([1000]);
    });

    it("skips end boundary for .49 test even when step fires slightly early (drift)", () => {
      // Step fires 5ms early (at 995ms instead of 1000ms).
      // Gap = 1490-995 = 495ms — the old gap-based check would have added a boundary
      // (roundTo2(0.495)=0.5), but endMs%1000=490ms → roundTo2(0.49)<0.5 → no boundary.
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 1995, timer("step", 1));
      logTestEvent("timer", 2490, timer("end", 1));

      const eventLog = buildEventLog();
      expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toEqual([995]);
    });

    it("includes end boundary for .99 test even when step fires late (drift)", () => {
      // Step fires 510ms late (at 1510ms instead of 1000ms).
      // Gap = 1990-1510 = 480ms — gap-based check would miss the boundary,
      // but endMs%1000=990ms → roundTo2(0.99)>=0.5 → boundary added.
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2510, timer("step", 1));
      logTestEvent("timer", 2990, timer("end", 1));

      const eventLog = buildEventLog();
      expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toEqual([
        1510, 1990,
      ]);
    });

    it("excludes short trailing interval (<500ms) for non-round test duration", () => {
      // 1.35s test: step at 1s, end at 1.35s — remainder 350ms < 500
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 2350, timer("end", 1));

      const eventLog = buildEventLog();
      // end testMs=1350, last step testMs=1000 — gap is 350 < 500, end skipped
      expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toEqual([1000]);
    });

    it("excludes short trailing interval (<500ms) for sub one second test duration", () => {
      // 1.35s test: step at 1s, end at 1.35s — remainder 350ms < 500
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 1350, timer("end", 0));

      const eventLog = buildEventLog();
      // end testMs=1350, last step testMs=1000 — gap is 350 < 500, end skipped
      expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toEqual([]);
    });

    it("returns empty when no timer events", () => {
      logTestEvent("keydown", 1000, keyDown());

      const eventLog = buildEventLog();
      expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toEqual([]);
    });

    it("adjusts end in zen mode by removing trailing afk", () => {
      (Config as { mode: string }).mode = "zen";
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1500, keyDown());
      logTestEvent("keyup", 1600, keyUp());
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 3000, timer("step", 2));
      // last keypress at testMs 500, end at testMs 4000 → lkte = 3500
      logTestEvent("timer", 5000, timer("end", 4));

      const eventLog = buildEventLog();
      const boundaries = statsTesting.getLaggedTimerBoundaries(eventLog);
      // adjusted end = 4000 - 3500 = 500, steps at 1000 and 2000 are past it
      expect(boundaries).toEqual([500]);
    });

    it("skips end boundary when endMs rounds up to whole second", () => {
      // endMs=19997: roundTo2(19.997)=20.00 → fractional 0 → no extra bucket
      // Legacy CE1 doesn't push extra because stats.time=20.00 has no fractional.
      // Naive (endMs % 1000)/1000 = 0.997 → roundTo2 = 1.0 would wrongly add.
      logTestEvent("timer", 0, timer("start", 0));
      for (let i = 1; i <= 20; i++) {
        logTestEvent("timer", i * 1000 - 10, timer("step", i));
      }
      logTestEvent("timer", 19997, timer("end", 20));

      const eventLog = buildEventLog();
      // 20 step boundaries, no end boundary (testSeconds rounds to 20.00)
      expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toHaveLength(20);
    });

    it("skips end boundary in time mode even when endMs %1000 >= 500ms", () => {
      // 120s time test where timer fires step 120 slightly early at ~119.99s.
      // Legacy time mode never pushes an extra bucket — CE2 must match by
      // skipping the end boundary entirely.
      (Config as { mode: string }).mode = "time";
      logTestEvent("timer", 0, timer("start", 0));
      for (let i = 1; i <= 120; i++) {
        logTestEvent("timer", i * 1000 - 8, timer("step", i));
      }
      logTestEvent("timer", 119994, timer("end", 120));

      const eventLog = buildEventLog();
      const boundaries = statsTesting.getLaggedTimerBoundaries(eventLog);
      // 120 step boundaries, no end boundary
      expect(boundaries).toHaveLength(120);
    });

    it("skips end boundary in custom time mode", () => {
      (Config as { mode: string }).mode = "custom";
      customTextLimit.mode = "time";
      try {
        logTestEvent("timer", 0, timer("start", 0));
        for (let i = 1; i <= 30; i++) {
          logTestEvent("timer", i * 1000, timer("step", i));
        }
        logTestEvent("timer", 29994, timer("end", 30));

        const eventLog = buildEventLog();
        expect(statsTesting.getLaggedTimerBoundaries(eventLog)).toHaveLength(
          30,
        );
      } finally {
        customTextLimit.mode = "words";
      }
    });

    describe("invariant: boundaries.length === Math.round(endMs / 1000)", () => {
      // Sanity invariant: for non-timed modes, the number of timer boundaries
      // must equal Math.round(testDurationSeconds) — matches the legacy
      // keypressCountHistory length contract. Catches drift-induced extra steps
      // or off-by-one boundaries.
      const cases: { name: string; endMs: number }[] = [
        { name: ".00 (exactly 5s)", endMs: 5000 },
        { name: ".49 (5.49s)", endMs: 5490 },
        { name: ".50 (5.50s)", endMs: 5500 },
        { name: ".99 (5.99s)", endMs: 5990 },
        { name: "sub-1s .49", endMs: 490 },
        { name: "sub-1s .99", endMs: 990 },
      ];

      for (const { name, endMs } of cases) {
        it(`holds for ${name}`, () => {
          logTestEvent("timer", 0, timer("start", 0));
          const fullSeconds = Math.floor(endMs / 1000);
          for (let i = 1; i <= fullSeconds; i++) {
            logTestEvent("timer", i * 1000, timer("step", i));
          }
          logTestEvent("timer", endMs, timer("end", fullSeconds));

          const eventLog = buildEventLog();
          const boundaries = statsTesting.getLaggedTimerBoundaries(eventLog);
          const roundedDuration = Math.round(endMs / 1000);
          expect(boundaries).toHaveLength(roundedDuration);
        });
      }
    });
  });

  describe("getTimerBoundaries", () => {
    it("returns empty when no end event", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2000, timer("step", 1));

      const eventLog = buildEventLog();
      expect(statsTesting.getTimerBoundaries(eventLog)).toEqual([]);
    });

    it("returns ideal-grid boundaries based on end event's tick count", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      // step events with arbitrary drift — should not affect output
      logTestEvent("timer", 1995, timer("step", 1));
      logTestEvent("timer", 3050, timer("step", 2));
      logTestEvent("timer", 3990, timer("step", 3));
      logTestEvent("timer", 4000, timer("end", 3));

      const eventLog = buildEventLog();
      expect(statsTesting.getTimerBoundaries(eventLog)).toEqual([
        1000, 2000, 3000,
      ]);
    });

    it("uses end event's timer field for tick count, ignoring step count", () => {
      // simulates a stall: only one real step fired, but the test ended at tick 5
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2079, timer("step", 1));
      // catch-up + recovery would have logged more step events here
      logTestEvent("timer", 6000, timer("end", 5));

      const eventLog = buildEventLog();
      expect(statsTesting.getTimerBoundaries(eventLog)).toEqual([
        1000, 2000, 3000, 4000, 5000,
      ]);
    });

    it("appends fractional tail for non-timed test with .5s+ remainder", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 4500, timer("end", 3));

      const eventLog = buildEventLog();
      // 3 ticks + tail at 3500ms
      expect(statsTesting.getTimerBoundaries(eventLog)).toEqual([
        1000, 2000, 3000, 3500,
      ]);
    });

    it("omits fractional tail under .5s for non-timed test", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 4250, timer("end", 3));

      const eventLog = buildEventLog();
      expect(statsTesting.getTimerBoundaries(eventLog)).toEqual([
        1000, 2000, 3000,
      ]);
    });

    it("omits fractional tail in time mode regardless of remainder", () => {
      (Config as { mode: string }).mode = "time";
      logTestEvent("timer", 0, timer("start", 0));
      logTestEvent("timer", 15500, timer("end", 15));

      const eventLog = buildEventLog();
      // 15 boundaries, no tail
      expect(statsTesting.getTimerBoundaries(eventLog)).toHaveLength(15);
    });

    it("trims zen-mode trailing afk and caps tick count", () => {
      (Config as { mode: string }).mode = "zen";
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1500, keyDown());
      logTestEvent("keyup", 1600, keyUp());
      // last keypress at testMs 500, end at testMs 4000 → afk = 3500
      // adjusted endMs = 500 → 0 full ticks, plus tail (500ms >= .5s)
      logTestEvent("timer", 5000, timer("end", 4));

      const eventLog = buildEventLog();
      expect(statsTesting.getTimerBoundaries(eventLog)).toEqual([500]);
    });
  });

  describe("getTimerBoundaryLabels", () => {
    it("returns empty when no timer events", () => {
      const eventLog = buildEventLog();
      expect(statsTesting.getTimerBoundaryLabels(eventLog)).toEqual([]);
    });

    it("labels clean step boundaries by index", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 3000, timer("step", 2));
      logTestEvent("timer", 4000, timer("step", 3));
      logTestEvent("timer", 4000, timer("end", 3));

      const eventLog = buildEventLog();
      expect(statsTesting.getTimerBoundaryLabels(eventLog)).toEqual([
        "1",
        "2",
        "3",
      ]);
    });

    it("labels a fractional trailing end boundary with its time", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 3000, timer("step", 2));
      logTestEvent("timer", 4000, timer("step", 3));
      logTestEvent("timer", 4500, timer("end", 3));

      const eventLog = buildEventLog();
      expect(statsTesting.getTimerBoundaryLabels(eventLog)).toEqual([
        "1",
        "2",
        "3",
        "3.50",
      ]);
    });

    it("tolerates small step drift (within ~1 frame)", () => {
      // steps fire ~5ms early due to drift — still label "1", "2", etc.
      // end at a clean whole second so no tail boundary is added
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 1995, timer("step", 1));
      logTestEvent("timer", 2990, timer("step", 2));
      logTestEvent("timer", 3985, timer("step", 3));
      logTestEvent("timer", 4000, timer("end", 3));

      const eventLog = buildEventLog();
      expect(statsTesting.getTimerBoundaryLabels(eventLog)).toEqual([
        "1",
        "2",
        "3",
      ]);
    });

    it("labels the bucket containing a catchup recovery with LAG", () => {
      // tick 2 (catchup) fires at testMs 3101 — falls in bucket (3000, 4000]
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 2079, timer("step", 1));
      logTestEvent("timer", 4101, timer("step", 2, { catchup: true }));
      logTestEvent("timer", 4101, timer("step", 3));
      logTestEvent("timer", 5050, timer("step", 4));
      logTestEvent("timer", 5050, timer("end", 4));

      const eventLog = buildEventLog();
      // perfect-grid boundaries: [1000, 2000, 3000, 4000]
      // bucket 4 (boundary 4000, range (3000, 4000]) contains catchup at 3101 → LAG
      expect(statsTesting.getTimerBoundaryLabels(eventLog)).toEqual([
        "1",
        "2",
        "3",
        "LAG",
      ]);
    });
  });

  describe("getStartToFirstKeypressMs", () => {
    it("returns time from start to first keydown", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1150, keyDown());

      expect(getStartToFirstKeypressMs(buildEventLog())).toBe(150);
    });

    it("returns 0 if keydown comes before start", () => {
      logTestEvent("keydown", 900, keyDown());
      logTestEvent("timer", 1000, timer("start", 0));

      expect(getStartToFirstKeypressMs(buildEventLog())).toBe(0);
    });

    it("returns 0 in zen mode", () => {
      (Config as { mode: string }).mode = "zen";
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1150, keyDown());

      expect(getStartToFirstKeypressMs(buildEventLog())).toBe(0);
    });

    it("returns 0 if no events", () => {
      expect(getStartToFirstKeypressMs(buildEventLog())).toBe(0);
    });
  });

  describe("getLastKeypressToEndMs", () => {
    it("returns time from last keydown to end", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1500, keyDown());
      logTestEvent("keyup", 1600, keyUp());
      logTestEvent("keydown", 1800, keyDown());
      logTestEvent("timer", 2000, timer("end", 1));

      expect(getLastKeypressToEndMs(buildEventLog())).toBe(200);
    });

    it("returns 0 in zen mode", () => {
      (Config as { mode: string }).mode = "zen";
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1500, keyDown());
      logTestEvent("timer", 2000, timer("end", 1));

      expect(getLastKeypressToEndMs(buildEventLog())).toBe(0);
    });
  });

  describe("getTestDurationMs", () => {
    it("returns end testMs", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1500, keyDown());
      logTestEvent("timer", 4000, timer("end", 3));

      expect(getTestDurationMs(buildEventLog())).toBe(3000);
    });

    it("returns 0 if no end event", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      expect(getTestDurationMs(buildEventLog())).toBe(0);
    });
  });

  describe("getBurstHistory", () => {
    it("converts keypresses to WPM using real interval duration", () => {
      setupBasicTest();

      const raw = getBurstHistory(buildEventLog());
      // 3 keypresses in 1s = (3/5)*60 = 36 WPM
      expect(raw[0]).toBe(36);
      // 2 keypresses in 1s = (2/5)*60 = 24 WPM
      expect(raw[1]).toBe(24);
      // 1 keypress in 1s = (1/5)*60 = 12 WPM
      expect(raw[2]).toBe(12);
    });

    it("ignores non-insertText events", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("input", 1200, input());
      logTestEvent("input", 1400, {
        charIndex: 1,
        wordIndex: 0,
        inputType: "deleteContentBackward",
      } as InputEventData);
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 2000, timer("end", 1));

      const raw = getBurstHistory(buildEventLog());
      expect(raw).toEqual([12]); // 1 keypress in 1s
    });
  });

  describe("getErrorCountHistory", () => {
    it("counts incorrect insertText events per interval", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("input", 1200, input({ correct: false }));
      logTestEvent("input", 1400, input({ charIndex: 1 }));
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("input", 2200, input({ charIndex: 2, correct: false }));
      logTestEvent("input", 2400, input({ charIndex: 3, correct: false }));
      logTestEvent("timer", 3000, timer("step", 2));
      logTestEvent("timer", 3000, timer("end", 2));

      const errors = getErrorCountHistory(buildEventLog());
      expect(errors).toEqual([1, 2]);
    });

    it("returns zeros when all correct", () => {
      setupBasicTest();
      const errors = getErrorCountHistory(buildEventLog());
      expect(errors).toEqual([0, 0, 0]);
    });
  });

  describe("getAfkDuration", () => {
    it("counts intervals with no keydown events", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1200, keyDown());
      logTestEvent("keyup", 1300, keyUp());
      logTestEvent("timer", 2000, timer("step", 1));
      // no keydowns in second interval
      logTestEvent("timer", 3000, timer("step", 2));
      logTestEvent("keydown", 3200, keyDown());
      logTestEvent("keyup", 3300, keyUp());
      logTestEvent("timer", 4000, timer("step", 3));
      logTestEvent("timer", 4000, timer("end", 3));

      expect(getAfkDuration(buildEventLog())).toBe(1);
    });

    it("returns 0 when all intervals have keydowns", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1200, keyDown());
      logTestEvent("keyup", 1300, keyUp());
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("keydown", 2200, keyDown());
      logTestEvent("keyup", 2300, keyUp());
      logTestEvent("timer", 3000, timer("step", 2));
      logTestEvent("timer", 3000, timer("end", 2));

      expect(getAfkDuration(buildEventLog())).toBe(0);
    });
  });

  describe("getIncompleteTestSeconds", () => {
    // Guards the abandoned-test (restart) measurement: it must exclude idle
    // time so a tab left open for hours doesn't leak into incompleteTestSeconds.
    it("excludes idle time — only the typed span counts", () => {
      // 60s elapsed, but typing only in the first 3 seconds, then idle
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("input", 1200, input()); // second 1
      logTestEvent("input", 2200, input({ charIndex: 1 })); // second 2
      logTestEvent("input", 3200, input({ charIndex: 2 })); // second 3
      logTestEvent("timer", 61000, timer("end", 60));

      // duration 60s − 57 idle seconds = 3
      expect(getIncompleteTestSeconds(buildEventLog())).toBe(3);
    });

    it("keeps the full duration when typing is continuous", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("input", 1200, input()); // second 1
      logTestEvent("input", 2200, input({ charIndex: 1 })); // second 2
      logTestEvent("input", 3200, input({ charIndex: 2 })); // second 3
      logTestEvent("input", 4200, input({ charIndex: 3 })); // second 4
      logTestEvent("input", 5200, input({ charIndex: 4 })); // second 5
      logTestEvent("timer", 6000, timer("end", 5));

      expect(getIncompleteTestSeconds(buildEventLog())).toBe(5);
    });

    it("returns 0 for an unterminated log (no timer end event)", () => {
      // documents why the restart path must log a timer "end" first: with no
      // boundaries getTestDurationMs is 0, so nothing leaks through
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("input", 1200, input());

      expect(getIncompleteTestSeconds(buildEventLog())).toBe(0);
    });

    it("never goes negative", () => {
      // pure-idle test: 0 typed seconds, all intervals AFK
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("timer", 4000, timer("end", 3));

      expect(getIncompleteTestSeconds(buildEventLog())).toBe(0);
    });
  });

  describe("getInputHistory", () => {
    it("treats abandoned word as empty when Firefox Ctrl+Backspace ate the sentinel", () => {
      // Firefox groups whitespace + non-word punctuation as one delete run.
      // Sequence: type "=ri" at word 1, Ctrl+Backspace twice. The first delete
      // leaves "=" (browser deletes "ri" only). The second deletes the
      // sentinel + "=" together, which monkeytype interprets as crossing the
      // word boundary → goToPreviousWord. Word 1 is abandoned with leftover
      // "=" residue in its event stream; its final state should still be "".
      pushWords("hello", "leave");

      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent(
        "input",
        1100,
        input({ wordIndex: 0, data: "h", charIndex: 0 }),
      );
      logTestEvent(
        "input",
        1110,
        input({ wordIndex: 0, data: "e", charIndex: 1 }),
      );
      logTestEvent(
        "input",
        1120,
        input({ wordIndex: 0, data: "l", charIndex: 2 }),
      );
      logTestEvent(
        "input",
        1130,
        input({ wordIndex: 0, data: "l", charIndex: 3 }),
      );
      logTestEvent(
        "input",
        1140,
        input({ wordIndex: 0, data: "o", charIndex: 4 }),
      );
      logTestEvent(
        "input",
        1150,
        input({
          wordIndex: 0,
          data: " ",
          charIndex: 5,
          commitsWord: true,
        }),
      );

      logTestEvent(
        "input",
        1200,
        input({
          wordIndex: 1,
          data: "=",
          correct: false,
          charIndex: 0,
        }),
      );
      logTestEvent(
        "input",
        1210,
        input({
          wordIndex: 1,
          data: "r",
          correct: false,
          charIndex: 1,
        }),
      );
      logTestEvent(
        "input",
        1220,
        input({
          wordIndex: 1,
          data: "i",
          correct: false,
          charIndex: 2,
        }),
      );

      // first Ctrl+Backspace: "=ri" → "="
      logTestEvent("input", 1300, {
        wordIndex: 1,
        charIndex: 3,
        inputType: "deleteWordBackward",
        inputValue: "=",
      } as InputEventData);

      // second Ctrl+Backspace: Firefox ate sentinel + "=" → goToPreviousWord;
      // clearedNextWord marks word 1 (= wordIndex + 1) as abandoned
      logTestEvent("input", 1400, {
        wordIndex: 0,
        charIndex: 0,
        inputType: "deleteWordBackward",
        inputValue: "",
        clearedNextWord: true,
      } as InputEventData);

      logTestEvent("timer", 5000, timer("end", 4));

      const history = getInputHistory(buildEventLog());
      expect(history[0]).toBe("");
      expect(history[1]).toBe("");
    });
  });

  describe("getAccuracy", () => {
    it("calculates correct/incorrect/percentage", () => {
      logTestEvent("input", 1100, input());
      logTestEvent("input", 1200, input({ charIndex: 1 }));
      logTestEvent("input", 1300, input({ charIndex: 2, correct: false }));

      const acc = getAccuracy(buildEventLog());
      expect(acc.correct).toBe(2);
      expect(acc.incorrect).toBe(1);
      expect(acc.percentage).toBeCloseTo(66.67, 1);
    });

    it("returns 0% for no events", () => {
      const acc = getAccuracy(buildEventLog());
      expect(acc.percentage).toBe(0);
    });

    it("ignores delete events", () => {
      logTestEvent("input", 1100, input());
      logTestEvent("input", 1200, {
        charIndex: 0,
        wordIndex: 0,
        inputType: "deleteContentBackward",
      } as InputEventData);

      const acc = getAccuracy(buildEventLog());
      expect(acc.correct).toBe(1);
      expect(acc.incorrect).toBe(0);
    });

    it("counts inputStopped events in accuracy", () => {
      logTestEvent("input", 1100, input());
      logTestEvent(
        "input",
        1200,
        input({ charIndex: 1, correct: false, inputStopped: true }),
      );

      const acc = getAccuracy(buildEventLog());
      expect(acc.correct).toBe(1);
      expect(acc.incorrect).toBe(1);
      expect(acc.percentage).toBe(50);
    });
  });

  describe("getKeypressSpacing", () => {
    it("returns spacing between consecutive keydowns", () => {
      logTestEvent("keydown", 1000, keyDown());
      logTestEvent("keyup", 1050, keyUp());
      logTestEvent("keydown", 1100, keyDown());
      logTestEvent("keyup", 1150, keyUp());
      logTestEvent("keydown", 1250, keyDown());
      logTestEvent("keyup", 1300, keyUp());

      const spacings = getKeypressSpacing(buildEventLog());
      expect(spacings).toEqual([100, 150]);
    });

    it("returns empty for single keydown", () => {
      logTestEvent("keydown", 1000, keyDown());

      expect(getKeypressSpacing(buildEventLog())).toEqual([]);
    });

    it("clamps a pre-start first keydown so the timing invariant holds", () => {
      // A keydown can be recorded before timer:start (e.g. a stray Ctrl+H
      // pressed seconds before the user starts typing). cleanupData keeps the
      // last pre-start keydown by design, and getStartToFirstKeypressMs clamps
      // its negative offset to 0 — so the first spacing must clamp the same
      // way, else sum(keySpacing) inflates by |firstKeydown| and breaks
      // the testDuration vs key timings check.
      (Config as { mode: string }).mode = "time";
      logTestEvent("keydown", -16240, keyDown());
      logTestEvent("timer", 0, timer("start", 0));
      logTestEvent("input", 0, input());
      logTestEvent("keyup", 100, keyUp());
      logTestEvent("keydown", 500, keyDown("KeyS"));
      logTestEvent("keyup", 580, keyUp("KeyS"));
      logTestEvent("timer", 1000, timer("step", 1));
      logTestEvent("timer", 1000, timer("end", 1));

      const sumSpacing = getKeypressSpacing(buildEventLog()).reduce(
        (a, b) => a + b,
        0,
      );
      const total =
        getStartToFirstKeypressMs(buildEventLog()) +
        sumSpacing +
        getLastKeypressToEndMs(buildEventLog());

      expect(Math.abs(getTestDurationMs(buildEventLog()) - total)).toBeLessThan(
        100,
      );
    });

    it("cleanupData drops post-end keydowns so the timing invariant holds", () => {
      // The compareCompletedEvents check in test-logic.ts relies on:
      //   startToFirstKey + sum(keySpacing) + lastKeyToEnd ≈ testDuration
      // In time mode the user often keeps typing during finish()'s fade
      // animation. Without filtering, post-end keydowns inflate keySpacing
      // while getLastKeypressToEndMs clamps the negative diff to 0, breaking
      // the invariant. finish() calls cleanupData() before the check —
      // that's the centralised filter; this test exercises the same path.
      (Config as { mode: string }).mode = "time";
      logTestEvent("timer", 0, timer("start", 0));
      logTestEvent("keydown", 500, keyDown());
      logTestEvent("keyup", 580, keyUp());
      logTestEvent("keydown", 700, keyDown());
      logTestEvent("keyup", 780, keyUp());
      logTestEvent("timer", 1000, timer("step", 1));
      logTestEvent("timer", 1000, timer("end", 1));
      // user keeps typing through the fade
      logTestEvent("keydown", 1120, keyDown());
      logTestEvent("keyup", 1170, keyUp());

      cleanupData();

      const sumSpacing = getKeypressSpacing(buildEventLog()).reduce(
        (a, b) => a + b,
        0,
      );
      const total =
        getStartToFirstKeypressMs(buildEventLog()) +
        sumSpacing +
        getLastKeypressToEndMs(buildEventLog());

      expect(Math.abs(getTestDurationMs(buildEventLog()) - total)).toBeLessThan(
        100,
      );
    });
  });

  describe("getKeypressOverlap", () => {
    it("measures time when multiple keys are held", () => {
      logTestEvent("keydown", 1000, keyDown("KeyA"));
      logTestEvent("keydown", 1050, keyDown("KeyS"));
      // both held from 1050-1080 = 30ms overlap
      logTestEvent("keyup", 1080, keyUp("KeyA"));
      logTestEvent("keyup", 1100, keyUp("KeyS"));

      expect(getKeypressOverlap(buildEventLog())).toBe(30);
    });

    it("returns 0 with no overlap", () => {
      logTestEvent("keydown", 1000, keyDown("KeyA"));
      logTestEvent("keyup", 1050, keyUp("KeyA"));
      logTestEvent("keydown", 1100, keyDown("KeyS"));
      logTestEvent("keyup", 1150, keyUp("KeyS"));

      expect(getKeypressOverlap(buildEventLog())).toBe(0);
    });
  });

  describe("getKeypressDurations", () => {
    it("measures hold duration for each key", () => {
      logTestEvent("keydown", 1000, keyDown("KeyA"));
      logTestEvent("keyup", 1080, keyUp("KeyA"));
      logTestEvent("keydown", 1100, keyDown("KeyS"));
      logTestEvent("keyup", 1200, keyUp("KeyS"));

      const durations = getKeypressDurations(buildEventLog());
      expect(durations).toEqual([80, 100]);
    });

    it("returns 0 for keys without keyup", () => {
      logTestEvent("keydown", 1000, keyDown());

      const durations = getKeypressDurations(buildEventLog());
      expect(durations).toEqual([0]);
    });
  });

  describe("getKeypressesPerSecond", () => {
    it("counts insertText events per timer interval", () => {
      setupBasicTest();

      const kps = getKeypressesPerSecond(buildEventLog());
      expect(kps).toEqual([3, 2, 1]);
    });

    it("ignores delete events", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("input", 1200, input());
      logTestEvent("input", 1400, {
        charIndex: 1,
        wordIndex: 0,
        inputType: "deleteContentBackward",
      } as InputEventData);
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 2000, timer("end", 1));

      expect(getKeypressesPerSecond(buildEventLog())).toEqual([1]);
    });

    it("returns empty for no timer events", () => {
      logTestEvent("input", 1200, input());
      expect(getKeypressesPerSecond(buildEventLog())).toEqual([]);
    });

    it("counts keypresses in last partial second when gap rounds to 0.5s", () => {
      // mirrors the totalKeypressCountHistory mismatch: legacy pushes for roundTo2 >= 0.5,
      // but the old boundary check (>= 500ms) skips a 496ms tail
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("input", 1200, input()); // first second
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("input", 2200, input({ charIndex: 1 })); // 496ms tail
      logTestEvent("input", 2400, input({ charIndex: 2 }));
      logTestEvent("timer", 2496, timer("end", 1));

      // endMs=1496, 1496%1000=496ms → roundTo2(0.496)=0.5 → end boundary added → [1, 2]
      expect(getKeypressesPerSecond(buildEventLog())).toEqual([1, 2]);
    });
  });

  describe("getTargetWord", () => {
    it("returns simulatedInput in zen mode", () => {
      (Config as { mode: string }).mode = "zen";
      expect(
        statsTesting.getTargetWord(buildEventLog(), 0, "anything", false),
      ).toBe("anything");
    });

    it("returns word without trailing space when it ends with newline", () => {
      pushWords("hello\n");
      expect(
        statsTesting.getTargetWord(buildEventLog(), 0, "hello", false),
      ).toBe("hello\n");
    });

    it("appends trailing space for non-last word", () => {
      pushWords("hello");
      expect(
        statsTesting.getTargetWord(buildEventLog(), 0, "hello", false),
      ).toBe("hello ");
    });

    it("does not append trailing space for last word", () => {
      pushWords("hello");
      expect(
        statsTesting.getTargetWord(buildEventLog(), 0, "hello", true),
      ).toBe("hello");
    });

    it("does not append trailing space when nospace funbox is active", () => {
      pushWords("hello");
      (Config as { funbox: string[] }).funbox = ["nospace"];
      expect(
        statsTesting.getTargetWord(buildEventLog(), 0, "hello", false),
      ).toBe("hello");
    });

    it("does not append trailing space when underscore_spaces funbox is active", () => {
      pushWords("hello");
      (Config as { funbox: string[] }).funbox = ["underscore_spaces"];
      expect(
        statsTesting.getTargetWord(buildEventLog(), 0, "hello", false),
      ).toBe("hello");
    });
  });

  describe("getChars", () => {
    it("counts all correct for a perfectly typed word", () => {
      pushWords("hello");
      (TestState as { activeWordIndex: number }).activeWordIndex = 0;

      logTestEvent("timer", 1000, timer("start", 0));
      for (let i = 0; i < 5; i++) {
        logTestEvent(
          "input",
          1100 + i * 50,
          input({ charIndex: i, wordIndex: 0, data: "hello"[i] as string }),
        );
      }

      const chars = getChars(buildEventLog());
      expect(chars.allCorrect).toBe(5);
      expect(chars.correctWord).toBe(5);
      expect(chars.incorrect).toBe(0);
      expect(chars.extra).toBe(0);
      expect(chars.missed).toBe(0);
    });

    it("counts incorrect chars", () => {
      pushWords("ab");
      (TestState as { activeWordIndex: number }).activeWordIndex = 0;

      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "a" }),
      );
      logTestEvent(
        "input",
        1150,
        input({ charIndex: 1, wordIndex: 0, data: "x", correct: false }),
      );

      const chars = getChars(buildEventLog());
      expect(chars.allCorrect).toBe(1);
      expect(chars.incorrect).toBe(1);
    });

    it("counts extra chars", () => {
      pushWords("ab");
      (TestState as { activeWordIndex: number }).activeWordIndex = 0;

      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "a" }),
      );
      logTestEvent(
        "input",
        1150,
        input({ charIndex: 1, wordIndex: 0, data: "b" }),
      );
      logTestEvent(
        "input",
        1200,
        input({ charIndex: 2, wordIndex: 0, data: "c" }),
      );

      const chars = getChars(buildEventLog());
      expect(chars.extra).toBe(1);
    });

    it("counts missed chars for completed non-last words", () => {
      pushWords("hello", "world");
      (TestState as { activeWordIndex: number }).activeWordIndex = 1;

      logTestEvent("timer", 1000, timer("start", 0));
      // type "hel" then space (incomplete first word)
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "h" }),
      );
      logTestEvent(
        "input",
        1150,
        input({ charIndex: 1, wordIndex: 0, data: "e" }),
      );
      logTestEvent(
        "input",
        1200,
        input({ charIndex: 2, wordIndex: 0, data: "l" }),
      );
      logTestEvent(
        "input",
        1250,
        input({
          charIndex: 3,
          wordIndex: 0,
          data: " ",
          commitsWord: true,
        }),
      );
      // type "w" on second word
      logTestEvent(
        "input",
        1300,
        input({ charIndex: 0, wordIndex: 1, data: "w" }),
      );

      const chars = getChars(buildEventLog());
      // word 0: "hel " vs "hello " → 3 correct, 1 incorrect, 2 missed
      // word 1: "w" vs "world" → 1 correct, 4 missed (words mode counts partial last word missed)
      expect(chars.missed).toBe(6);
    });

    it("credits a word committed with an IME full-width space", () => {
      // Japanese IME commits words with the ideographic space U+3000, while the
      // target word separator is a regular space — normalize so it still counts
      pushWords("しり", "かこ");
      (TestState as { activeWordIndex: number }).activeWordIndex = 1;

      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "し" }),
      );
      logTestEvent(
        "input",
        1150,
        input({ charIndex: 1, wordIndex: 0, data: "り" }),
      );
      logTestEvent(
        "input",
        1200,
        input({
          charIndex: 2,
          wordIndex: 0,
          data: "　",
          commitsWord: true,
        }),
      );
      logTestEvent(
        "input",
        1300,
        input({ charIndex: 0, wordIndex: 1, data: "か" }),
      );

      const chars = getChars(buildEventLog());
      // word 0 "しり " is fully correct (2 chars + separator)
      expect(chars.correctWord).toBe(3);
      expect(chars.incorrect).toBe(0);
      expect(chars.extra).toBe(0);
    });
  });

  describe("getWpmHistory", () => {
    it("returns wpm at each timer boundary", () => {
      pushWords("hello");
      (TestState as { activeWordIndex: number }).activeWordIndex = 0;

      logTestEvent("timer", 1000, timer("start", 0));
      // type "hello" in first second — 5 correct word chars
      for (let i = 0; i < 5; i++) {
        logTestEvent(
          "input",
          1100 + i * 50,
          input({ charIndex: i, wordIndex: 0, data: "hello"[i] as string }),
        );
      }
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 2000, timer("end", 1));

      const wpm = getWpmHistory(buildEventLog());
      // 5 correct chars in 1s = (5/5)*60 = 60 WPM
      expect(wpm).toEqual([60]);
    });

    it("returns cumulative wpm across boundaries", () => {
      pushWords("ab", "cd");
      (TestState as { activeWordIndex: number }).activeWordIndex = 1;

      logTestEvent("timer", 1000, timer("start", 0));
      // type "ab " in first second — correct word
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "a" }),
      );
      logTestEvent(
        "input",
        1200,
        input({ charIndex: 1, wordIndex: 0, data: "b" }),
      );
      logTestEvent(
        "input",
        1300,
        input({ charIndex: 2, wordIndex: 0, data: " " }),
      );
      logTestEvent("timer", 2000, timer("step", 1));
      // type "cd" in second second
      logTestEvent(
        "input",
        2100,
        input({ charIndex: 0, wordIndex: 1, data: "c" }),
      );
      logTestEvent(
        "input",
        2200,
        input({ charIndex: 1, wordIndex: 1, data: "d" }),
      );
      logTestEvent("timer", 3000, timer("step", 2));
      logTestEvent("timer", 3000, timer("end", 2));

      const wpm = getWpmHistory(buildEventLog());
      expect(wpm.length).toBe(2);
      // at 1s: "ab " fully correct = 3 correctWord chars → (3/5)*60 = 36
      expect(wpm[0]).toBe(36);
      // at 2s: 3 + 2 ("cd") = 5 correctWord chars → (5/5)*60/2 = 30
      expect(wpm[1]).toBe(30);
    });

    it("counts non-last word as correct without trailing space when nospace funbox is active", () => {
      (Config as { funbox: string[] }).funbox = ["nospace"];
      pushWords("ab", "cd");
      (TestState as { activeWordIndex: number }).activeWordIndex = 1;

      logTestEvent("timer", 1000, timer("start", 0));
      // type "ab" then "cd" with no space between (nospace mode)
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "a" }),
      );
      logTestEvent(
        "input",
        1200,
        input({ charIndex: 1, wordIndex: 0, data: "b" }),
      );
      logTestEvent(
        "input",
        1300,
        input({ charIndex: 0, wordIndex: 1, data: "c" }),
      );
      logTestEvent(
        "input",
        1400,
        input({ charIndex: 1, wordIndex: 1, data: "d" }),
      );
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 2000, timer("end", 1));

      const wpm = getWpmHistory(buildEventLog());
      // both words fully correct → 4 correctWord chars in 1s = (4/5)*60 = 48
      expect(wpm).toEqual([48]);
    });

    it("counts multiline word as correct when target ends in newline", () => {
      pushWords("hello\n", "world");
      (TestState as { activeWordIndex: number }).activeWordIndex = 1;

      logTestEvent("timer", 1000, timer("start", 0));
      // type "hello\n"
      const word1 = "hello\n";
      for (let i = 0; i < word1.length; i++) {
        logTestEvent(
          "input",
          1100 + i * 50,
          input({ charIndex: i, wordIndex: 0, data: word1[i] as string }),
        );
      }
      // type "world"
      const word2 = "world";
      for (let i = 0; i < word2.length; i++) {
        logTestEvent(
          "input",
          1500 + i * 50,
          input({ charIndex: i, wordIndex: 1, data: word2[i] as string }),
        );
      }
      logTestEvent("timer", 2000, timer("step", 1));
      logTestEvent("timer", 2000, timer("end", 1));

      const wpm = getWpmHistory(buildEventLog());
      // word 0: "hello\n" target matches input "hello\n" → 6 correctWord
      // word 1: "world" (last word) matches → 5 correctWord
      // 11 chars in 1s = (11/5)*60 = 132
      expect(wpm).toEqual([132]);
    });
  });

  describe("inferActiveWordIndex", () => {
    it("returns 0 when no word has input", () => {
      const eventsPerWord = new Map();
      expect(statsTesting.inferActiveWordIndex(eventsPerWord)).toBe(0);
    });

    it("returns 0 when entries exist but none have input", () => {
      // word events present but all input data is empty / inputValue=""
      logTestEvent(
        "input",
        1000,
        input({ wordIndex: 0, data: "", inputValue: "" }),
      );
      const eventsPerWord = getEventsPerWord(getAllTestEvents());
      expect(statsTesting.inferActiveWordIndex(eventsPerWord)).toBe(0);
    });

    it("returns max wordIndex when last word has no committed space", () => {
      // word 0: "hi"
      logTestEvent("input", 1000, input({ wordIndex: 0, data: "h" }));
      logTestEvent(
        "input",
        1050,
        input({ wordIndex: 0, charIndex: 1, data: "i" }),
      );
      // space commit on word 0
      logTestEvent(
        "input",
        1100,
        input({
          wordIndex: 0,
          charIndex: 2,
          data: " ",
          commitsWord: true,
          inputValue: "hi ",
        }),
      );
      // word 1: "yo" (no trailing space)
      logTestEvent("input", 1200, input({ wordIndex: 1, data: "y" }));
      logTestEvent(
        "input",
        1250,
        input({ wordIndex: 1, charIndex: 1, data: "o" }),
      );

      const eventsPerWord = getEventsPerWord(getAllTestEvents());
      expect(statsTesting.inferActiveWordIndex(eventsPerWord)).toBe(1);
    });

    it("advances past last word when trailing space was committed", () => {
      // word 0: "hi "
      logTestEvent("input", 1000, input({ wordIndex: 0, data: "h" }));
      logTestEvent(
        "input",
        1050,
        input({ wordIndex: 0, charIndex: 1, data: "i" }),
      );
      logTestEvent(
        "input",
        1100,
        input({
          wordIndex: 0,
          charIndex: 2,
          data: " ",
          commitsWord: true,
          inputValue: "hi ",
        }),
      );

      const eventsPerWord = getEventsPerWord(getAllTestEvents());
      expect(statsTesting.inferActiveWordIndex(eventsPerWord)).toBe(1);
    });

    it("does not advance when last event is a non-space insert", () => {
      logTestEvent("input", 1000, input({ wordIndex: 0, data: "h" }));
      logTestEvent(
        "input",
        1050,
        input({ wordIndex: 0, charIndex: 1, data: "i" }),
      );

      const eventsPerWord = getEventsPerWord(getAllTestEvents());
      expect(statsTesting.inferActiveWordIndex(eventsPerWord)).toBe(0);
    });

    it("does not advance when last event is a backspace", () => {
      logTestEvent("input", 1000, input({ wordIndex: 0, data: "h" }));
      logTestEvent(
        "input",
        1050,
        input({ wordIndex: 0, charIndex: 1, data: "i" }),
      );
      logTestEvent(
        "input",
        1100,
        input({
          wordIndex: 0,
          charIndex: 1,
          inputType: "deleteContentBackward",
          data: "",
          inputValue: "h",
        }),
      );

      const eventsPerWord = getEventsPerWord(getAllTestEvents());
      expect(statsTesting.inferActiveWordIndex(eventsPerWord)).toBe(0);
    });

    it("picks max wordIndex across non-contiguous buckets (post-regression order)", () => {
      // simulates a backspace that crosses back into word 0 AFTER word 1 events.
      // Map insertion order is still 0, 1 (word 0 was set first), so the loop
      // must compute true max by key, not by iteration position.
      logTestEvent("input", 1000, input({ wordIndex: 0, data: "h" }));
      logTestEvent(
        "input",
        1050,
        input({
          wordIndex: 0,
          charIndex: 1,
          data: " ",
          commitsWord: true,
          inputValue: "h ",
        }),
      );
      logTestEvent("input", 1100, input({ wordIndex: 1, data: "y" }));
      // backspace lands a destination event back into word 0
      logTestEvent(
        "input",
        1200,
        input({
          wordIndex: 0,
          charIndex: 1,
          inputType: "deleteContentBackward",
          data: "",
          inputValue: "h",
        }),
      );

      const eventsPerWord = getEventsPerWord(getAllTestEvents());
      // word 1 has input "y" (no trailing space) → max is 1, no advance
      expect(statsTesting.inferActiveWordIndex(eventsPerWord)).toBe(1);
    });
  });

  describe("getCorrectedWords", () => {
    it("returns input as-is when no corrections made", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "t" }),
      );
      logTestEvent(
        "input",
        1150,
        input({ charIndex: 1, wordIndex: 0, data: "e" }),
      );
      logTestEvent(
        "input",
        1200,
        input({ charIndex: 2, wordIndex: 0, data: "s" }),
      );
      logTestEvent(
        "input",
        1250,
        input({ charIndex: 3, wordIndex: 0, data: "t" }),
      );

      expect(getCorrectedWordsHistory(buildEventLog())).toEqual(["test"]);
    });

    it("returns last deleted char per position (xact -> fact)", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      // type "xact"
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "x" }),
      );
      logTestEvent(
        "input",
        1150,
        input({ charIndex: 1, wordIndex: 0, data: "a" }),
      );
      logTestEvent(
        "input",
        1200,
        input({ charIndex: 2, wordIndex: 0, data: "c" }),
      );
      logTestEvent(
        "input",
        1250,
        input({ charIndex: 3, wordIndex: 0, data: "t" }),
      );
      // delete all
      logTestEvent("input", 1300, {
        charIndex: 3,
        wordIndex: 0,
        inputType: "deleteContentBackward",
      } as InputEventData);
      logTestEvent("input", 1350, {
        charIndex: 2,
        wordIndex: 0,
        inputType: "deleteContentBackward",
      } as InputEventData);
      logTestEvent("input", 1400, {
        charIndex: 1,
        wordIndex: 0,
        inputType: "deleteContentBackward",
      } as InputEventData);
      logTestEvent("input", 1450, {
        charIndex: 0,
        wordIndex: 0,
        inputType: "deleteContentBackward",
      } as InputEventData);
      // type "fact"
      logTestEvent(
        "input",
        1500,
        input({ charIndex: 0, wordIndex: 0, data: "f" }),
      );
      logTestEvent(
        "input",
        1550,
        input({ charIndex: 1, wordIndex: 0, data: "a" }),
      );
      logTestEvent(
        "input",
        1600,
        input({ charIndex: 2, wordIndex: 0, data: "c" }),
      );
      logTestEvent(
        "input",
        1650,
        input({ charIndex: 3, wordIndex: 0, data: "t" }),
      );

      expect(getCorrectedWordsHistory(buildEventLog())).toEqual(["xact"]);
    });

    it("returns last deleted char per position across multiple corrections (xest -> west -> test)", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      // type "xest"
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "x" }),
      );
      logTestEvent(
        "input",
        1150,
        input({ charIndex: 1, wordIndex: 0, data: "e" }),
      );
      logTestEvent(
        "input",
        1200,
        input({ charIndex: 2, wordIndex: 0, data: "s" }),
      );
      logTestEvent(
        "input",
        1250,
        input({ charIndex: 3, wordIndex: 0, data: "t" }),
      );
      // delete all
      logTestEvent("input", 1300, {
        charIndex: 3,
        wordIndex: 0,
        inputType: "deleteWordBackward",
      } as InputEventData);
      // type "west"
      logTestEvent(
        "input",
        1400,
        input({ charIndex: 0, wordIndex: 0, data: "w" }),
      );
      logTestEvent(
        "input",
        1450,
        input({ charIndex: 1, wordIndex: 0, data: "e" }),
      );
      logTestEvent(
        "input",
        1500,
        input({ charIndex: 2, wordIndex: 0, data: "s" }),
      );
      logTestEvent(
        "input",
        1550,
        input({ charIndex: 3, wordIndex: 0, data: "t" }),
      );
      // delete all
      logTestEvent("input", 1600, {
        charIndex: 3,
        wordIndex: 0,
        inputType: "deleteWordBackward",
      } as InputEventData);
      // type "test"
      logTestEvent(
        "input",
        1700,
        input({ charIndex: 0, wordIndex: 0, data: "t" }),
      );
      logTestEvent(
        "input",
        1750,
        input({ charIndex: 1, wordIndex: 0, data: "e" }),
      );
      logTestEvent(
        "input",
        1800,
        input({ charIndex: 2, wordIndex: 0, data: "s" }),
      );
      logTestEvent(
        "input",
        1850,
        input({ charIndex: 3, wordIndex: 0, data: "t" }),
      );

      expect(getCorrectedWordsHistory(buildEventLog())).toEqual(["west"]);
    });

    it("handles partial correction (tset -> delete last 2 -> st)", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      // type "tset"
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "t" }),
      );
      logTestEvent(
        "input",
        1150,
        input({ charIndex: 1, wordIndex: 0, data: "s" }),
      );
      logTestEvent(
        "input",
        1200,
        input({ charIndex: 2, wordIndex: 0, data: "e" }),
      );
      logTestEvent(
        "input",
        1250,
        input({ charIndex: 3, wordIndex: 0, data: "t" }),
      );
      // delete last 2
      logTestEvent("input", 1300, {
        charIndex: 3,
        wordIndex: 0,
        inputType: "deleteContentBackward",
      } as InputEventData);
      logTestEvent("input", 1350, {
        charIndex: 2,
        wordIndex: 0,
        inputType: "deleteContentBackward",
      } as InputEventData);
      // type "st"
      logTestEvent(
        "input",
        1400,
        input({ charIndex: 2, wordIndex: 0, data: "s" }),
      );
      logTestEvent(
        "input",
        1450,
        input({ charIndex: 3, wordIndex: 0, data: "t" }),
      );

      // pos 0: "t" never deleted, pos 1: "s" never deleted, pos 2: "e" deleted, pos 3: "t" deleted
      expect(getCorrectedWordsHistory(buildEventLog())).toEqual(["tset"]);
    });

    it("handles multiple words", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      // word 0: type "ab" correctly
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "a" }),
      );
      logTestEvent(
        "input",
        1150,
        input({ charIndex: 1, wordIndex: 0, data: "b" }),
      );
      // word 1: type "xy", delete both, type "zw"
      logTestEvent(
        "input",
        1200,
        input({ charIndex: 0, wordIndex: 1, data: "x" }),
      );
      logTestEvent(
        "input",
        1250,
        input({ charIndex: 1, wordIndex: 1, data: "y" }),
      );
      logTestEvent("input", 1300, {
        charIndex: 1,
        wordIndex: 1,
        inputType: "deleteContentBackward",
      } as InputEventData);
      logTestEvent("input", 1350, {
        charIndex: 1,
        wordIndex: 1,
        inputType: "deleteContentBackward",
      } as InputEventData);
      logTestEvent(
        "input",
        1400,
        input({ charIndex: 0, wordIndex: 1, data: "z" }),
      );
      logTestEvent(
        "input",
        1450,
        input({ charIndex: 1, wordIndex: 1, data: "w" }),
      );

      const result = getCorrectedWordsHistory(buildEventLog());
      expect(result[0]).toEqual("ab");
      expect(result[1]).toEqual("xy");
    });

    it("ignores the space that commits a word", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent(
        "input",
        1100,
        input({ charIndex: 0, wordIndex: 0, data: "t" }),
      );
      logTestEvent(
        "input",
        1150,
        input({ charIndex: 1, wordIndex: 0, data: "e" }),
      );
      logTestEvent(
        "input",
        1200,
        input({ charIndex: 2, wordIndex: 0, data: "s" }),
      );
      logTestEvent(
        "input",
        1250,
        input({ charIndex: 3, wordIndex: 0, data: "t" }),
      );
      // committing space — must not appear in the corrected word
      logTestEvent(
        "input",
        1300,
        input({
          charIndex: 4,
          wordIndex: 0,
          data: " ",
          commitsWord: true,
        }),
      );

      expect(getCorrectedWordsHistory(buildEventLog())).toEqual(["test"]);
    });
  });
});
