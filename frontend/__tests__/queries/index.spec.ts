import {
  type MockInstance,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { QueryClient } from "@tanstack/solid-query";

import * as sessionCollection from "../../src/ts/collections/utils/session-collection";
import { queryClient } from "../../src/ts/queries/index";
import { setUserId } from "../../src/ts/states/core";

/**
 * The app drops every user query and session collection when the auth state
 * changes (`queries/index.ts` owns the effect; this module's queryClient is
 * the one it resets). The effect is module-level, so the test drives the real
 * `isAuthenticated` signal and spies on the real query client and the session
 * collection registry functions. No session collection is registered in this
 * spec's module graph, so the spied registry functions no-op.
 *
 * Regression: resetting on sign *in* raced the collections' own initial
 * download (live queries fetch on first subscribe) and fetched the
 * connections collection twice on the test page. The reset is for sign out.
 */

type ResetSpy = MockInstance<QueryClient["resetQueries"]>;
type ClearSpy = MockInstance<typeof sessionCollection.clearSessionCollections>;
type RefetchSpy = MockInstance<
  typeof sessionCollection.refetchSessionCollections
>;

/** Lets a queued effect update run (a set signal flushes on the next turn). */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("user queries on auth state change", () => {
  let reset: ResetSpy;

  beforeEach(async () => {
    setUserId(null);
    await flush();
    reset = vi
      .spyOn(queryClient, "resetQueries")
      // don't actually touch the client while asserting
      .mockImplementation(async () => undefined);
  });

  it("resets the user queries on sign out", async () => {
    setUserId("uid");
    await flush();
    reset.mockClear();

    setUserId(null);
    await flush();

    expect(reset).toHaveBeenCalledWith({ queryKey: ["user"] });
  });

  it("does not reset the user queries on sign in", async () => {
    setUserId(null);
    await flush();
    reset.mockClear();

    setUserId("uid");
    await flush();

    expect(reset).not.toHaveBeenCalled();
  });
});

describe("session collections on auth state change", () => {
  let clear: ClearSpy;
  let refetch: RefetchSpy;

  beforeEach(async () => {
    setUserId(null);
    await flush();
    clear = vi.spyOn(sessionCollection, "clearSessionCollections");
    refetch = vi.spyOn(sessionCollection, "refetchSessionCollections");
  });

  it("clears the session collections on sign out", async () => {
    setUserId("uid");
    await flush();
    clear.mockClear();

    setUserId(null);
    await flush();

    expect(clear).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledWith(queryClient);
  });

  it("does not clear the session collections on sign in", async () => {
    setUserId(null);
    await flush();
    clear.mockClear();

    setUserId("uid");
    await flush();

    expect(clear).not.toHaveBeenCalled();
  });

  it("refetches the session collections on sign in", async () => {
    setUserId(null);
    await flush();
    refetch.mockClear();

    setUserId("uid");
    await flush();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("does not refetch the session collections on sign out", async () => {
    setUserId("uid");
    await flush();
    refetch.mockClear();

    setUserId(null);
    await flush();

    expect(refetch).not.toHaveBeenCalled();
  });
});
