import {
  type Collection,
  type CollectionConfig,
  createCollection,
  type NonSingleResult,
} from "@tanstack/solid-db";
import type { QueryCollectionUtils } from "@tanstack/query-db-collection";
import type { QueryClient } from "@tanstack/solid-query";

/**
 * Session collections: the user-bound query collections, cleared on sign out
 * and downloaded again on sign in. Driven by the auth effect in
 * `queries/index.ts`; create them with `createSessionCollection`, which
 * registers them.
 *
 * Sign out: `resetQueries`/`removeQueries` alone cannot clear a
 * `queryCollectionOptions` collection, it keeps its rows in its own synced
 * state. Optimistic deletes don't stick either (they are dropped once their
 * transaction settles). So the clear cancels in-flight user fetches, deletes
 * every synced row with `utils.writeDelete` (a sync-level write: no mutation
 * handler, nothing sent to the backend), runs each collection's `onSignOut`
 * for state its queryFn keeps outside the collection, then resets the user
 * queries so their data is `undefined` again.
 *
 * Sign in: `utils.refetch()` downloads the next user's rows (a no-op for a
 * collection that never started). The `startSync`'d collections and those
 * started while signed out need it: their query is disabled
 * (`enabled: isAuthenticated`) and never re-evaluates `enabled` on its own.
 * As the query data is `undefined` (reset on sign out, or never fetched), a
 * refetch joins an in-flight download instead of restarting it. The cleared
 * collections stay `ready`, so readiness goes through
 * `waitForSessionCollection`, which waits for this download.
 */

/** What the readiness helpers need of a session collection. */
export type SessionCollection = {
  stateWhenReady(): Promise<unknown>;
};

/** What the sign in / sign out handling needs of a session collection. */
type RegisteredCollection = SessionCollection & {
  _state: {
    syncedData: { keys(): Iterable<string | number> };
    getAcceptedSyncedRow(key: string | number): unknown;
  };
  utils: {
    refetch(): Promise<unknown>;
    writeDelete(keys: (string | number)[]): Promise<void>;
  };
};

type SessionOptions = {
  /** Clears user state the collection's queryFn keeps outside of it. */
  onSignOut?: () => void;
};

const sessionCollections = new Map<RegisteredCollection, SessionOptions>();
const signInDownloads = new Map<SessionCollection, Promise<void>>();
let signOutDone: Promise<void> = Promise.resolve();

/** `createCollection` for a user-bound query collection, registered for the sign in / sign out handling. */
export function createSessionCollection<
  T extends object,
  TKey extends string | number,
  TUtils extends QueryCollectionUtils<T, TKey>,
>(
  options: Omit<CollectionConfig<T, TKey, never, TUtils>, "utils"> & {
    schema?: never;
    utils: TUtils;
  } & NonSingleResult,
  session: SessionOptions = {},
): Collection<T, TKey, TUtils, never, T> & NonSingleResult {
  const collection = createCollection(options);
  sessionCollections.set(collection as RegisteredCollection, session);
  return collection;
}

export async function signOutSession(queryClient: QueryClient): Promise<void> {
  signInDownloads.clear();
  const done = (async () => {
    // A download still running for the previous user must not land.
    await queryClient.cancelQueries({ queryKey: ["user"] });
    await Promise.all(
      [...sessionCollections].map(async ([collection, { onSignOut }]) => {
        const keys = [...collection._state.syncedData.keys()].filter(
          (key) => collection._state.getAcceptedSyncedRow(key) !== undefined,
        );
        if (keys.length > 0) await collection.utils.writeDelete(keys);
        onSignOut?.();
      }),
    );
    await queryClient.resetQueries({ queryKey: ["user"] });
  })();
  signOutDone = done;
  await done;
}

export function signInSession(): void {
  // Register every download before any starts: a queryFn may wait for
  // another session collection (results wait for tags).
  const kicks: (() => void)[] = [];
  for (const collection of sessionCollections.keys()) {
    const download = new Promise<void>((resolve) => {
      kicks.push(() => {
        // A failed download surfaces through the collection's error utils
        // (see `waitForDownload`).
        collection.utils.refetch().then(
          () => resolve(),
          () => resolve(),
        );
      });
    });
    signInDownloads.set(collection, download);
    void download.then(() => {
      if (signInDownloads.get(collection) === download) {
        signInDownloads.delete(collection);
      }
    });
  }
  const kickAll = (): void => {
    for (const kick of kicks) kick();
  };
  // Download even if the clear failed, else readiness would wait forever.
  void signOutDone.then(kickAll, kickAll);
}

/** Waits until the collection is ready with the signed in user's rows. */
export async function waitForSessionCollection(
  collection: SessionCollection,
): Promise<void> {
  await signInDownloads.get(collection);
  await collection.stateWhenReady();
}

/** Whether a sign in download of the collection is still running. */
export function isSessionDownloadPending(
  collection: SessionCollection,
): boolean {
  return signInDownloads.has(collection);
}
