import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { timer } = vi.hoisted(() => ({
  timer: { complete: (): void => undefined },
}));
vi.mock("animejs", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  createTimer: (options: { onComplete: () => void }) => {
    timer.complete = options.onComplete;
    return { duration: 0, play: vi.fn(), restart: vi.fn(), reset: vi.fn() };
  },
}));

import { liveStats } from "../../../src/ts/test/engine/state";
import * as TestTimer from "../../../src/ts/test/engine/test-timer";

const START = 1000;

function tickAt(elapsedMs: number): void {
  vi.spyOn(performance, "now").mockReturnValue(START + elapsedMs);
  timer.complete();
}

describe("test-timer", () => {
  beforeEach(async () => {
    await TestTimer.start(START, { onFinish: vi.fn(), onFail: vi.fn() });
  });

  afterEach(() => {
    TestTimer.clear();
    vi.restoreAllMocks();
  });

  it("counts a tick that lands a float error short of the second", () => {
    tickAt(1000);
    expect(liveStats.seconds).toBe(1);

    tickAt(2000 - 1e-6);
    expect(liveStats.seconds).toBe(2);
  });

  it("skips to the current second after missed ticks", () => {
    tickAt(3010);
    expect(liveStats.seconds).toBe(3);
  });
});
