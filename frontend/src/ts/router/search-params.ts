import { Accessor, createMemo } from "solid-js";

/**
 * A route's search (from `useSearch({ from, shouldThrow: false })`), keeping
 * the last one once the route is left - its page stays on screen while it
 * fades out.
 */
export function keepLastSearch<T>(
  search: Accessor<T | undefined>,
  initial: T,
): Accessor<T> {
  return createMemo<T>((prev) => search() ?? prev, search() ?? initial);
}
