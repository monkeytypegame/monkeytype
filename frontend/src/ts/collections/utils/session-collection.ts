import { createTransaction } from "@tanstack/solid-db";
import type { QueryClient } from "@tanstack/solid-query";

/**
 * Registry of the session collections for the sign in / sign out
 * cleanup driven by the auth effect in `queries/index.ts` (the collection
 * modules register at module load).
 *
 * `queryClient.resetQueries`/`removeQueries` alone cannot clear a
 * `queryCollectionOptions` collection: the collection keeps its rows in its
 * own normalized state, which resetting or removing the query never touches
 * (the sync only applies successful fetches). So on sign out the clear
 * sweeps every row of the collection (in a transaction, since the
 * collections have no `onDelete` handler — and locally written rows the
 * query does not own would survive the sync anyway), then empties the
 * backing query with `setQueryData(rootKey, [])`, which the sync applies,
 * dropping the query's ownership and the cache copy.
 *
 * On sign in, `collection.utils.refetch()` restarts the download for the
 * next user. A collection that never downloaded has no query, so the
 * refetch is a no-op; the `startSync`'d ones need it unconditionally, as
 * their query starts disabled (created at module load, before the auth
 * state resolves) and never re-evaluates `enabled` on its own. A refetch
 * never double-downloads: it joins an in-flight initial download.
 */

export type SessionCollection = {
  collection: {
    values(): Iterable<object>;
    getKeyFromItem(item: object): string;
    delete(keys: string | string[]): unknown;
    utils: { refetch(): unknown };
  };
  queryKey: unknown[];
};

const sessionCollections: SessionCollection[] = [];

export function registerSessionCollection(collection: SessionCollection): void {
  sessionCollections.push(collection);
}

export function clearSessionCollections(queryClient: QueryClient): void {
  for (const { collection, queryKey } of sessionCollections) {
    const keys = [...collection.values()].map((row) =>
      collection.getKeyFromItem(row),
    );
    if (keys.length > 0) {
      createTransaction({ mutationFn: async () => undefined }).mutate(() => {
        collection.delete(keys);
      });
    }
    if (queryClient.getQueryCache().find({ queryKey, exact: true })) {
      queryClient.setQueryData(queryKey, []);
    }
  }
}

export function refetchSessionCollections(): void {
  for (const { collection } of sessionCollections) {
    void collection.utils.refetch();
  }
}
