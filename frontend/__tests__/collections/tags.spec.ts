import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ts/ape/user", () => ({
  fetchUserFromApi: vi.fn(async () => ({
    tags: [{ _id: "t1", name: "my_tag", personalBests: {} }],
  })),
}));

import { __nonReactive, waitForTagsReady } from "../../src/ts/collections/tags";
import { setUserId } from "../../src/ts/states/core";

/**
 * The commandline and result saving read tags through `__nonReactive`, which
 * doesn't subscribe. Loaded only by `waitForTagsReady` in the login flow, the
 * collection must not be garbage collected while nothing subscribes
 * (TanStack DB's default collection gcTime is 5 min).
 */
describe("tags collection", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps its data with no subscriber", async () => {
    setUserId("uid");
    await waitForTagsReady();
    expect(__nonReactive.getTags().map((it) => it.name)).toEqual(["my tag"]);

    await vi.advanceTimersByTimeAsync(10 * 60_000);

    expect(__nonReactive.getTags().map((it) => it.name)).toEqual(["my tag"]);
  });
});
