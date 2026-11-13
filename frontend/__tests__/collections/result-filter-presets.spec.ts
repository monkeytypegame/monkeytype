import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ts/ape/user", () => ({
  fetchUserFromApi: vi.fn(async () => undefined),
}));

import { fetchUserFromApi } from "../../src/ts/ape/user";
import "../../src/ts/collections/result-filter-presets";
import { queryClient } from "../../src/ts/queries/index";
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

/** Whether the collection's query fetched at least once. */
function hasDownloaded(): boolean {
  return queryClient
    .getQueryCache()
    .findAll({ queryKey: ["user", "resultFilterPresets"] })
    .some((query) => query.state.data !== undefined);
}

/**
 * The collection starts its sync at module load (`startSync: true`), which in
 * the app is before the auth state resolves, so its query starts disabled.
 * When the user signs in, the collection still has to download its data:
 * the account page's filter presets section only shows it once the query
 * fetched, and nothing else starts the download.
 *
 * Regression: dropping the sign-in `resetQueries` (the kick the disabled
 * query relied on) left the account page's presets section on a spinner
 * forever.
 */
describe("resultFilterPresets collection", () => {
  beforeEach(async () => {
    setUserId(null);
    await flush();
    vi.mocked(fetchUserFromApi).mockClear();
  });

  it("does not download while signed out", async () => {
    await flush();
    expect(fetchUserFromApi).not.toHaveBeenCalled();
  });

  it("downloads after sign in", async () => {
    setUserId("uid");
    await waitFor(hasDownloaded, "the resultFilterPresets query to fetch");
    expect(fetchUserFromApi).toHaveBeenCalled();
  });
});
