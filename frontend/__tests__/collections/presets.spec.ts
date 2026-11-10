import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEffect, createRoot } from "solid-js";

vi.mock("../../src/ts/ape", () => ({
  default: {
    presets: {
      get: vi.fn(async () => ({
        status: 200,
        body: {
          data: [
            { _id: "p2", name: "zebra", config: {} },
            { _id: "p1", name: "my_preset", config: {} },
          ],
        },
      })),
      delete: vi.fn(async () => ({ status: 200, body: {} })),
    },
  },
}));

import {
  arePresetsLoaded,
  deletePreset,
  getPreset,
  getPresets,
  waitForPresetsReady,
} from "../../src/ts/collections/presets";
import { setUserId } from "../../src/ts/states/core";

const names = (presets: { name: string }[]): string[] =>
  presets.map((it) => it.name);

describe("presets collection", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    setUserId(null);
  });

  it("is empty while signed out", () => {
    expect(getPresets()).toEqual([]);
  });

  it("returns the loaded presets sorted by name", async () => {
    setUserId("uid");
    await waitForPresetsReady();
    expect(names(getPresets())).toEqual(["my preset", "zebra"]);
    expect(getPreset("p2")?.name).toEqual("zebra");
  });

  /**
   * The commandline reads presets outside a tracking scope. Loaded only by
   * `waitForPresetsReady` in the login flow, the collection must not be
   * garbage collected (TanStack DB's default collection gcTime is 5 min).
   */
  it("keeps its data over time", async () => {
    setUserId("uid");
    await waitForPresetsReady();

    await vi.advanceTimersByTimeAsync(10 * 60_000);

    expect(names(getPresets())).toEqual(["my preset", "zebra"]);
  });

  it("reads a delete synchronously and re-runs effects", async () => {
    setUserId("uid");
    await waitForPresetsReady();
    const seen: string[][] = [];
    const dispose = createRoot((dispose) => {
      createEffect(() => seen.push(names(getPresets())));
      return dispose;
    });

    const deleted = deletePreset({ presetId: "p2" });

    expect(getPreset("p2")).toBeUndefined();
    expect(seen.at(-1)).toEqual(["my preset"]);
    await deleted;
    dispose();
  });

  it("empties on sign out", async () => {
    setUserId("uid");
    await waitForPresetsReady();
    setUserId(null);
    expect(getPresets()).toEqual([]);
  });

  it("reports loaded only once signed in and ready", async () => {
    expect(arePresetsLoaded()).toBe(false);
    setUserId("uid");
    await waitForPresetsReady();
    expect(arePresetsLoaded()).toBe(true);
    setUserId(null);
    expect(arePresetsLoaded()).toBe(false);
  });
});
