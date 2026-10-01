import { onCleanup } from "solid-js";

type Listener<T> = (value: T) => void;

type EventBus<T> = {
  dispatch: (...args: T extends undefined ? [] : [value: T]) => void;
  subscribe: (fn: Listener<T>) => () => void;
  useListener: (fn: Listener<T>) => void;
};

/**
 * Creates a pub-sub event bus.
 *
 * - `dispatch(value)` notifies all listeners. No args needed when `T` is `undefined`.
 * - `subscribe(fn)` registers a listener, returns an unsubscribe function.
 * - `useListener(fn)` registers a listener that auto-unsubscribes via Solid's `onCleanup`.
 *
 * @example
 * ```ts
 * const clickEvent = createEvent<{ x: number; y: number }>();
 * clickEvent.useListener(({ x, y }) => console.log(x, y));
 * clickEvent.dispatch({ x: 10, y: 20 });
 *
 * const resetEvent = createEvent();
 * resetEvent.useListener(() => console.log("reset"));
 * resetEvent.dispatch();
 * ```
 */

export function createEvent<T = undefined>(): EventBus<T> {
  const listeners = new Set<Listener<T>>();

  function dispatch(...args: T extends undefined ? [] : [value: T]): void {
    const value = args[0] as T;
    for (const fn of listeners) {
      try {
        fn(value);
      } catch (e) {
        console.error(e);
      }
    }
  }

  function subscribe(fn: Listener<T>): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  // Auto-unsubscribes when the Solid owner scope is disposed
  function useListener(fn: Listener<T>): void {
    listeners.add(fn);
    onCleanup(() => listeners.delete(fn));
  }

  return { dispatch, subscribe, useListener };
}
