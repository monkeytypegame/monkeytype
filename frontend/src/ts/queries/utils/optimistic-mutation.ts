import {
  MutationObserver,
  type MutationObserverOptions,
  replaceEqualDeep,
} from "@tanstack/solid-query";
import { Result } from "@monkeytype/util/trycatch";

import { queryClient } from "..";
import type { SessionQuery } from "./session-query";

/**
 * How a failed optimistic mutation undoes its change. Given the data before
 * and after its optimistic write, returns the undo, which runs on the current
 * data: it restores what the mutation changed, except what was changed again
 * since (by a direct write or another mutation), which keeps the newer value.
 * The query's shape picks it: by id for a list, by field for one record.
 */
type Rollback<T> = (before: T, written: T) => (data: T) => void;

/** Deep equality of plain data (key order doesn't matter). */
const deepEqual = (a: unknown, b: unknown): boolean =>
  replaceEqualDeep(a, b) === a;

/** For one record: rolls back the top-level fields the mutation changed. */
function rollbackByField<T extends object>(): Rollback<T> {
  return (before, written) => {
    const changed = (
      Object.keys({ ...before, ...written }) as (keyof T)[]
    ).filter((key) => !deepEqual(before[key], written[key]));
    return (data) => {
      for (const key of changed) {
        if (!deepEqual(data[key], written[key])) continue;
        data[key] = before[key];
      }
    };
  };
}

/**
 * For a list: rolls back the items the mutation changed, by id, so mutations
 * on different items don't undo each other. An edited item gets its old value
 * back, an added one is removed, a removed one goes back where it was. Works
 * on the list in place.
 */
function rollbackById<I>(id: (item: I) => string): Rollback<I[]> {
  return (before, written) => {
    const beforeById = new Map(before.map((item) => [id(item), item]));
    const writtenById = new Map(written.map((item) => [id(item), item]));
    const changed = [
      ...new Set([...beforeById.keys(), ...writtenById.keys()]),
    ].filter((key) => !deepEqual(beforeById.get(key), writtenById.get(key)));

    return (items) => {
      for (const key of changed) {
        const index = items.findIndex((item) => id(item) === key);
        const current = index === -1 ? undefined : items[index];
        if (!deepEqual(current, writtenById.get(key))) continue;

        const old = beforeById.get(key);
        if (old === undefined) {
          // added by the mutation
          items.splice(index, 1);
        } else if (index === -1) {
          // removed by the mutation: back at its old position
          const at = before.findIndex((item) => id(item) === key);
          items.splice(Math.min(at, items.length), 0, old);
        } else {
          items[index] = old;
        }
      }
    };
  };
}

/** What `onMutate` hands to `onError`. */
type Undo<T> = { undo: (data: T) => void };

export type OptimisticMutation<T, V> = MutationObserverOptions<
  V,
  Error,
  V,
  Undo<T>
>;

/** An API response: a non-200 carries the server's message. */
export type ApiResponse = { status: number; body: { message: string } };

/** The 200 variant of an API response. */
export type OkResponse<R extends ApiResponse> = Extract<R, { status: 200 }>;

/**
 * A TanStack mutation on a session query's data: applies `recipe` at once,
 * sends `request`, and on a 200 applies `recipe` again with the server's
 * values (`fromResponse`). On failure (a non-200, with the server's message, or
 * a thrown request) the change is undone by the query's shape: by field for
 * one record, by id for a list.
 */
export function optimisticMutation<T extends object, V, R extends ApiResponse>(
  options: MutationOptions<T, V, R> & { query: SessionQuery<T> },
): OptimisticMutation<T, V> {
  const { query, recipe, request, fromResponse } = options;
  const rollback = (
    query.id === undefined
      ? rollbackByField<T>()
      : rollbackById(query.id as (item: unknown) => string)
  ) as Rollback<T>;
  return {
    mutationKey: [...query.key, options.name],
    mutationFn: async (vars) => {
      const response = await request(vars);
      if (response.status !== 200) throw new Error(response.body.message);
      return fromResponse === undefined
        ? vars
        : fromResponse(vars, response as OkResponse<R>);
    },
    // offline, fail and roll back at once instead of pausing until online
    networkMode: "always",
    onMutate: (vars) => {
      const before = query.copy();
      if (before === undefined) throw new Error("Not signed in");
      query.update((data) => recipe(data, vars));
      const written = query.copy() ?? before;
      return { undo: rollback(before, written) };
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

/** What a mutation names, beside its query: see `optimisticMutation`. */
export type MutationOptions<T, V, R extends ApiResponse> = {
  /** Unique within the query; the mutation key is the query's key plus it. */
  name: string;
  /**
   * Writes the change into a copy of the query's data: a list in place, a
   * record by field. Runs twice: at once with the variables as sent, and on a
   * 200 with `fromResponse`'s values. So it must be idempotent: an insert with
   * a temporary id must replace that item on the second run, not add a second
   * one.
   */
  recipe: (data: T, vars: V) => void;
  /**
   * Sends the change; returns the API response unchecked. A non-200 fails the
   * mutation with the server's message and rolls the change back.
   */
  request: (vars: V) => Promise<R>;
  /**
   * The values `recipe` applies on a 200, read from the response (the server
   * may assign an id or sanitize a value). Left out: the variables as sent.
   */
  fromResponse?: (vars: V, response: OkResponse<R>) => V;
};

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
