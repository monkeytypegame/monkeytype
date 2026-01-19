import { createEffect, on } from "solid-js";
import { debounce } from "throttle-debounce";

export function createDebouncedEffectOn<
  // oxlint-disable-next-line typescript/no-explicit-any
  T extends Array<() => any> | (() => any),
  U,
>(
  delay: number,
  deps: T,
  fn: (input: T, prevInput: T, prevValue?: U) => U,
  options: { defer?: boolean } = {},
): void {
  const debouncedFn = debounce(delay, fn);

  //@ts-expect-error not sure how to type this
  createEffect(on(deps, debouncedFn, options));
}
