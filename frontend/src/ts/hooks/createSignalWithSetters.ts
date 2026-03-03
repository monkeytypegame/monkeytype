import { createSignal } from "solid-js";

/** The raw SolidJS setter, accepting a value or an updater function. */
type OriginalSetter<T> = (value: T | ((prev: T) => T)) => void;

/**
 * A named setter definition. Receives the raw setter as its first argument,
 * followed by any custom arguments.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SetterFn<T> = (originalSetter: OriginalSetter<T>, ...args: any[]) => void;

/** Extracts the custom argument types from a {@link SetterFn}, dropping the leading `originalSetter`. */
type SetterArgs<T, S extends SetterFn<T>> = S extends (
  orig: OriginalSetter<T>,
  ...args: infer A
) => void
  ? A
  : never;

/** A map of named {@link SetterFn} definitions keyed by setter name. */
type SettersMap<T> = Record<string, SetterFn<T>>;

/**
 * The object returned alongside the getter. Each key from `S` becomes a
 * bound setter with its custom signature, and `set` exposes the raw
 * {@link OriginalSetter} for direct use.
 */
type MappedSetters<T, S extends SettersMap<T>> = {
  [K in keyof S]: (...args: SetterArgs<T, S[K]>) => void;
} & {
  set: OriginalSetter<T>;
};

/**
 * Creates a SolidJS signal together with a set of named, pre-bound setters.
 *
 * Usage is curried so that TypeScript can infer `T` from `defaultValue` while
 * still inferring `S` from the `setters` object passed in the second call.
 *
 * @example
 * ```ts
 * const [count, { increment, decrement, set }] = createSignalWithSetters(0)({
 *   increment: (set) => set((n) => n + 1),
 *   decrement: (set) => set((n) => n - 1),
 * });
 * ```
 *
 * @param defaultValue - Initial value for the underlying SolidJS signal.
 * @returns A curried function that accepts a {@link SettersMap} and returns
 *   a `[getter, setters]` tuple, where `setters` contains each named setter
 *   plus a raw `set` passthrough.
 */
export function createSignalWithSetters<T>(defaultValue: T) {
  return function <S extends SettersMap<T>>(
    setters: S,
  ): [() => T, MappedSetters<T, S>] {
    const [get, _set] = createSignal<T>(defaultValue);
    const mapped = Object.fromEntries(
      Object.entries(setters).map(([key, setter]) => [
        key,
        (...args: never[]) => setter(_set, ...args),
      ]),
    ) as unknown as MappedSetters<T, S>;
    return [get, { ...mapped, set: _set }];
  };
}
