import { Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import { debounce } from "throttle-debounce";

/**
 * Derives a debounced accessor from a reactive source. The returned accessor
 * updates at most once per `delay` ms after the source stops changing.
 */
export function createDebouncedSignal<T>(
  source: Accessor<T>,
  delay: number,
): Accessor<T> {
  const [value, setValue] = createSignal(source());

  const update = debounce(delay, (next: T) => setValue(() => next));
  onCleanup(() => update.cancel());

  createEffect(() => update(source()));

  return value;
}
