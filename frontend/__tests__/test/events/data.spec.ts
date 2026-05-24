import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../src/ts/test/test-stats", () => ({
  start: 1000,
}));

import {
  logTestEvent,
  getAllTestEvents,
  getInputEvents,
  getInputEventsPerWord,
  resetTestEvents,
  __testing,
} from "../../../src/ts/test/events/data";
import type {
  InputEventData,
  KeydownEventData,
  KeyupEventData,
  TimerEventData,
} from "../../../src/ts/test/events/types";
import { Keycode } from "../../../src/ts/constants/keys";

function keyDown(code: Keycode | "NoCode" = "KeyA"): KeydownEventData {
  return { code, ctrl: false, shift: false, alt: false, meta: false };
}

function keyUp(code: Keycode | "NoCode" = "KeyA"): KeyupEventData {
  return {
    code,
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    repeat: false,
  };
}

function inputData(
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

function timerData(
  event: "start" | "step" | "end",
  timer: number,
): TimerEventData {
  if (event === "step") {
    return { event, timer, drift: 0 };
  }
  return { event, timer };
}

describe("data.ts", () => {
  beforeEach(() => {
    resetTestEvents();
    __testing.resetPressedKeys();
  });

  describe("logTestEvent + getAllTestEvents", () => {
    it("returns empty array when no events logged", () => {
      expect(getAllTestEvents()).toEqual([]);
    });

    it("logs and retrieves events sorted by ms", () => {
      logTestEvent("input", 1050, inputData());
      logTestEvent("keydown", 1030, keyDown());
      logTestEvent("timer", 1020, timerData("start", 0));

      const events = getAllTestEvents();
      expect(events).toHaveLength(3);
      expect(events[0]!.type).toBe("timer");
      expect(events[1]!.type).toBe("keydown");
      expect(events[2]!.type).toBe("input");
    });

    it("computes testMs relative to start", () => {
      logTestEvent("timer", 1500, timerData("start", 0));
      const events = getAllTestEvents();
      expect(events[0]!.testMs).toBe(500); // 1500 - 1000
    });

    it("caches getAllTestEvents and invalidates on new event", () => {
      logTestEvent("timer", 1100, timerData("start", 0));
      const first = getAllTestEvents();
      const second = getAllTestEvents();
      expect(first).toBe(second); // same reference = cached

      logTestEvent("timer", 2100, timerData("end", 1));
      const third = getAllTestEvents();
      expect(third).not.toBe(first); // new reference = invalidated
    });
  });

  describe("logTestEvent keydown filtering", () => {
    it("ignores keys not in keysToTrack", () => {
      logTestEvent("keydown", 1010, keyDown("Backspace"));
      expect(getAllTestEvents()).toHaveLength(0);
    });

    it("ignores duplicate keydown without keyup", () => {
      logTestEvent("keydown", 1010, keyDown());
      logTestEvent("keydown", 1020, keyDown());
      expect(getAllTestEvents()).toHaveLength(1);
    });

    it("allows keydown after keyup", () => {
      logTestEvent("keydown", 1010, keyDown());
      logTestEvent("keyup", 1020, keyUp());
      logTestEvent("keydown", 1030, keyDown());
      expect(getAllTestEvents()).toHaveLength(3);
    });
  });

  describe("logTestEvent keyup filtering", () => {
    it("ignores keyup for untracked keys", () => {
      logTestEvent("keyup", 1010, keyUp("Backspace"));
      expect(getAllTestEvents()).toHaveLength(0);
    });

    it("ignores keyup without prior keydown", () => {
      logTestEvent("keyup", 1010, keyUp());
      expect(getAllTestEvents()).toHaveLength(0);
    });
  });

  describe("NoCode handling", () => {
    it("tracks multiple simultaneous NoCode keydowns", () => {
      logTestEvent("keydown", 1010, keyDown("NoCode"));
      logTestEvent("keydown", 1020, keyDown("NoCode"));

      const events = getAllTestEvents();
      expect(events).toHaveLength(2);
    });

    // NoCode keyups are silently dropped because pressedKeys stores
    // "NoCode0"/"NoCode1" but the keyup check looks for "NoCode"
    it("drops NoCode keyups due to key name mismatch", () => {
      logTestEvent("keydown", 1010, keyDown("NoCode"));
      logTestEvent("keyup", 1020, keyUp("NoCode"));

      const events = getAllTestEvents();
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe("keydown");
    });
  });

  describe("getInputEvents", () => {
    it("returns only input events", () => {
      logTestEvent("keydown", 1010, keyDown());
      logTestEvent("input", 1020, inputData());
      logTestEvent("timer", 1030, timerData("start", 0));
      logTestEvent("input", 1040, inputData({ charIndex: 1 }));

      const inputs = getInputEvents();
      expect(inputs).toHaveLength(2);
      expect(inputs.every((e) => e.type === "input")).toBe(true);
    });
  });

  describe("getInputEventsPerWord", () => {
    it("groups input events by wordIndex", () => {
      logTestEvent("input", 1010, inputData({ wordIndex: 0, charIndex: 0 }));
      logTestEvent("input", 1020, inputData({ wordIndex: 0, charIndex: 1 }));
      logTestEvent("input", 1030, inputData({ wordIndex: 1, charIndex: 0 }));

      const perWord = getInputEventsPerWord();
      expect(perWord.get(0)).toHaveLength(2);
      expect(perWord.get(1)).toHaveLength(1);
    });

    it("attributes deleteContentBackward at charIndex 0 to previous word", () => {
      logTestEvent("input", 1010, inputData({ wordIndex: 0, charIndex: 0 }));
      logTestEvent("input", 1020, {
        charIndex: 0,
        wordIndex: 1,
        inputType: "deleteContentBackward",
      } as InputEventData);

      const perWord = getInputEventsPerWord();
      expect(perWord.get(0)).toHaveLength(2);
      expect(perWord.has(1)).toBe(false);
    });

    it("attributes deleteWordBackward at charIndex 0 to previous word", () => {
      logTestEvent("input", 1010, inputData({ wordIndex: 0, charIndex: 0 }));
      logTestEvent("input", 1020, {
        charIndex: 0,
        wordIndex: 1,
        inputType: "deleteWordBackward",
      } as InputEventData);

      const perWord = getInputEventsPerWord();
      expect(perWord.get(0)).toHaveLength(2);
      expect(perWord.has(1)).toBe(false);
    });

    it("does not shift delete at charIndex 0 if wordIndex is 0", () => {
      logTestEvent("input", 1010, {
        charIndex: 0,
        wordIndex: 0,
        inputType: "deleteContentBackward",
      } as InputEventData);

      const perWord = getInputEventsPerWord();
      expect(perWord.get(0)).toHaveLength(1);
    });

    it("respects testMsLimit", () => {
      logTestEvent("input", 1010, inputData({ wordIndex: 0, charIndex: 0 }));
      logTestEvent("input", 1100, inputData({ wordIndex: 0, charIndex: 1 }));

      const perWord = getInputEventsPerWord(undefined, 50);
      expect(perWord.get(0)).toHaveLength(1);
    });

    it("respects startMs", () => {
      logTestEvent("input", 1010, inputData({ wordIndex: 0, charIndex: 0 }));
      logTestEvent("input", 1100, inputData({ wordIndex: 0, charIndex: 1 }));

      const perWord = getInputEventsPerWord(50);
      expect(perWord.get(0)).toHaveLength(1);
      expect(perWord.get(0)![0]!.data.charIndex).toBe(1);
    });
  });

  describe("resetTestEvents", () => {
    it("clears all events", () => {
      logTestEvent("keydown", 1010, keyDown());
      logTestEvent("input", 1020, inputData());
      logTestEvent("timer", 1030, timerData("start", 0));

      resetTestEvents();
      expect(getAllTestEvents()).toEqual([]);
    });
  });
});
