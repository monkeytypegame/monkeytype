import { createSignal } from "solid-js";

/**
 * Creates a valueless signal for forcing reactive re-runs.
 *
 * - `track()` subscribes the current computation.
 * - `trigger()` re-runs every computation that tracked it.
 *
 * @example
 * ```ts
 * const [track, trigger] = createTrigger();
 * createEffect(() => {
 *   track();
 *   measure();
 * });
 * window.addEventListener("resize", trigger);
 * ```
 */
export function createTrigger(): [track: () => void, trigger: () => void] {
  const [track, set] = createSignal(undefined, { equals: false });
  return [track, () => set()];
}
