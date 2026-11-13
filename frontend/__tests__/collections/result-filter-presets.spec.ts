import { beforeEach, describe, expect, it } from "vitest";

import "../../src/ts/collections/result-filter-presets";
import { getDefaultUserData } from "../../src/ts/constants/user-data";
import { queryClient } from "../../src/ts/queries/index";
import { __testing } from "../../src/ts/queries/user";
import { setUserId } from "../../src/ts/states/core";

/** Lets a queued effect update run (a set signal flushes on the next turn). */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/** Polls until the predicate holds; fetches settle across microtask turns. */
async function waitFor(predicate: () => boolean, what: string): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 2_000) {
      throw new Error(`timed out waiting for ${what}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

/** The collection's downloaded presets' names, if it fetched. */
function downloaded(): string[] | undefined {
  const data = queryClient
    .getQueryCache()
    .findAll({ queryKey: ["user", "resultFilterPresets"] })
    .find((query) => query.state.data !== undefined)?.state.data as
    | { name: string }[]
    | undefined;
  return data?.map((it) => it.name);
}

/**
 * The collection starts its sync at module load (`startSync: true`), which in
 * the app is before the auth state resolves, so its query starts disabled.
 * When the user query has the user, the collection still has to read its data:
 * the account page's filter presets section only shows it once the query
 * fetched, and nothing else starts the download.
 *
 * Regression: dropping the sign-in `resetQueries` (the kick the disabled
 * query relied on) left the account page's presets section on a spinner
 * forever.
 */
describe("resultFilterPresets collection", () => {
  beforeEach(async () => {
    __testing.setUser(undefined);
    setUserId(null);
    await flush();
  });

  it("does not download without a user", async () => {
    setUserId("uid");
    await flush();
    expect(downloaded()).toBeUndefined();
  });

  it("reads the presets from the user query once it has the user", async () => {
    setUserId("uid");
    __testing.setUser({
      ...getDefaultUserData(),
      resultFilterPresets: [{ _id: "p1", name: "my preset" } as never],
    });
    await waitFor(
      () => downloaded() !== undefined,
      "the resultFilterPresets query to fetch",
    );
    expect(downloaded()).toEqual(["my preset"]);
  });
});
