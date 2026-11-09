import {
  type MockInstance,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { QueryClient } from "@tanstack/solid-query";

import { queryClient } from "../../src/ts/queries/index";
import { setUserId } from "../../src/ts/states/core";

/**
 * The app drops every user-scoped query/collection when the auth state
 * changes (`queries/index.ts` owns the effect; this module's queryClient is
 * the one it resets). The effect is module-level, so the test drives the real
 * `isAuthenticated` signal and spies on the real query client.
 *
 * Regression: resetting on sign *in* raced the collections' own initial
 * download (live queries fetch on first subscribe) and fetched the
 * connections collection twice on the test page. The reset is for sign out.
 */

type ResetSpy = MockInstance<QueryClient["resetQueries"]>;

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
