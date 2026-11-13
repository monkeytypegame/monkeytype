import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/solid-query";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createSignal } from "solid-js";

import {
  createSessionCollection,
  signInSession,
  signOutSession,
  waitForSessionCollection,
} from "../../../src/ts/collections/utils/session-collection";

/**
 * Collections created in the test, not the app's modules: covers the session
 * collection registry in isolation. The auth state is a local signal, like
 * the app's `isAuthenticated` the collections' queries are `enabled` by.
 */

type Row = { _id: string; user: string };

const queryClient = new QueryClient();
const [isSignedIn, setSignedIn] = createSignal(true);
let user = "A";

// The clear must not go through the mutation handlers (no backend sync on
// sign out).
const onDelete = vi.fn(async () => {
  throw new Error("the sign out clear must not invoke the delete handler");
});

// oxlint-disable-next-line typescript/explicit-function-return-type
function makeCollection(name: string, opts: { startSync?: true } = {}) {
  const queryFn = vi.fn(async (): Promise<Row[]> => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return [
      { _id: `${user}1`, user },
      { _id: `${user}2`, user },
    ];
  });
  const onSignOut = vi.fn();
  const collection = createSessionCollection(
    {
      ...queryCollectionOptions({
        queryKey: ["user", name],
        queryClient,
        enabled: isSignedIn,
        getKey: (it: Row) => it._id,
        queryFn,
        ...opts,
      }),
      onDelete,
    },
    { onSignOut },
  );
  return { collection, queryFn, onSignOut };
}

const eager = makeCollection("eager", { startSync: true });
const lazy = makeCollection("lazy");

const rowIds = (c: { values(): Iterable<Row> }): string[] =>
  [...c.values()].map((it) => it._id).sort();

const settle = async (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 50));

async function signOut(): Promise<void> {
  setSignedIn(false);
  await signOutSession(queryClient);
}

function signIn(next: string): void {
  user = next;
  setSignedIn(true);
  signInSession();
}

describe("session collections", () => {
  beforeEach(async () => {
    // Every test starts with user A signed in and both collections loaded.
    if (!isSignedIn() || user !== "A") {
      await signOut();
      signIn("A");
    }
    eager.collection.startSyncImmediate();
    const sub = lazy.collection.subscribeChanges(() => undefined);
    await waitForSessionCollection(eager.collection);
    await waitForSessionCollection(lazy.collection);
    sub.unsubscribe();
    expect(rowIds(eager.collection)).toEqual(["A1", "A2"]);
    expect(rowIds(lazy.collection)).toEqual(["A1", "A2"]);
    vi.clearAllMocks();
  });

  it("sign out keeps the collections empty, also without subscribers and with direct writes", async () => {
    await eager.collection.utils.writeInsert({ _id: "A3", user: "A" });

    await signOut();
    await settle();

    expect(rowIds(eager.collection)).toEqual([]);
    expect(rowIds(lazy.collection)).toEqual([]);
    expect(onDelete).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["user", "eager"])).toBeUndefined();
    expect(queryClient.getQueryData(["user", "lazy"])).toBeUndefined();
  });

  it("sign out runs each collection's onSignOut", async () => {
    await signOut();

    expect(eager.onSignOut).toHaveBeenCalledTimes(1);
    expect(lazy.onSignOut).toHaveBeenCalledTimes(1);
  });

  it("sign in downloads the next user's rows once; readiness waits for them", async () => {
    await signOut();
    signIn("B");

    // The cleared collections are still `ready`: readiness must wait for
    // the new user's download, not resolve on the empty collection.
    await waitForSessionCollection(eager.collection);
    expect(rowIds(eager.collection)).toEqual(["B1", "B2"]);
    await waitForSessionCollection(lazy.collection);
    expect(rowIds(lazy.collection)).toEqual(["B1", "B2"]);

    await settle();
    expect(eager.queryFn).toHaveBeenCalledTimes(1);
    expect(lazy.queryFn).toHaveBeenCalledTimes(1);
  });

  it("sign in joins an in-flight download instead of restarting it", async () => {
    await signOut();
    user = "B";
    setSignedIn(true);
    const inFlight = eager.collection.utils.refetch();
    signInSession();
    await inFlight;
    await waitForSessionCollection(eager.collection);
    await settle();

    expect(rowIds(eager.collection)).toEqual(["B1", "B2"]);
    expect(eager.queryFn).toHaveBeenCalledTimes(1);
  });
});
