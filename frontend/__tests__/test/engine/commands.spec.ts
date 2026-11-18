import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as Engine from "../../../src/ts/test/engine/commands";
import {
  bailOut,
  clearLiveStats,
  getActiveWordIndex,
  getBailedOut,
  getFailReason,
  getFrozenLog,
  getPhase,
  liveStats,
  nextWord,
  previousWord,
  publishFrozenLog,
  resetActiveWordIndex,
  setLastBurst,
  setPhase,
} from "../../../src/ts/test/engine/state";
import { logTestEvent } from "../../../src/ts/test/engine/events/data";

function frame(): void {
  vi.advanceTimersToNextFrame();
}

describe("engine", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"],
    });
    setPhase("idle");
    Engine.reset();
    clearLiveStats();
    resetActiveWordIndex();
    frame();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("phase", () => {
    it("start makes the test active", () => {
      Engine.start();
      expect(getPhase()).toBe("active");
    });

    it("finish freezes the log and switches to finished", () => {
      Engine.start();
      const log = Engine.finish();
      expect(getPhase()).toBe("finished");
      expect(getFailReason()).toBeNull();
      expect(log.events).toEqual([]);
    });

    it("fail finishes with a reason, cleared by reset", () => {
      Engine.start();
      Engine.finish("min accuracy");
      expect(getPhase()).toBe("finished");
      expect(getFailReason()).toBe("min accuracy");
      Engine.reset();
      expect(getFailReason()).toBeNull();
    });

    it("reset ends an active test, but keeps a finished one", () => {
      Engine.start();
      Engine.reset();
      expect(getPhase()).toBe("idle");

      Engine.start();
      Engine.finish();
      Engine.reset();
      expect(getPhase()).toBe("finished");
    });

    it("restart lasts until endRestart", () => {
      Engine.start();
      Engine.finish();
      Engine.restart();
      expect(getPhase()).toBe("restarting");
      Engine.endRestart();
      expect(getPhase()).toBe("idle");
    });
  });

  describe("frozen log", () => {
    it("is published separately from finish", () => {
      publishFrozenLog();
      Engine.start();
      const log = Engine.finish();
      expect(getFrozenLog()).not.toBe(log);

      publishFrozenLog();
      expect(getFrozenLog()).toBe(log);
    });

    it("force-releases held keys", () => {
      Engine.start();
      logTestEvent("keydown", 100, { code: "KeyA" });
      const log = Engine.finish();
      expect(log.events.map((e) => e.type)).toEqual(["keydown", "keyup"]);
    });
  });

  describe("word navigation", () => {
    it("moves the active word index", () => {
      nextWord();
      nextWord();
      previousWord();
      expect(getActiveWordIndex()).toBe(1);
      resetActiveWordIndex();
      expect(getActiveWordIndex()).toBe(0);
    });
  });

  describe("bail out", () => {
    it("is cleared by reset", () => {
      bailOut();
      expect(getBailedOut()).toBe(true);
      Engine.reset();
      expect(getBailedOut()).toBe(false);
    });
  });

  describe("live stats", () => {
    it("are cleared until a test starts", () => {
      expect(liveStats.acc).toBeUndefined();
      expect(liveStats.burst).toBeUndefined();
      expect(liveStats.wpm).toBeUndefined();
    });

    it("update acc and burst on the next frame, not synchronously", () => {
      Engine.start();
      // timer stats are written at once
      expect(liveStats.wpm).toBe(0);
      expect(liveStats.acc).toBeUndefined();
      frame();
      expect(liveStats.acc).toBe(100);
      expect(liveStats.burst).toBe(0);

      setLastBurst(42.4);
      expect(liveStats.burst).toBe(0);
      frame();
      expect(liveStats.burst).toBe(42);
    });

    it("clearLiveStats empties them on the next frame", () => {
      Engine.start();
      frame();
      clearLiveStats();
      expect(liveStats.wpm).toBeUndefined();
      frame();
      expect(liveStats.acc).toBeUndefined();
      expect(liveStats.burst).toBeUndefined();
    });
  });
});
