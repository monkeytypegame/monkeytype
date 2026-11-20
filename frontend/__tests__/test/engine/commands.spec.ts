import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as Engine from "../../../src/ts/test/engine/commands";

const { activeTags } = vi.hoisted(() => ({
  activeTags: { ids: [] as string[] },
}));
vi.mock("../../../src/ts/queries/tags", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getActiveTags: () => activeTags.ids.map((_id) => ({ _id })),
}));
import {
  clearLiveStats,
  getActiveWordIndex,
  getFrozenLog,
  getRestartOptions,
  getTestId,
  __testing as stateTesting,
  getTestEnd,
  getResultData,
  getSaveStatus,
  isResultPending,
  liveStats,
  incrementActiveWordIndex,
  decrementActiveWordIndex,
  resetActiveWordIndex,
  setLastBurst,
  setTestPhase,
} from "../../../src/ts/test/engine/state";
import { logTestEvent } from "../../../src/ts/test/engine/events/data";

function frame(): void {
  vi.advanceTimersToNextFrame();
}

/** The frame after finish(), and the task after its paint. */
function paint(): void {
  frame();
  // a fake setTimeout(0) runs a millisecond later
  vi.advanceTimersByTime(1);
}

describe("engine", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        "requestAnimationFrame",
        "cancelAnimationFrame",
        "performance",
        "setTimeout",
        "clearTimeout",
      ],
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
      expect(stateTesting.getTestPhase()).toBe("active");
    });

    it("finish is synchronous: finished, how it ended, the result pending", () => {
      Engine.start();
      Engine.finish({ type: "failed", reason: "min accuracy" });
      expect(stateTesting.getTestPhase()).toBe("finished");
      expect(getTestEnd()).toEqual({ type: "failed", reason: "min accuracy" });
      expect(getResultData()).toBeNull();
      expect(isResultPending()).toBe(true);
      Engine.reset();
      expect(getTestEnd()).toBeNull();
    });

    it("reset ends an active test, but keeps a finished one", () => {
      Engine.start();
      Engine.reset();
      expect(stateTesting.getTestPhase()).toBe("idle");

      Engine.start();
      Engine.finish({ type: "completed" });
      Engine.reset();
      expect(stateTesting.getTestPhase()).toBe("finished");
    });
  });

  describe("result", () => {
    it("is built after a paint, with the frozen log", () => {
      Engine.start();
      Engine.finish({ type: "completed" });
      frame();
      expect(getResultData()).toBeNull();
      vi.advanceTimersByTime(1);

      expect(isResultPending()).toBe(false);
      expect(getResultData()?.end).toEqual({ type: "completed" });
      expect(getFrozenLog()).not.toBeNull();
    });

    it("reads the tags active when it's built", () => {
      activeTags.ids = ["a"];
      Engine.start();
      Engine.finish({ type: "completed" });
      activeTags.ids = ["b"];
      paint();
      activeTags.ids = [];

      expect(getResultData()?.completedEvent.tags).toEqual(["b"]);
    });

    it("is kept after a restart", () => {
      Engine.start();
      Engine.finish({ type: "completed" });
      paint();
      const result = getResultData();
      Engine.reset();
      Engine.commitRestart(Engine.requestRestart({}));
      expect(getResultData()).toBe(result);
    });
  });

  describe("frozen log", () => {
    it("force-releases held keys", () => {
      Engine.start();
      logTestEvent("keydown", performance.now(), { code: "KeyA" });
      // finish logs the timer's end after it
      vi.advanceTimersByTime(100);
      Engine.finish({ type: "completed" });
      paint();
      expect(
        getFrozenLog()
          ?.events.filter((e) => e.type === "keydown" || e.type === "keyup")
          .map((e) => e.type),
      ).toEqual(["keydown", "keyup"]);
    });

    it("drops events logged after finish", () => {
      Engine.start();
      Engine.finish({ type: "completed" });
      logTestEvent("keydown", 100, { code: "KeyA" });
      paint();
      expect(getFrozenLog()?.events.some((e) => e.type === "keydown")).toBe(
        false,
      );
    });
  });

  describe("save", () => {
    it("tracks the save: saving, then saved", async () => {
      let done: (outcome: Engine.SaveOutcome) => void = () => undefined;
      Engine.save(
        async () =>
          new Promise((resolve) => {
            done = resolve;
          }),
      );
      expect(getSaveStatus()).toEqual({ state: "saving" });
      done({ saved: true });
      await vi.waitFor(() =>
        expect(getSaveStatus()).toEqual({ state: "saved" }),
      );
    });

    it("retries a failed save that can be retried", async () => {
      const run = vi.fn(
        async (_isRetrying: boolean): Promise<Engine.SaveOutcome> => ({
          saved: false,
          canRetry: true,
        }),
      );
      Engine.save(run);
      await vi.waitFor(() =>
        expect(getSaveStatus()).toEqual({ state: "failed", canRetry: true }),
      );

      expect(Engine.retrySave()).toBe(true);
      expect(run).toHaveBeenLastCalledWith(true);
    });

    it("doesn't retry a save the server refused for good", async () => {
      Engine.save(async () => ({ saved: false, canRetry: false }));
      await vi.waitFor(() =>
        expect(getSaveStatus()).toEqual({ state: "failed", canRetry: false }),
      );
      expect(Engine.retrySave()).toBe(false);
    });

    it("a restart clears it", async () => {
      Engine.save(async () => ({ saved: false, canRetry: true }));
      Engine.reset();
      expect(getSaveStatus()).toEqual({ state: "idle" });
      await Promise.resolve();
      await Promise.resolve();
      expect(getSaveStatus()).toEqual({ state: "idle" });
      expect(Engine.retrySave()).toBe(false);
    });
  });

  describe("restart", () => {
    it("is restarting until the current generation commits", () => {
      Engine.start();
      Engine.finish({ type: "completed" });
      const id = getTestId();
      const token = Engine.requestRestart({ noAnim: true });
      expect(stateTesting.getTestPhase()).toBe("restarting");
      expect(Engine.isCurrentRestart(token)).toBe(true);
      expect(Engine.commitRestart(token)).toBe(true);
      expect(stateTesting.getTestPhase()).toBe("idle");
      expect(getTestId()).toBe(id + 1);
      expect(Engine.isCurrentRestart(token)).toBe(false);
    });

    it("a newer request supersedes the generation, keeping the options", () => {
      const first = Engine.requestRestart({ withSameWordset: true });
      const second = Engine.requestRestart({});
      expect(Engine.isCurrentRestart(first)).toBe(false);
      expect(Engine.commitRestart(first)).toBe(false);
      expect(stateTesting.getTestPhase()).toBe("restarting");
      expect(getRestartOptions().withSameWordset).toBe(true);
      expect(Engine.commitRestart(second)).toBe(true);
      expect(stateTesting.getTestPhase()).toBe("idle");
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
