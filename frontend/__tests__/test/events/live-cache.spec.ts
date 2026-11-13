import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../src/ts/config/store", () => ({
  Config: { mode: "words", funbox: [] as string[], words: 25, time: 0 },
  getConfig: {},
}));

vi.mock("../../../src/ts/test/test-words", () => ({
  words: { get: () => [] },
}));

vi.mock("../../../src/ts/states/test", () => ({
  getCurrentQuote: () => null,
  getActiveWordIndex: () => 0,
  isResultCalculating: () => false,
  getBailedOut: () => false,
  getKoreanStatus: () => false,
}));

import {
  logTestEvent,
  resetTestEvents,
  cleanupData,
  buildEventLog,
} from "../../../src/ts/test/events/data";
import {
  getLiveCachedAccuracy,
  getLiveCachedMsSinceLastInputEvent,
} from "../../../src/ts/test/events/live-cache";
import {
  getAccuracy,
  getMsSinceLastInputEvent,
} from "../../../src/ts/test/events/stats";

type Step =
  | { type: "input"; ms: number; correct?: boolean }
  | { type: "delete"; ms: number }
  | { type: "timer"; ms: number; event: "start" | "end" };

function logStep(step: Step): void {
  if (step.type === "timer") {
    logTestEvent("timer", step.ms, {
      event: step.event,
      timer: 0,
      date: 0,
    });
  } else if (step.type === "delete") {
    logTestEvent("input", step.ms, {
      charIndex: 0,
      wordIndex: 0,
      inputType: "deleteContentBackward",
      inputValue: "",
    });
  } else {
    logTestEvent("input", step.ms, {
      charIndex: 0,
      wordIndex: 0,
      inputType: "insertText",
      data: "a",
      correct: step.correct ?? true,
      inputValue: "a",
    });
  }
}

const sequences: { name: string; steps: Step[]; cleanup?: true }[] = [
  { name: "empty", steps: [] },
  {
    name: "timer only",
    steps: [
      { type: "timer", ms: 1000, event: "start" },
      { type: "timer", ms: 2000, event: "end" },
    ],
  },
  {
    name: "single input",
    steps: [
      { type: "timer", ms: 1000, event: "start" },
      { type: "input", ms: 1000 },
    ],
  },
  {
    name: "all correct",
    steps: [
      { type: "timer", ms: 1000, event: "start" },
      { type: "input", ms: 1000 },
      { type: "input", ms: 1123.45 },
      { type: "input", ms: 1300.1 },
    ],
  },
  {
    name: "mixed",
    steps: [
      { type: "timer", ms: 1000, event: "start" },
      { type: "input", ms: 1000 },
      { type: "input", ms: 1150.33, correct: false },
      { type: "input", ms: 1290.07 },
      { type: "input", ms: 1400.5, correct: false },
    ],
  },
  {
    name: "deletes",
    steps: [
      { type: "timer", ms: 1000, event: "start" },
      { type: "input", ms: 1000, correct: false },
      { type: "delete", ms: 1210.25 },
      { type: "input", ms: 1333.33 },
      { type: "delete", ms: 1500 },
    ],
  },
  {
    name: "only deletes",
    steps: [
      { type: "delete", ms: 1000 },
      { type: "delete", ms: 1100.5 },
    ],
  },
  {
    name: "inputs after the timer end, cleaned up",
    cleanup: true,
    steps: [
      { type: "timer", ms: 1000, event: "start" },
      { type: "input", ms: 1000 },
      { type: "input", ms: 1250.75, correct: false },
      { type: "timer", ms: 2000, event: "end" },
      { type: "input", ms: 2100 },
      { type: "input", ms: 2200.2, correct: false },
    ],
  },
];

describe("live-cache parity with the pure stat functions", () => {
  beforeEach(() => {
    resetTestEvents();
  });

  describe.each(sequences)("$name", ({ steps, cleanup }) => {
    beforeEach(() => {
      for (const step of steps) logStep(step);
      if (cleanup) cleanupData();
    });

    it("accuracy", () => {
      expect(getLiveCachedAccuracy()).toBe(
        getAccuracy(buildEventLog()).percentage,
      );
    });

    it("ms since last input event", () => {
      expect(getLiveCachedMsSinceLastInputEvent()).toBe(
        getMsSinceLastInputEvent(buildEventLog()),
      );
    });
  });
});
