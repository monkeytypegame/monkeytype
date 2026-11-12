import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/solid-query";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/solid-db";

import {
  clearSessionCollections,
  refetchSessionCollections,
  registerSessionCollection,
} from "../../../src/ts/collections/utils/session-collection";

/**
 * A collection created in the test, not one of the app's modules: covers the
 * session collection registry in isolation.
 */

type SessionTestRow = { _id: string; name: string };

const queryKey: unknown[] = ["user", "sessionTest"];

const queryClient = new QueryClient();

const queryFn = vi.fn(async (): Promise<SessionTestRow[]> => [
  { _id: "row1", name: "Row 1" },
  { _id: "row2", name: "Row 2" },
]);

// The delete mutation handler. The clear must run its sweep in an ambient
// transaction, which bypasses the handlers (no backend sync on sign out).
const onDelete = vi.fn(async () => {
  throw new Error(
    "clearSessionCollections must not invoke the collection delete handler",
  );
});

const collection = createCollection({
  ...queryCollectionOptions({
    queryKey,
    queryClient,
    getKey: (it) => it._id,
    queryFn,
    startSync: true,
  }),
  onDelete,
});

registerSessionCollection({ collection, queryKey });

const rowIds = (): string[] =>
  [...collection.values()].map((it) => it._id).sort();

/** Polls until the predicate holds; fetches settle across microtask turns. */
async function waitFor(predicate: () => boolean, what: string): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 5_000) {
      throw new Error(`timed out waiting for ${what}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe("session collections registry", () => {
  it("clearSessionCollections sweeps the rows and empties the query without calling the delete handler; refetchSessionCollections restarts the download", async () => {
    // startSync downloads the rows at module load.
    await waitFor(() => rowIds().join() === "row1,row2", "initial download");
    expect(collection.status).toBe("ready");
    expect(queryClient.getQueryData(queryKey)).toHaveLength(2);

    clearSessionCollections(queryClient);
    expect(onDelete).not.toHaveBeenCalled();
    expect(rowIds()).toEqual([]);
    expect(queryClient.getQueryData(queryKey)).toEqual([]);

    refetchSessionCollections();
    await waitFor(() => rowIds().join() === "row1,row2", "sign in refetch");
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(queryKey)).toHaveLength(2);
  });
});
