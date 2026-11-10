import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, createEffect } from "solid-js";

vi.mock("../../src/ts/ape/user", () => ({
  fetchUserFromApi: vi.fn(async () => ({
    tags: [
      { _id: "t2", name: "zebra", personalBests: {} },
      { _id: "t1", name: "my_tag", personalBests: {} },
    ],
  })),
}));

import {
  areTagsLoaded,
  getActiveTags,
  getTag,
  getTags,
  toggleTagActive,
  waitForTagsReady,
} from "../../src/ts/collections/tags";
import { fetchUserFromApi } from "../../src/ts/ape/user";
import { setUserId } from "../../src/ts/states/core";

const names = (tags: { name: string }[]): string[] => tags.map((it) => it.name);

describe("tags collection", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    setUserId(null);
  });

  it("is empty while signed out", () => {
    expect(getTags()).toEqual([]);
  });

  it("returns the loaded tags sorted by name", async () => {
    setUserId("uid");
    await waitForTagsReady();
    expect(names(getTags())).toEqual(["my tag", "zebra"]);
    expect(getTag("t2")?.name).toEqual("zebra");
  });

  /**
   * The commandline and result saving read tags outside a tracking scope.
   * Loaded only by `waitForTagsReady` in the login flow, the collection must
   * not be garbage collected (TanStack DB's default collection gcTime is 5 min).
   */
  it("keeps its data over time", async () => {
    setUserId("uid");
    await waitForTagsReady();

    await vi.advanceTimersByTimeAsync(10 * 60_000);

    expect(names(getTags())).toEqual(["my tag", "zebra"]);
  });

  it("reads a toggle synchronously and re-runs effects", async () => {
    setUserId("uid");
    await waitForTagsReady();
    const seen: string[][] = [];
    const dispose = createRoot((dispose) => {
      createEffect(() => seen.push(names(getActiveTags())));
      return dispose;
    });

    void toggleTagActive({ tagId: "t1", noSave: true });

    expect(getTag("t1")?.active).toBe(true);
    expect(seen.at(-1)).toEqual(["my tag"]);
    dispose();
    void toggleTagActive({ tagId: "t1", noSave: true });
  });

  it("empties on sign out", async () => {
    setUserId("uid");
    await waitForTagsReady();
    setUserId(null);
    expect(getTags()).toEqual([]);
  });

  it("reports loaded only once signed in and ready", async () => {
    expect(areTagsLoaded()).toBe(false);
    setUserId("uid");
    await waitForTagsReady();
    expect(areTagsLoaded()).toBe(true);
    setUserId(null);
    expect(areTagsLoaded()).toBe(false);
  });

  it("re-runs a single-tag reader only for its own tag", async () => {
    setUserId("uid");
    await waitForTagsReady();
    let runs = 0;
    const dispose = createRoot((dispose) => {
      createEffect(() => {
        getTag("t2");
        runs++;
      });
      return dispose;
    });

    void toggleTagActive({ tagId: "t1", noSave: true });
    void toggleTagActive({ tagId: "t1", noSave: true });
    expect(runs).toBe(1);

    void toggleTagActive({ tagId: "t2", noSave: true });
    expect(runs).toBe(2);
    dispose();
    void toggleTagActive({ tagId: "t2", noSave: true });
  });

  it("drops the previous user's tags on sign out", async () => {
    setUserId("uid");
    await waitForTagsReady();
    setUserId(null);

    let release = (): void => undefined;
    vi.mocked(fetchUserFromApi).mockImplementationOnce(
      async () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              tags: [{ _id: "t3", name: "other", personalBests: {} }],
            } as never);
        }),
    );
    setUserId("uid2");
    await vi.advanceTimersByTimeAsync(0);

    expect(getTags()).toEqual([]);
    expect(areTagsLoaded()).toBe(false);

    release();
    await waitForTagsReady();
    expect(names(getTags())).toEqual(["other"]);
    expect(areTagsLoaded()).toBe(true);
  });

  it("doesn't hang sign in when the download fails", async () => {
    // the first try and the query's 3 retries
    for (let i = 0; i < 4; i++) {
      vi.mocked(fetchUserFromApi).mockRejectedValueOnce(new Error("offline"));
    }
    setUserId("uid3");

    const ready = waitForTagsReady();
    // the retries back off 1s, 2s, 4s
    await vi.advanceTimersByTimeAsync(10_000);
    await ready;

    expect(areTagsLoaded()).toBe(false);
    expect(getTags()).toEqual([]);
  });
});
