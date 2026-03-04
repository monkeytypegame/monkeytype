import { Accessor, createSignal } from "solid-js";

/**
 * Creates a reactive event primitive.
 *
 * Returns a tuple of:
 * - An accessor whose value increments each time the event is dispatched.
 *   Reactive consumers (effects, memos, etc.) re-run whenever the event fires.
 * - A dispatch function that triggers the event.
 *
 * @returns `[accessor, dispatch]`
 *
 * @example
 * ```ts
 * const [onSave, dispatchSave] = createEvent();
 *
 * createEffect(() => {
 *   onSave(); // re-runs every time dispatchSave() is called
 *   console.log("saved!");
 * });
 *
 * dispatchSave(); // triggers the effect
 * ```
 */

export function createEvent(): [Accessor<number>, () => void] {
  const [get, set] = createSignal(0);
  return [
    get,
    () => {
      set((v) => v + 1);
    },
  ];
}
