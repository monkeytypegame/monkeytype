import {
  hashKey,
  type QueryKey,
  replaceEqualDeep,
  useQuery,
  type UseQueryResult,
} from "@tanstack/solid-query";

import { queryClient } from "..";
import { createTrigger } from "../../hooks/createTrigger";
import { DeepReadonly } from "../../utils/types";
import { baseKey } from "./keys";
import { type Rollback, rollbackByField, rollbackById } from "./rollback";

/**
 * Server data held for the signed-in session (user, presets…): downloaded by
 * the auth flow, kept until sign out resets it, never refetched by Query on
 * its own. Written only through `update`. Either one record or a list (which
 * names its items' id): that picks how optimistic mutations roll back.
 */
export type SessionQuery<T> = {
  key: QueryKey;
  /**
   * The cached data, `undefined` while signed out, loading or after a failed
   * download. Reactive inside components and effects, a plain read elsewhere.
   */
  get: () => DeepReadonly<T> | undefined;
  /** A mutable copy of the cached data, detached from the cache. */
  copy: () => T | undefined;
  /**
   * The query for components that need its status (pending, error), eg. with
   * `AsyncContent`. Read-only: it never fetches, so the sign-out reset can't
   * refetch it. Reading `data` while a download runs suspends the nearest
   * `Suspense`; check the status first, or use `get` for plain reads.
   */
  use: () => UseQueryResult<DeepReadonly<T>>;
  /** Downloads into the cache; throws if the request fails. */
  download: () => Promise<void>;
  /** Leaves no data. */
  reset: () => void;
  /** Applies `recipe` to a copy of the cached data; no-op without data. */
  update: (recipe: (data: T) => void) => void;
  /** Replaces the cached data without a download, for tests. */
  replace: (data: T | undefined) => void;
  /**
   * How optimistic mutations on this query roll back: by id for a list, by
   * field for one record.
   */
  rollback: Rollback<T>;
};

/** A list query names its items' id (rollback by id); a record doesn't. */
type ShapeOptions<T> = T extends readonly (infer I)[]
  ? { id: (item: I) => string }
  : { id?: never };

export function createSessionQuery<T>(
  options: {
    /** Unique among the user's queries; the key is `["user", name]`. */
    name: string;
    fetch: () => Promise<T>;
  } & ShapeOptions<T>,
): SessionQuery<T> {
  // user-scoped by definition: sign out resets every `["user", ...]` query,
  // which is what clears the session's data
  const key = baseKey(options.name, { isUserSpecific: true });
  type Cached = DeepReadonly<T>;
  const rollback = (
    options.id === undefined
      ? rollbackByField<T & object>()
      : rollbackById(options.id)
  ) as Rollback<T>;

  queryClient.setQueryDefaults(key, {
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    // offline, fail at once (the sign in shows the error) instead of pausing
    networkMode: "always",
  });

  const peek = (): Cached | undefined => queryClient.getQueryData<Cached>(key);

  // Re-runs `get()` readers when the cached data changes: at once after this
  // module's writes, and from the cache listener for other changes (fetch,
  // reset), which Query notifies a tick later. Readers re-run on any change;
  // `update` keeps the unchanged parts' identity, so memos and `For` over a
  // part that didn't change don't re-render.
  const [track, trigger] = createTrigger();
  let lastSeen: Cached | undefined;
  const notifyIfChanged = (): void => {
    const data = peek();
    if (data === lastSeen) return;
    lastSeen = data;
    trigger();
  };

  const hash = hashKey(key);
  queryClient.getQueryCache().subscribe((event) => {
    if (event.query.queryHash === hash) notifyIfChanged();
  });

  const reset = (): void => {
    void queryClient.resetQueries({ queryKey: key, exact: true });
    notifyIfChanged();
  };

  return {
    key,
    rollback,
    get: () => {
      track();
      return peek();
    },
    copy: () => {
      const data = peek();
      return data === undefined ? undefined : (structuredClone(data) as T);
    },
    use: () =>
      useQuery<Cached>(
        () => ({ queryKey: key, enabled: false }),
        () => queryClient,
      ),
    download: async () => {
      await queryClient.query({
        queryKey: key,
        queryFn: options.fetch,
        // the sign in (or retry) always downloads
        staleTime: 0,
      });
      notifyIfChanged();
    },
    reset,
    update: (recipe) => {
      if (peek() === undefined) return;
      queryClient.setQueryData<Cached>(key, (data) => {
        if (data === undefined) return data;
        const next = structuredClone(data) as T;
        recipe(next);
        // keeps the unchanged parts' identity (and the whole value's, when
        // nothing changed); done here, since `useQuery` turns the query's own
        // off
        return replaceEqualDeep(data, next as Cached);
      });
      notifyIfChanged();
    },
    replace: (data) => {
      if (data === undefined) {
        reset();
        return;
      }
      queryClient.setQueryData<Cached>(key, structuredClone(data) as Cached);
      notifyIfChanged();
    },
  };
}
