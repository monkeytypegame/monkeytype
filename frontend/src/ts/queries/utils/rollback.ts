import { replaceEqualDeep } from "@tanstack/solid-query";

/**
 * How a failed optimistic mutation undoes its change. Given the data before
 * and after its optimistic write, returns the undo, which runs on the current
 * data: it restores what the mutation changed, except what was changed again
 * since (by a direct write or another mutation), which keeps the newer value.
 * Each session query picks its rollback from its shape (see
 * `createSessionQuery`).
 */
export type Rollback<T> = (before: T, written: T) => (data: T) => void;

/** Deep equality of plain data (key order doesn't matter). */
const deepEqual = (a: unknown, b: unknown): boolean =>
  replaceEqualDeep(a, b) === a;

/** For one record: rolls back the top-level fields the mutation changed. */
export function rollbackByField<T extends object>(): Rollback<T> {
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
export function rollbackById<I>(id: (item: I) => string): Rollback<I[]> {
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
