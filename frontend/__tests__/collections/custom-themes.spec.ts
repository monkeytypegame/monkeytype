import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ts/ape", () => ({
  default: {
    users: {
      getCustomThemes: vi.fn(async () => ({
        status: 200,
        body: { data: [] },
      })),
    },
  },
}));

import Ape from "../../src/ts/ape";
import "../../src/ts/collections/custom-themes";
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
    .findAll({ queryKey: ["user", "customThemes"] })
    .some((query) => query.state.data !== undefined);
}

/**
 * Like the filter presets collection: its sync starts at module load
 * (`startSync: true`), which in the app is before the auth state resolves, so
 * its query starts disabled and never re-evaluates `enabled` on its own.
 * Sign in must kick the download: the footer's theme indicator and the
 * settings' theme list read it, and the account-independent readers are not
 * guaranteed to run after a sign in.
 */
describe("customThemes collection", () => {
  beforeEach(async () => {
    setUserId(null);
    await flush();
    vi.mocked(Ape.users.getCustomThemes).mockClear();
  });

  it("does not download while signed out", async () => {
    await flush();
    expect(Ape.users.getCustomThemes).not.toHaveBeenCalled();
  });

  it("downloads after sign in", async () => {
    setUserId("uid");
    await waitFor(hasDownloaded, "the customThemes query to fetch");
    expect(Ape.users.getCustomThemes).toHaveBeenCalled();
  });
});
