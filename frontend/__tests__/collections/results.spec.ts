import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ts/ape", () => ({
  default: { results: { get: vi.fn() } },
}));

import Ape from "../../src/ts/ape";
import {
  getLastResult,
  waitForResultsReady,
} from "../../src/ts/collections/results";
import { setTestUserId } from "../__harness__/auth-user";

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

function mockResults(ids: { _id: string; timestamp: number }[]): void {
  vi.mocked(Ape.results.get).mockResolvedValue({
    status: 200,
    body: {
      message: "",
      data: ids.map((it) => ({
        ...it,
        wpm: 100,
        rawWpm: 100,
        acc: 100,
        consistency: 100,
        testDuration: 15,
        mode: "time",
        mode2: "15",
        charStats: [0, 0, 0, 0],
      })),
    },
  } as never);
}

describe("results collection: last result", () => {
  beforeEach(async () => {
    setTestUserId(null);
    await flush();
  });

  it("is cleared on sign out, so the next user gets their own", async () => {
    mockResults([
      { _id: "a-old", timestamp: 1 },
      { _id: "a-new", timestamp: 2 },
    ]);
    setTestUserId("userA");
    // the account route's loader starts the download the same way
    await waitForResultsReady();
    await waitFor(() => getLastResult() !== undefined, "user A's results");
    expect(getLastResult()?._id).toBe("a-new");

    setTestUserId(null);
    await flush();
    expect(getLastResult()).toBeUndefined();

    mockResults([{ _id: "b-only", timestamp: 3 }]);
    setTestUserId("userB");
    await waitForResultsReady();
    await waitFor(() => getLastResult() !== undefined, "user B's results");
    expect(getLastResult()?._id).toBe("b-only");
  });
});
