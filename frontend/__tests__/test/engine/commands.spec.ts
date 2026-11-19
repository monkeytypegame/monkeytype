import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomTextSettings } from "@monkeytype/schemas/results";

import * as Engine from "../../../src/ts/test/engine/commands";
import {
  clearLiveStats,
  getActiveWordIndex,
  getFrozenLog,
  getRestartSource,
  getRestartStage,
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

const customText: CustomTextSettings = {
  text: [],
  mode: "repeat",
  limit: { mode: "word", value: 0 },
  pipeDelimiter: false,
};

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
    afterEach(() => {
      if (getTestPhase() === "restarting") Engine.endRestart();
    });

    it("goes through its stages until endRestart", () => {
      Engine.start();
      Engine.finish();
      expect(Engine.requestRestart("resultPage", {})).toBe("started");
      expect(getTestPhase()).toBe("restarting");
      expect(getRestartSource()).toBe("resultPage");
      expect(getRestartStage()).toBe("fadingOut");
      Engine.restartFadedOut();
      expect(getRestartStage()).toBe("preparing");
      Engine.takeRestartRequests(customText);
      Engine.restartPrepared();
      expect(getRestartStage()).toBe("fadingIn");
      expect(Engine.endRestart()).toBeNull();
      expect(getTestPhase()).toBe("idle");
      expect(getRestartStage()).toBeUndefined();
    });

    it("merges requests until the settings are taken", () => {
      Engine.requestRestart("testPage", {
        noAnim: true,
        withSameWordset: true,
      });
      expect(Engine.requestRestart("resultPage", { noAnim: false })).toBe(
        "merged",
      );
      Engine.restartFadedOut();
      expect(Engine.requestRestart("testPage", {})).toBe("merged");
      // the first request's source; the latest noAnim; withSameWordset sticks
      expect(getRestartSource()).toBe("testPage");
      expect(Engine.takeRestartRequests(customText)).toEqual({
        withSameWordset: true,
        practiseMissed: false,
        noAnim: false,
      });
    });

    it("queues one more restart for requests after the settings are taken", () => {
      Engine.requestRestart("testPage", {});
      Engine.restartFadedOut();
      Engine.takeRestartRequests(customText);
      expect(Engine.requestRestart("testPage", { practiseMissed: true })).toBe(
        "queued",
      );
      expect(Engine.requestRestart("testPage", { noAnim: true })).toBe(
        "queued",
      );
      Engine.restartPrepared();
      expect(Engine.endRestart()).toEqual({
        withSameWordset: false,
        practiseMissed: true,
        noAnim: true,
      });
      expect(Engine.endRestart()).toBeNull();
    });

    it("a retry takes the queued requests back in", () => {
      Engine.requestRestart("testPage", {});
      Engine.restartFadedOut();
      Engine.takeRestartRequests(customText);
      Engine.requestRestart("testPage", { withSameWordset: true });
      Engine.reopenRestartRequests();
      expect(Engine.requestRestart("testPage", {})).toBe("merged");
      expect(Engine.takeRestartRequests(customText).withSameWordset).toBe(true);
      expect(Engine.endRestart()).toBeNull();
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
