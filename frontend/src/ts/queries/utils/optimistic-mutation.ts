import {
  MutationObserver,
  type MutationObserverOptions,
} from "@tanstack/solid-query";
import { Result } from "@monkeytype/util/trycatch";

import { queryClient } from "..";
import type { SessionQuery } from "./session-query";

/** What `onMutate` hands to `onError`. */
type Undo<T> = { undo: (data: T) => void };

export type OptimisticMutation<T, V> = MutationObserverOptions<
  V,
  Error,
  V,
  Undo<T>
>;

/**
 * A TanStack mutation on a session query's data: applies `recipe` with its
 * variables at once and sends `request`, which resolves to the values to keep
 * (the server may change them) or throws; the recipe is applied again with
 * those. On failure the query's rollback undoes the change: by field for one
 * record, by id for a list. The recipe must be idempotent: on success it runs
 * again with the kept values, so an insert with a temporary id must replace
 * that item, not add a second one. A list recipe edits the list in place.
 */
export function optimisticMutation<T extends object, V>(options: {
  query: SessionQuery<T>;
  name: string;
  recipe: (data: T, vars: V) => void;
  request: (vars: V) => Promise<V>;
}): OptimisticMutation<T, V> {
  const { query, recipe } = options;
  return {
    mutationKey: [...query.key, options.name],
    mutationFn: options.request,
    // offline, fail and roll back at once instead of pausing until online
    networkMode: "always",
    onMutate: (vars) => {
      const before = query.copy();
      if (before === undefined) throw new Error("Not signed in");
      query.update((data) => recipe(data, vars));
      const written = query.copy() ?? before;
      return { undo: query.rollback(before, written) };
    },
    onError: (_error, _vars, rollbackResult) => {
      if (rollbackResult === undefined) return;
      query.update(rollbackResult.undo);
    },
    onSuccess: (kept) => {
      query.update((data) => recipe(data, kept));
    },
  };
}

/**
 * Runs a mutation outside a component (`useMutation` takes the same options
 * inside one). Failure is returned as `error`, never thrown, so callers see it
 * in the type.
 */
export async function runMutation<T, V>(
  options: OptimisticMutation<T, V>,
  vars: V,
): Promise<Result<void>> {
  try {
    await new MutationObserver(queryClient, options).mutate(vars);
    return { data: undefined, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
