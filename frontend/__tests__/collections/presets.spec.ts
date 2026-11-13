import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ts/ape", () => ({
  default: {
    presets: {
      get: vi.fn(async () => ({
        status: 200,
        body: { data: [{ _id: "p1", name: "my_preset", config: {} }] },
      })),
    },
  },
}));

import {
  __nonReactive,
  waitForPresetsReady,
} from "../../src/ts/collections/presets";
import { setUserId } from "../../src/ts/states/core";

/**
 * The commandline reads presets through `__nonReactive`, which doesn't
 * subscribe. Loaded only by `waitForPresetsReady` in the login flow, the
 * collection has no subscriber outside the settings page, so it must not be
 * garbage collected (TanStack DB's default collection gcTime is 5 min).
 */
describe("presets collection", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps its data with no subscriber", async () => {
    setUserId("uid");
    await waitForPresetsReady();
    expect(__nonReactive.getPresets().map((it) => it.name)).toEqual([
      "my preset",
    ]);

    await vi.advanceTimersByTimeAsync(10 * 60_000);

    expect(__nonReactive.getPresets().map((it) => it.name)).toEqual([
      "my preset",
    ]);
  });
});
