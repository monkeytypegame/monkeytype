import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as Engine from "../../../src/ts/test/engine/commands";
import {
  clearLiveStats,
  getActiveWordIndex,
  getFrozenLog,
  getRestartOptions,
  getTestId,
  getTestPhase,
  getTestEnd,
  liveStats,
  incrementActiveWordIndex,
  decrementActiveWordIndex,
  publishFrozenLog,
  resetActiveWordIndex,
  setLastBurst,
  setTestPhase,
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
    setTestPhase("idle");
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
      expect(getTestPhase()).toBe("active");
    });

    it("finish freezes the log and switches to finished", () => {
      Engine.start();
      const log = Engine.finish();
      expect(getTestPhase()).toBe("finished");
      expect(log.events).toEqual([]);
    });

    it("records how the test ended, cleared by reset", () => {
      Engine.start();
      Engine.recordEnd({ type: "failed", reason: "min accuracy" });
      Engine.finish();
      expect(getTestPhase()).toBe("finished");
      expect(getTestEnd()).toEqual({ type: "failed", reason: "min accuracy" });
      Engine.reset();
      expect(getTestEnd()).toBeNull();
    });

    it("reset ends an active test, but keeps a finished one", () => {
      Engine.start();
      Engine.reset();
      expect(getTestPhase()).toBe("idle");

      Engine.start();
      Engine.finish();
      Engine.reset();
      expect(getTestPhase()).toBe("finished");
    });
  });

  describe("restart", () => {
    it("is restarting until the current generation commits", () => {
      Engine.start();
      Engine.finish();
      const id = getTestId();
      const token = Engine.requestRestart({ noAnim: true });
      expect(getTestPhase()).toBe("restarting");
      expect(Engine.isCurrentRestart(token)).toBe(true);
      expect(Engine.commitRestart(token)).toBe(true);
      expect(getTestPhase()).toBe("idle");
      expect(getTestId()).toBe(id + 1);
      expect(Engine.isCurrentRestart(token)).toBe(false);
    });

    it("a newer request supersedes the generation, keeping the options", () => {
      const first = Engine.requestRestart({ withSameWordset: true });
      const second = Engine.requestRestart({});
      expect(Engine.isCurrentRestart(first)).toBe(false);
      expect(Engine.commitRestart(first)).toBe(false);
      expect(getTestPhase()).toBe("restarting");
      expect(getRestartOptions().withSameWordset).toBe(true);
      expect(Engine.commitRestart(second)).toBe(true);
      expect(getTestPhase()).toBe("idle");
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
      incrementActiveWordIndex();
      incrementActiveWordIndex();
      decrementActiveWordIndex();
      expect(getActiveWordIndex()).toBe(1);
      resetActiveWordIndex();
      expect(getActiveWordIndex()).toBe(0);
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
