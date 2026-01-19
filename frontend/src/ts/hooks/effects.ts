import { createEffect, on } from "solid-js";
import { debounce } from "throttle-debounce";

type Accessor<T = unknown> = () => T;

type OnValue<T> = T extends readonly Accessor[]
  ? //@ts-expect-error huh?
    { [K in keyof T]: ReturnType<T[K]> }
  : T extends Accessor
    ? ReturnType<T>
    : never;

export function createEffectOn<
  T extends Accessor | readonly Accessor[],
  U = void,
>(
  deps: T,
  fn: (value: OnValue<T>, prev: OnValue<T> | undefined, prevValue?: U) => U,
  options: { defer?: boolean } = {},
): void {
  //@ts-expect-error huh?
  createEffect(on(deps as unknown, fn as unknown, options));
}

export function createDebouncedEffectOn<
  T extends Accessor | readonly Accessor[],
  U = void,
>(
  delay: number,
  deps: T,
  fn: (value: OnValue<T>, prev: OnValue<T> | undefined, prevValue?: U) => U,
  options: { defer?: boolean } = {},
): void {
  const debouncedFn = debounce(delay, fn);
  //@ts-expect-error huh?
  createEffect(on(deps as unknown, debouncedFn as unknown, options));
}
