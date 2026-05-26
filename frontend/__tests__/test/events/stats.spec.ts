import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../src/ts/test/test-stats", () => ({
  start: 1000,
}));

vi.mock("../../../src/ts/test/test-state", () => ({
  activeWordIndex: 0,
  bailedOut: false,
}));

vi.mock("../../../src/ts/config/store", () => ({
  Config: { mode: "words", funbox: "" },
}));

import {
  logTestEvent,
  resetTestEvents,
  __testing,
} from "../../../src/ts/test/events/data";
import {
  getStartToFirstKeypressMs,
  getLastKeypressToEndMs,
  getRawPerSecond,
  getTestDurationMs,
  getAccuracy,
  getKeypressSpacing,
  getKeypressOverlap,
  getErrorCountHistory,
  getAfkDuration,
  getKeypressDurations,
} from "../../../src/ts/test/events/stats";
import type {
  InputEventData,
  KeydownEventData,
  KeyupEventData,
  TimerEventData,
} from "../../../src/ts/test/events/types";
import { Config } from "../../../src/ts/config/store";
import { Keycode } from "../../../src/ts/constants/keys";

function keyDown(code: Keycode = "KeyA"): KeydownEventData {
  return { code, ctrl: false, shift: false, alt: false, meta: false };
}

function keyUp(code: Keycode = "KeyA"): KeyupEventData {
  return {
    code,
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    repeat: false,
  };
}

function input(
  overrides: Partial<{
    charIndex: number;
    wordIndex: number;
    data: string;
    correct: boolean;
    inputType: string;
  }> = {},
): InputEventData {
  return {
    charIndex: 0,
    wordIndex: 0,
    inputType: "insertText",
    data: "a",
    correct: true,
    ...overrides,
  } as InputEventData;
}

function timer(
  event: "start" | "step" | "end",
  timerVal: number,
): TimerEventData {
  if (event === "step") {
    return { event, timer: timerVal, drift: 0 };
  }
  return { event, timer: timerVal };
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
  });

  describe("getStartToFirstKeypressMs", () => {
    it("returns time from start to first keydown", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1150, keyDown());

      expect(getStartToFirstKeypressMs()).toBe(150);
    });

    it("returns 0 if keydown comes before start", () => {
      logTestEvent("keydown", 900, keyDown());
      logTestEvent("timer", 1000, timer("start", 0));

      expect(getStartToFirstKeypressMs()).toBe(0);
    });

    it("returns 0 in zen mode", () => {
      (Config as { mode: string }).mode = "zen";
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1150, keyDown());

      expect(getStartToFirstKeypressMs()).toBe(0);
    });

    it("throws if no events", () => {
      expect(() => getStartToFirstKeypressMs()).toThrow();
    });
  });

  describe("getLastKeypressToEndMs", () => {
    it("returns time from last keydown to end", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1500, keyDown());
      logTestEvent("keyup", 1600, keyUp());
      logTestEvent("keydown", 1800, keyDown());
      logTestEvent("timer", 2000, timer("end", 1));

      expect(getLastKeypressToEndMs()).toBe(200);
    });

    it("returns 0 in zen mode", () => {
      (Config as { mode: string }).mode = "zen";
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1500, keyDown());
      logTestEvent("timer", 2000, timer("end", 1));

      expect(getLastKeypressToEndMs()).toBe(0);
    });
  });

  describe("getTestDurationMs", () => {
    it("returns end testMs", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      logTestEvent("keydown", 1500, keyDown());
      logTestEvent("timer", 4000, timer("end", 3));

      expect(getTestDurationMs()).toBe(3000);
    });

    it("throws if no end event", () => {
      logTestEvent("timer", 1000, timer("start", 0));
      expect(() => getTestDurationMs()).toThrow();
    });
  });

  describe("getRawPerSecond", () => {
    it("converts keypresses to WPM using real interval duration", () => {
      setupBasicTest();

      const raw = getRawPerSecond();
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

      const raw = getRawPerSecond();
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

      const errors = getErrorCountHistory();
      expect(errors).toEqual([1, 2]);
    });

    it("returns zeros when all correct", () => {
      setupBasicTest();
      const errors = getErrorCountHistory();
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

      expect(getAfkDuration()).toBe(1);
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

      expect(getAfkDuration()).toBe(0);
    });
  });

  describe("getAccuracy", () => {
    it("calculates correct/incorrect/percentage", () => {
      logTestEvent("input", 1100, input());
      logTestEvent("input", 1200, input({ charIndex: 1 }));
      logTestEvent("input", 1300, input({ charIndex: 2, correct: false }));

      const acc = getAccuracy();
      expect(acc.correct).toBe(2);
      expect(acc.incorrect).toBe(1);
      expect(acc.percentage).toBeCloseTo(66.67, 1);
    });

    it("returns 0% for no events", () => {
      const acc = getAccuracy();
      expect(acc.percentage).toBe(0);
    });

    it("ignores delete events", () => {
      logTestEvent("input", 1100, input());
      logTestEvent("input", 1200, {
        charIndex: 0,
        wordIndex: 0,
        inputType: "deleteContentBackward",
      } as InputEventData);

      const acc = getAccuracy();
      expect(acc.correct).toBe(1);
      expect(acc.incorrect).toBe(0);
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

      const spacings = getKeypressSpacing();
      expect(spacings).toEqual([100, 150]);
    });

    it("returns empty for single keydown", () => {
      logTestEvent("keydown", 1000, keyDown());

      expect(getKeypressSpacing()).toEqual([]);
    });
  });

  describe("getKeypressOverlap", () => {
    it("measures time when multiple keys are held", () => {
      logTestEvent("keydown", 1000, keyDown("KeyA"));
      logTestEvent("keydown", 1050, keyDown("KeyS"));
      // both held from 1050-1080 = 30ms overlap
      logTestEvent("keyup", 1080, keyUp("KeyA"));
      logTestEvent("keyup", 1100, keyUp("KeyS"));

      expect(getKeypressOverlap()).toBe(30);
    });

    it("returns 0 with no overlap", () => {
      logTestEvent("keydown", 1000, keyDown("KeyA"));
      logTestEvent("keyup", 1050, keyUp("KeyA"));
      logTestEvent("keydown", 1100, keyDown("KeyS"));
      logTestEvent("keyup", 1150, keyUp("KeyS"));

      expect(getKeypressOverlap()).toBe(0);
    });
  });

  describe("getKeypressDurations", () => {
    it("measures hold duration for each key", () => {
      logTestEvent("keydown", 1000, keyDown("KeyA"));
      logTestEvent("keyup", 1080, keyUp("KeyA"));
      logTestEvent("keydown", 1100, keyDown("KeyS"));
      logTestEvent("keyup", 1200, keyUp("KeyS"));

      const durations = getKeypressDurations();
      expect(durations).toEqual([80, 100]);
    });

    it("returns 0 for keys without keyup", () => {
      logTestEvent("keydown", 1000, keyDown());

      const durations = getKeypressDurations();
      expect(durations).toEqual([0]);
    });
  });
});
