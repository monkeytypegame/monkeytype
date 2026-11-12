import {
  MutationObserver,
  type MutationObserverOptions,
  replaceEqualDeep,
} from "@tanstack/solid-query";
import { Result } from "@monkeytype/util/trycatch";

import { queryClient } from "..";
import type { SessionQuery } from "./session-query";

/** What `onMutate` saw and wrote, for the rollback. */
type FieldRollback<T> = {
  before: T;
  written: T;
  changed: (keyof T)[];
};

export type OptimisticMutation<T, V> = MutationObserverOptions<
  V,
  Error,
  V,
  FieldRollback<T>
>;

/** Deep equality of plain data (key order doesn't matter). */
const deepEqual = (a: unknown, b: unknown): boolean =>
  replaceEqualDeep(a, b) === a;

/**
 * A TanStack mutation on a session query's data (an object): applies `recipe`
 * with its variables at once and sends `request`, which resolves to the values
 * to keep (the server may change them) or throws; the recipe is applied again
 * with those. On failure the top-level fields the recipe changed are rolled
 * back, except those changed again since (by a direct write or another
 * mutation), which keep the newer value. The recipe must be idempotent.
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
      const changed = (
        Object.keys({ ...before, ...written }) as (keyof T)[]
      ).filter((key) => !deepEqual(before[key], written[key]));
      return { before, written, changed };
    },
    onError: (_error, _vars, rollback) => {
      if (rollback === undefined) return;
      const { before, written, changed } = rollback;
      query.update((data) => {
        for (const key of changed) {
          if (!deepEqual(data[key], written[key])) continue;
          data[key] = before[key];
        }
      });
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
