import { createEffect, on } from "solid-js";

// oxlint-disable-next-line typescript/no-explicit-any
export function createEffectOn<T extends Array<() => any> | (() => any), U>(
  deps: T,
  fn: (input: T, prevInput: T, prevValue?: U) => U,
  options: { defer?: boolean } = {},
): void {
  //@ts-expect-error not sure how to type this
  createEffect(on(deps, fn, options));
}
