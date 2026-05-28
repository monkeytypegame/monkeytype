import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../src/ts/test/test-stats", () => ({
  start: 1000,
}));

import {
  logTestEvent,
  getAllTestEvents,
  getInputEvents,
  getInputEventsPerWord,
  cleanupData,
  resetTestEvents,
  __testing,
} from "../../../src/ts/test/events/data";
import type {
  InputEventData,
  KeydownEvent,
  KeydownEventData,
  KeyupEvent,
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

    it("input events with the same ms as timer end are kept", () => {
      logTestEvent("timer", 1000, timerData("start", 0));
      logTestEvent("timer", 2000, timerData("end", 1));
      logTestEvent("input", 2000, inputData());

      cleanupData();
      const events = getAllTestEvents();
      const inputs = events.filter((e) => e.type === "input");
      expect(inputs).toHaveLength(1);
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

    it("tracks NoCode keyup after keydown", () => {
      logTestEvent("keydown", 1010, keyDown("NoCode"));
      logTestEvent("keyup", 1020, keyUp("NoCode"));

      const events = getAllTestEvents();
      expect(events).toHaveLength(2);
      expect(events[0]!.type).toBe("keydown");
      expect(events[1]!.type).toBe("keyup");
    });

    it("stores indexed code on keydown events", () => {
      logTestEvent("keydown", 1010, keyDown("NoCode"));
      logTestEvent("keydown", 1020, keyDown("NoCode"));

      const events = getAllTestEvents() as KeydownEvent[];
      expect(events[0]!.data.code).toBe("NoCode0");
      expect(events[1]!.data.code).toBe("NoCode1");
    });

    it("stores matching indexed code on keyup events", () => {
      logTestEvent("keydown", 1010, keyDown("NoCode"));
      logTestEvent("keydown", 1020, keyDown("NoCode"));
      logTestEvent("keyup", 1030, keyUp("NoCode"));
      logTestEvent("keyup", 1040, keyUp("NoCode"));

      const events = getAllTestEvents();
      // keyups are LIFO — second keydown (NoCode1) is released first
      expect((events[2] as KeyupEvent).data.code).toBe("NoCode1");
      expect((events[3] as KeyupEvent).data.code).toBe("NoCode0");
    });

    it("ignores NoCode keyup when no matching keydown exists", () => {
      logTestEvent("keyup", 1010, keyUp("NoCode"));

      expect(getAllTestEvents()).toHaveLength(0);
    });

    it("stray NoCode keyup does not corrupt noCodeIndex", () => {
      // stray keyup with no matching keydown
      logTestEvent("keyup", 1010, keyUp("NoCode"));

      // subsequent keydown/keyup should still work correctly
      logTestEvent("keydown", 1020, keyDown("NoCode"));
      logTestEvent("keyup", 1030, keyUp("NoCode"));

      const events = getAllTestEvents();
      expect(events).toHaveLength(2);
      expect((events[0] as KeydownEvent).data.code).toBe("NoCode0");
      expect((events[1] as KeyupEvent).data.code).toBe("NoCode0");
    });

    it("accepts already-indexed NoCode keyup", () => {
      logTestEvent("keydown", 1010, keyDown("NoCode"));
      logTestEvent("keydown", 1020, keyDown("NoCode"));

      // simulate forceReleaseAllKeys passing indexed codes directly
      logTestEvent("keyup", 1030, {
        code: "NoCode0",
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
      } as KeyupEventData);
      logTestEvent("keyup", 1040, {
        code: "NoCode1",
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
      } as KeyupEventData);

      const events = getAllTestEvents();
      expect(events).toHaveLength(4);
      const keyups = events.filter((e) => e.type === "keyup");
      expect(keyups).toHaveLength(2);
      expect((keyups[0] as KeyupEvent).data.code).toBe("NoCode0");
      expect((keyups[1] as KeyupEvent).data.code).toBe("NoCode1");
    });

    it("rejects indexed NoCode keyup with no matching keydown", () => {
      logTestEvent("keyup", 1010, {
        code: "NoCode0",
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
      } as KeyupEventData);

      expect(getAllTestEvents()).toHaveLength(0);
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

  describe("cleanupData", () => {
    describe("pre-start filtering", () => {
      it("removes all pre-start keydowns except the last", () => {
        logTestEvent("keydown", 900, keyDown("KeyA"));
        logTestEvent("keyup", 910, keyUp("KeyA"));
        logTestEvent("keydown", 950, keyDown("KeyS"));
        logTestEvent("timer", 1000, timerData("start", 0));
        logTestEvent("keyup", 1100, keyUp("KeyS"));

        cleanupData();
        const events = getAllTestEvents();
        const keydowns = events.filter((e) => e.type === "keydown");
        expect(keydowns).toHaveLength(1);
        expect((keydowns[0] as KeydownEvent).data.code).toBe("KeyS");
      });

      it("removes all pre-start keyups", () => {
        logTestEvent("keydown", 900, keyDown("KeyA"));
        logTestEvent("keyup", 910, keyUp("KeyA"));
        logTestEvent("timer", 1000, timerData("start", 0));

        cleanupData();
        const events = getAllTestEvents();
        const keyups = events.filter((e) => e.type === "keyup");
        expect(keyups).toHaveLength(0);
      });

      it("keeps pre-start non-key events (timer, input)", () => {
        logTestEvent("input", 900, inputData());
        logTestEvent("keydown", 950, keyDown("KeyA"));
        logTestEvent("timer", 1000, timerData("start", 0));

        cleanupData();
        const events = getAllTestEvents();
        expect(events.filter((e) => e.type === "input")).toHaveLength(1);
      });

      it("does nothing when no timer start exists", () => {
        logTestEvent("keydown", 1000, keyDown("KeyA"));
        logTestEvent("keyup", 1050, keyUp("KeyA"));
        logTestEvent("keydown", 1100, keyDown("KeyS"));
        logTestEvent("keyup", 1150, keyUp("KeyS"));

        cleanupData();
        expect(getAllTestEvents()).toHaveLength(4);
      });

      it("removes all pre-start keydowns when there are none", () => {
        logTestEvent("timer", 1000, timerData("start", 0));
        logTestEvent("keydown", 1100, keyDown("KeyA"));

        cleanupData();
        const events = getAllTestEvents();
        expect(events.filter((e) => e.type === "keydown")).toHaveLength(1);
      });
    });

    describe("post-end filtering", () => {
      it("removes input events after timer end", () => {
        logTestEvent("timer", 1000, timerData("start", 0));
        logTestEvent("input", 1100, inputData());
        logTestEvent("timer", 2000, timerData("end", 1));
        logTestEvent("input", 2100, inputData({ charIndex: 1 }));

        cleanupData();
        const events = getAllTestEvents();
        const inputs = events.filter((e) => e.type === "input");
        expect(inputs).toHaveLength(1);
      });

      it("removes keydowns after timer end", () => {
        logTestEvent("timer", 1000, timerData("start", 0));
        logTestEvent("keydown", 1100, keyDown("KeyA"));
        logTestEvent("keyup", 1200, keyUp("KeyA"));
        logTestEvent("timer", 2000, timerData("end", 1));
        logTestEvent("keydown", 2100, keyDown("KeyS"));
        logTestEvent("keyup", 2200, keyUp("KeyS"));

        cleanupData();
        const events = getAllTestEvents();
        const keydowns = events.filter((e) => e.type === "keydown");
        expect(keydowns).toHaveLength(1);
        expect((keydowns[0] as KeydownEvent).data.code).toBe("KeyA");
      });

      it("removes keyups associated with post-end keydowns", () => {
        logTestEvent("timer", 1000, timerData("start", 0));
        logTestEvent("timer", 2000, timerData("end", 1));
        logTestEvent("keydown", 2100, keyDown("KeyA"));
        logTestEvent("keyup", 2200, keyUp("KeyA"));

        cleanupData();
        const events = getAllTestEvents();
        expect(events.filter((e) => e.type === "keyup")).toHaveLength(0);
      });

      it("keeps keyups for keydowns that started before timer end", () => {
        logTestEvent("timer", 1000, timerData("start", 0));
        logTestEvent("keydown", 1900, keyDown("KeyA"));
        logTestEvent("timer", 2000, timerData("end", 1));
        logTestEvent("keyup", 2100, keyUp("KeyA"));

        cleanupData();
        const events = getAllTestEvents();
        const keyups = events.filter((e) => e.type === "keyup");
        expect(keyups).toHaveLength(1);
        expect((keyups[0] as KeyupEvent).data.code).toBe("KeyA");
      });

      it("keeps timer end event itself", () => {
        logTestEvent("timer", 1000, timerData("start", 0));
        logTestEvent("timer", 2000, timerData("end", 1));

        cleanupData();
        const events = getAllTestEvents();
        expect(events).toHaveLength(2);
      });

      it("does nothing when no timer end exists", () => {
        logTestEvent("timer", 1000, timerData("start", 0));
        logTestEvent("keydown", 1100, keyDown("KeyA"));
        logTestEvent("input", 1200, inputData());

        cleanupData();
        expect(getAllTestEvents()).toHaveLength(3);
      });
    });

    describe("source array sync", () => {
      it("cleanup persists after cache invalidation", () => {
        logTestEvent("keydown", 900, keyDown("KeyA"));
        logTestEvent("keyup", 910, keyUp("KeyA"));
        logTestEvent("keydown", 950, keyDown("KeyS"));
        logTestEvent("timer", 1000, timerData("start", 0));
        logTestEvent("keyup", 1100, keyUp("KeyS"));
        logTestEvent("timer", 2000, timerData("end", 1));
        logTestEvent("input", 2100, inputData({ charIndex: 1 }));
        logTestEvent("keydown", 2200, keyDown("KeyD"));
        logTestEvent("keyup", 2300, keyUp("KeyD"));

        cleanupData();

        // simulate cache invalidation + rebuild by logging a new event
        logTestEvent("timer", 2500, timerData("step", 2));
        const events = getAllTestEvents();

        // pre-start KeyA keydown/keyup should still be gone
        const keydowns = events.filter((e) => e.type === "keydown");
        expect(keydowns).toHaveLength(1);
        expect((keydowns[0] as KeydownEvent).data.code).toBe("KeyS");

        // post-end input and KeyD keydown/keyup should still be gone
        const inputs = events.filter((e) => e.type === "input");
        expect(inputs).toHaveLength(0);
        expect(
          events.filter(
            (e) =>
              e.type === "keydown" &&
              (e.data as KeydownEventData).code === "KeyD",
          ),
        ).toHaveLength(0);
      });
    });

    describe("combined pre-start and post-end", () => {
      it("filters both pre-start and post-end events", () => {
        logTestEvent("keydown", 900, keyDown("KeyA"));
        logTestEvent("keyup", 910, keyUp("KeyA"));
        logTestEvent("keydown", 950, keyDown("KeyS"));
        logTestEvent("timer", 1000, timerData("start", 0));
        logTestEvent("input", 1100, inputData());
        logTestEvent("keyup", 1200, keyUp("KeyS"));
        logTestEvent("timer", 2000, timerData("end", 1));
        logTestEvent("input", 2100, inputData({ charIndex: 1 }));
        logTestEvent("keydown", 2200, keyDown("KeyD"));
        logTestEvent("keyup", 2300, keyUp("KeyD"));

        cleanupData();
        const events = getAllTestEvents();

        // pre-start: only last keydown (KeyS) kept, keyup removed
        // post-end: input, keydown (KeyD), keyup (KeyD) removed
        const keydowns = events.filter((e) => e.type === "keydown");
        expect(keydowns).toHaveLength(1);
        expect((keydowns[0] as KeydownEvent).data.code).toBe("KeyS");

        const inputs = events.filter((e) => e.type === "input");
        expect(inputs).toHaveLength(1);

        const keyups = events.filter((e) => e.type === "keyup");
        expect(keyups).toHaveLength(1);
        expect((keyups[0] as KeyupEvent).data.code).toBe("KeyS");
      });
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
